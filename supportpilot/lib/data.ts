import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildAnalytics, utcWindowStart, type AnalyticsSnapshot } from "@/lib/analytics/build";
import { getBillingSnapshot } from "@/lib/billing/usage";
import type { CopilotSource } from "@/lib/ai/types";
import type { AiGeneration, AppUser, Customer, CustomerDirectoryRow, Invite, KnowledgeDocument, Message, MessageAttachment, Organization, TicketStatus, TicketWithCustomer } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return profile as AppUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getOrganization(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  return data ? ({ ...data, is_demo: data.is_demo !== false } as Organization) : null;
}

export async function listTeammates(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function listInvites(organizationId: string, includeTokens = false) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as Invite[];
  if (includeTokens) return rows;
  return rows.map((invite) => ({ ...invite, token: "" }));
}

export async function getDashboardStats(organizationId: string) {
  const supabase = await createClient();

  const [{ count: openCount }, { count: pendingCount }, { count: resolvedCount }, { count: assistedCount }, { count: customerCount }, { count: documentCount }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "open"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "resolved"),
      supabase
        .from("ai_generations")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("knowledge_documents")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

  return {
    openTickets: openCount ?? 0,
    pendingTickets: pendingCount ?? 0,
    resolvedTickets: resolvedCount ?? 0,
    aiAssisted: assistedCount ?? 0,
    customers: customerCount ?? 0,
    documents: documentCount ?? 0,
  };
}

export async function listTickets(organizationId: string, status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email), assignee:users!assigned_to(id, full_name)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TicketWithCustomer[];
}

export async function getTicket(organizationId: string, ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email), assignee:users!assigned_to(id, full_name)")
    .eq("organization_id", organizationId)
    .eq("id", ticketId)
    .single();

  if (error) return null;
  return data as TicketWithCustomer;
}

export async function listMessages(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function listMessageAttachments(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as MessageAttachment[];
  const withUrls = await Promise.all(
    rows.map(async (attachment) => {
      const { data: signed } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(attachment.file_path, 3600);
      return { ...attachment, url: signed?.signedUrl ?? null };
    }),
  );

  return withUrls;
}

export async function listCustomers(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Customer[];
}

type TicketLite = {
  id: string;
  customer_id: string;
  subject: string;
  status: TicketStatus;
  last_message_at: string;
  ticket_number: number;
};

export async function listCustomerDirectory(organizationId: string) {
  const supabase = await createClient();
  const [{ data: customers, error: customerError }, { data: tickets, error: ticketError }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("organization_id", organizationId),
      supabase
        .from("tickets")
        .select("id, customer_id, subject, status, last_message_at, ticket_number")
        .eq("organization_id", organizationId)
        .order("last_message_at", { ascending: false }),
    ]);

  if (customerError) throw customerError;
  if (ticketError) throw ticketError;

  const byCustomer = new Map<string, TicketLite[]>();
  for (const ticket of (tickets ?? []) as TicketLite[]) {
    const list = byCustomer.get(ticket.customer_id) ?? [];
    list.push(ticket);
    byCustomer.set(ticket.customer_id, list);
  }

  const rows: CustomerDirectoryRow[] = ((customers ?? []) as Customer[]).map((customer) => {
    const list = byCustomer.get(customer.id) ?? [];
    const lastTicket = list[0] ?? null;
    const openTicket = list.find((ticket) => ticket.status === "open") ?? null;
    return {
      ...customer,
      ticketCount: list.length,
      openCount: list.filter((ticket) => ticket.status === "open").length,
      pendingCount: list.filter((ticket) => ticket.status === "pending").length,
      resolvedCount: list.filter((ticket) => ticket.status === "resolved").length,
      lastTicket,
      openTicketId: openTicket?.id ?? null,
    };
  });

  rows.sort((a, b) => {
    const aTime = a.lastTicket?.last_message_at ?? a.created_at;
    const bTime = b.lastTicket?.last_message_at ?? b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return rows;
}

export async function listDocuments(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as KnowledgeDocument[];
}

export async function getWorkspaceHome(organizationId: string, userId: string) {
  const supabase = await createClient();
  const [
    { data: openRows, error: openError },
    { count: ticketCount },
    { count: pendingCount },
    { count: resolvedCount },
    documents,
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("*, customer:customers!customer_id(id, name, email), assignee:users!assigned_to(id, full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "open")
      .order("last_message_at", { ascending: true }),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "resolved"),
    listDocuments(organizationId),
  ]);

  if (openError) throw openError;

  const open = (openRows ?? []) as TicketWithCustomer[];
  const mine = open.filter((ticket) => ticket.assigned_to === userId);
  const unassigned = open.filter((ticket) => !ticket.assigned_to);
  const others = open.filter((ticket) => ticket.assigned_to && ticket.assigned_to !== userId);
  const needsYou = [...mine, ...unassigned, ...others].slice(0, 6);

  return {
    nextTicket: mine[0] ?? open[0] ?? null,
    needsYou,
    openCount: open.length,
    unassignedCount: unassigned.length,
    pendingCount: pendingCount ?? 0,
    resolvedCount: resolvedCount ?? 0,
    ticketCount: ticketCount ?? 0,
    documents: {
      total: documents.length,
      indexed: documents.filter((document) => document.status === "indexed").length,
      failed: documents.filter((document) => document.status === "failed").length,
    },
  };
}

export async function listRecentTickets(organizationId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, customer:customers!customer_id(id, name, email), assignee:users!assigned_to(id, full_name)")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as TicketWithCustomer[];
}

export async function getLatestGeneration(ticketId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as AiGeneration | null;
}

export async function listGenerationSources(generationId: string): Promise<CopilotSource[]> {
  const supabase = await createClient();
  const { data: citations, error } = await supabase
    .from("citations")
    .select("chunk_id, similarity")
    .eq("generation_id", generationId);

  if (error) throw error;
  if (!citations?.length) return [];

  const chunkIds = citations.map((citation) => citation.chunk_id);
  const { data: chunks, error: chunksError } = await supabase
    .from("knowledge_chunks")
    .select("id, document_id, page_number, knowledge_documents(name)")
    .in("id", chunkIds);

  if (chunksError) throw chunksError;

  const chunkById = new Map(
    (chunks ?? []).map((chunk) => {
      const document = chunk.knowledge_documents as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(document) ? document[0]?.name : document?.name;
      return [
        chunk.id as string,
        {
          documentId: chunk.document_id as string,
          pageNumber: (chunk.page_number as number | null) ?? undefined,
          documentName: name ?? "Knowledge document",
        },
      ];
    }),
  );

  return citations.flatMap((citation) => {
    const chunk = chunkById.get(citation.chunk_id);
    if (!chunk) return [];
    return [
      {
        chunkId: citation.chunk_id,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        pageNumber: chunk.pageNumber,
        similarity: Number(citation.similarity),
      },
    ];
  });
}

export async function getAnalyticsSnapshot(organizationId: string): Promise<AnalyticsSnapshot> {
  const supabase = await createClient();
  const since = utcWindowStart(14);
  const [
    { data: tickets, error: ticketError },
    { data: generations, error: generationError },
    { data: usage, error: usageError },
    { data: documents, error: documentError },
    { data: messages, error: messageError },
    billing,
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("status, priority, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("ai_generations")
      .select("source_coverage, retrieval_quality, approved_at, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("usage_events")
      .select("type, quantity, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", since),
    supabase
      .from("knowledge_documents")
      .select("status")
      .eq("organization_id", organizationId),
    supabase
      .from("messages")
      .select("send_status")
      .eq("organization_id", organizationId)
      .eq("is_internal", false)
      .not("send_status", "is", null),
    getBillingSnapshot(organizationId),
  ]);

  if (ticketError) throw ticketError;
  if (generationError) throw generationError;
  if (usageError) throw usageError;
  if (documentError) throw documentError;
  if (messageError) throw messageError;

  return buildAnalytics({
    tickets: tickets ?? [],
    generations: generations ?? [],
    usage: usage ?? [],
    documents: documents ?? [],
    messages: messages ?? [],
    draftsUsedMonth: billing.drafts.used,
    draftsCap: billing.drafts.cap,
  });
}

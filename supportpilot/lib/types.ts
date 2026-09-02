export type UserRole = "admin" | "manager" | "agent";
export type TicketStatus = "open" | "pending" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
export type SenderType = "customer" | "agent" | "ai";
export type DocumentStatus =
  | "queued"
  | "uploading"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexed"
  | "failed";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  is_demo: boolean;
  from_name: string | null;
  reply_to: string | null;
  brand_tone: string | null;
  plan_id?: string;
  subscription_status?: string;
  created_at: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Ticket = {
  id: string;
  organization_id: string;
  customer_id: string;
  ticket_number: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  assigned_to: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketWithCustomer = Ticket & {
  customer: Pick<Customer, "id" | "name" | "email">;
  assignee?: Pick<AppUser, "id" | "full_name"> | null;
};

export type Invite = {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Message = {
  id: string;
  ticket_id: string;
  organization_id: string;
  sender_type: SenderType;
  sender_user_id: string | null;
  content: string;
  email_message_id: string | null;
  email_in_reply_to: string | null;
  email_provider_id: string | null;
  is_internal: boolean;
  send_status: "queued" | "sent" | "failed" | null;
  send_error: string | null;
  generation_id: string | null;
  created_at: string;
};

export type MessageAttachment = {
  id: string;
  organization_id: string;
  ticket_id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  content_type: string;
  created_at: string;
};

export type KnowledgeDocument = {
  id: string;
  organization_id: string;
  name: string;
  file_path: string | null;
  file_type: string;
  status: DocumentStatus;
  error_message: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AiGeneration = {
  id: string;
  ticket_id: string;
  organization_id: string;
  intent: string | null;
  category: string | null;
  urgency: TicketPriority | null;
  confidence: number | null;
  retrieval_quality: number | null;
  source_coverage: number | null;
  intent_confidence: number | null;
  rewritten_query: string | null;
  response: string;
  edited_response: string | null;
  needs_human_review: boolean;
  model: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

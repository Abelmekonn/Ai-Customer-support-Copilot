export type UserRole = "admin" | "manager" | "agent";
export type TicketStatus = "open" | "pending" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
export type SenderType = "customer" | "agent" | "ai";
export type DocumentStatus =
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
};

export type Message = {
  id: string;
  ticket_id: string;
  organization_id: string;
  sender_type: SenderType;
  sender_user_id: string | null;
  content: string;
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

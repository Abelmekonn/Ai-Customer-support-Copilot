export type SeedCustomer = {
  name: string;
  email: string;
};

export type SeedTicket = {
  customerEmail: string;
  subject: string;
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  category: string;
  createdHoursAgo: number;
  messages: { sender: "customer" | "agent"; content: string }[];
};

export const seedCustomers: SeedCustomer[] = [
  { name: "Sarah Johnson", email: "sarah.johnson@example.com" },
  { name: "Michael Smith", email: "michael.smith@example.com" },
  { name: "John Doe", email: "john.doe@example.com" },
  { name: "Priya Patel", email: "priya.patel@example.com" },
  { name: "Daniel Okonkwo", email: "daniel.okonkwo@example.com" },
  { name: "Elena Rossi", email: "elena.rossi@example.com" },
  { name: "Maya Chen", email: "maya.chen@example.com" },
  { name: "James Walker", email: "james.walker@example.com" },
];

export const seedTickets: SeedTicket[] = [
  {
    customerEmail: "sarah.johnson@example.com",
    subject: "Customer charged twice",
    status: "open",
    priority: "high",
    category: "Billing",
    createdHoursAgo: 2,
    messages: [
      {
        sender: "customer",
        content:
          "I was charged twice for my subscription. Can I get a refund? The duplicate charge hit my card this morning for $49.",
      },
    ],
  },
  {
    customerEmail: "michael.smith@example.com",
    subject: "Can't access my account",
    status: "open",
    priority: "medium",
    category: "Account",
    createdHoursAgo: 5,
    messages: [
      {
        sender: "customer",
        content:
          "I keep getting an invalid password error even after resetting it twice. I need to get into my account today.",
      },
    ],
  },
  {
    customerEmail: "john.doe@example.com",
    subject: "Refund request",
    status: "open",
    priority: "medium",
    category: "Billing",
    createdHoursAgo: 8,
    messages: [
      {
        sender: "customer",
        content:
          "I'd like a refund for last month. I cancelled on the 3rd but was still billed on the 5th. Can you help?",
      },
    ],
  },
  {
    customerEmail: "priya.patel@example.com",
    subject: "Shipping delay on order #8841",
    status: "open",
    priority: "medium",
    category: "Shipping",
    createdHoursAgo: 12,
    messages: [
      {
        sender: "customer",
        content:
          "My order was supposed to arrive Friday and tracking hasn't moved since Tuesday. Can you check with the carrier?",
      },
    ],
  },
  {
    customerEmail: "daniel.okonkwo@example.com",
    subject: "Pro plan features missing",
    status: "open",
    priority: "high",
    category: "Product",
    createdHoursAgo: 3,
    messages: [
      {
        sender: "customer",
        content:
          "I upgraded to Pro yesterday but still don't see SSO or audit logs. The billing page says Pro is active.",
      },
    ],
  },
  {
    customerEmail: "elena.rossi@example.com",
    subject: "Need invoice for March",
    status: "pending",
    priority: "low",
    category: "Billing",
    createdHoursAgo: 26,
    messages: [
      {
        sender: "customer",
        content: "Could you send a PDF invoice for March? Our finance team needs it for reimbursement.",
      },
      {
        sender: "agent",
        content:
          "Happy to help — I'm checking whether March was billed on the team workspace or the personal account. I'll follow up shortly.",
      },
    ],
  },
  {
    customerEmail: "maya.chen@example.com",
    subject: "Password reset email not arriving",
    status: "pending",
    priority: "medium",
    category: "Account",
    createdHoursAgo: 18,
    messages: [
      {
        sender: "customer",
        content: "I requested a password reset three times and nothing has landed in inbox or spam.",
      },
      {
        sender: "agent",
        content:
          "Thanks for flagging this. I can see the reset emails were generated. Checking whether your domain is blocking our sender.",
      },
    ],
  },
  {
    customerEmail: "james.walker@example.com",
    subject: "Can I change my billing cycle?",
    status: "pending",
    priority: "low",
    category: "Billing",
    createdHoursAgo: 30,
    messages: [
      {
        sender: "customer",
        content: "We're on monthly billing and would like to switch to annual. Do we get a credit for unused time?",
      },
    ],
  },
  {
    customerEmail: "sarah.johnson@example.com",
    subject: "Update payment method",
    status: "resolved",
    priority: "low",
    category: "Billing",
    createdHoursAgo: 96,
    messages: [
      {
        sender: "customer",
        content: "My card expires next month. How do I update the payment method without a lapse in service?",
      },
      {
        sender: "agent",
        content:
          "You can update the card under Settings → Billing. The new card is charged on the next renewal date, so there's no interruption.",
      },
    ],
  },
  {
    customerEmail: "priya.patel@example.com",
    subject: "Return a damaged item",
    status: "resolved",
    priority: "medium",
    category: "Shipping",
    createdHoursAgo: 80,
    messages: [
      {
        sender: "customer",
        content: "The package arrived with a cracked case. I'd like a replacement or refund.",
      },
      {
        sender: "agent",
        content:
          "I'm sorry about the damage. I've issued a prepaid return label and started a replacement shipment. You'll get tracking in a few hours.",
      },
    ],
  },
  {
    customerEmail: "michael.smith@example.com",
    subject: "How do I export my data?",
    status: "resolved",
    priority: "low",
    category: "Account",
    createdHoursAgo: 120,
    messages: [
      {
        sender: "customer",
        content: "Is there a way to export all of my tickets and attachments before we switch tools?",
      },
      {
        sender: "agent",
        content:
          "Yes — Settings → Data export. The ZIP is emailed within 24 hours and includes tickets, comments, and attachments.",
      },
    ],
  },
  {
    customerEmail: "maya.chen@example.com",
    subject: "Student discount eligibility",
    status: "resolved",
    priority: "low",
    category: "Billing",
    createdHoursAgo: 140,
    messages: [
      {
        sender: "customer",
        content: "Do you offer a student discount if I verify with a .edu email?",
      },
      {
        sender: "agent",
        content:
          "We do — 40% off the Pro monthly plan after .edu verification. I sent the verification link to your school address.",
      },
    ],
  },
];

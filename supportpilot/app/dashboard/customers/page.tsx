import { getCurrentUser, listCustomers } from "@/lib/data";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const customers = await listCustomers(user.organization_id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="typo-heading-1">Customers</h1>
        <p className="typo-subtitle mt-2 text-ink-tint">
          People who have written into this workspace.
        </p>
      </div>
      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No customers yet. Load sample tickets from the dashboard to populate a demo queue.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {customers.map((customer) => (
            <li key={customer.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

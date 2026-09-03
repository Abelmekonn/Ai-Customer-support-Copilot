import { CustomerDirectory } from "@/components/customers/customer-directory";
import { CustomerSearch } from "@/components/customers/customer-search";
import { getCurrentUser, getOrganization, listCustomerDirectory } from "@/lib/data";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const rawQuery = (params.q ?? "").trim();
  const filter = params.filter === "open" || params.filter === "pending" ? params.filter : "all";

  const [organization, rows] = await Promise.all([
    getOrganization(user.organization_id),
    listCustomerDirectory(user.organization_id),
  ]);

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-[#0a0a0a]">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <CustomerSearch query={rawQuery} filter={filter} />
      </div>
      <div className="mx-auto max-w-[1200px] px-6 py-7 pb-16">
        <CustomerDirectory
          rows={rows}
          filter={filter}
          query={rawQuery}
          isDemo={organization?.is_demo !== false}
        />
      </div>
    </div>
  );
}

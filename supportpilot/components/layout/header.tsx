import { initials } from "@/lib/utils";

export function AppHeader({
  title,
  userName,
  actions,
}: {
  title: string;
  userName: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/70 px-6 backdrop-blur">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-3">
        {actions}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {userName}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(userName)}
          </span>
        </div>
      </div>
    </header>
  );
}

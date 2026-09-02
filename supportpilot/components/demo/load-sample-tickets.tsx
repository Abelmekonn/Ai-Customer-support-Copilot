"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoadSampleTickets() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setPending(true);
    setError(null);
    const response = await fetch("/api/demo/seed", { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Could not load sample tickets.");
      return;
    }
    router.refresh();
    router.push("/dashboard/tickets");
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={load} disabled={pending}>
        {pending ? "Loading…" : "Load sample tickets"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

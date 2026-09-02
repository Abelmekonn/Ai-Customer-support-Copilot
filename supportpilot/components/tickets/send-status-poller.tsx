"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SendStatusPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let busy = false;

    async function tick() {
      if (busy) return;
      busy = true;
      try {
        await fetch("/api/jobs/run", { method: "POST" }).catch(() => undefined);
        if (!cancelled) router.refresh();
      } finally {
        busy = false;
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [active, router]);

  return null;
}

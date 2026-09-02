"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { DocumentStatus } from "@/lib/types";

const IN_FLIGHT: DocumentStatus[] = [
  "queued",
  "uploading",
  "extracting",
  "chunking",
  "embedding",
];

export function IndexingPoller({ statuses }: { statuses: DocumentStatus[] }) {
  const router = useRouter();
  const active = statuses.some((status) => IN_FLIGHT.includes(status));

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

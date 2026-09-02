"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld } from "@/lib/scroll-world/scrub-engine";
import { scrollWorldConfig } from "@/lib/scroll-world/config";

export function ScrollWorld() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    mountScrollWorld(node, scrollWorldConfig);

    return () => {
      node.replaceChildren();
      document.getElementById("sw-css")?.remove();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      id="world"
      className="sw-root min-h-screen"
      style={
        {
          "--sw-bg": "#fff8e0",
          "--sw-ink": "#1f1f1f",
          "--sw-ink-soft": "#6a6a6a",
          "--sw-accent": "#fa520f",
          "--sw-font-display":
            '"PP Editorial Old", var(--font-editorial), "Times New Roman", Georgia, serif',
          "--sw-font-body":
            "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        } as React.CSSProperties
      }
    />
  );
}

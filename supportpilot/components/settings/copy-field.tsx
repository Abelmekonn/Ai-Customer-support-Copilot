"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyField({
  id,
  label,
  value,
  hint,
  secret,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  secret?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id={id} value={value} readOnly className={secret ? "font-mono text-[13px]" : "font-mono text-[13px]"} />
        <Button type="button" variant="outline" size="sm" className="h-11 shrink-0" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {hint ? <p className="text-[13px] text-steel">{hint}</p> : null}
    </div>
  );
}

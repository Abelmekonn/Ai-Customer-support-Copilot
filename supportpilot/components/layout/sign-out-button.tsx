"use client";

import { signOutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={cn("text-[14px] font-medium text-primary", className)}
      >
        Sign out
      </button>
    </form>
  );
}

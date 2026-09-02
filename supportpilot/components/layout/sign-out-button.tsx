"use client";

import { signOutAction } from "@/app/(auth)/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-[14px] font-medium text-primary"
      >
        Sign out
      </button>
    </form>
  );
}

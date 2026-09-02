import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#111] p-8">
      <h1 className="typo-heading-1">Welcome back</h1>
      <p className="typo-subtitle mt-3 text-ink-tint">
        Sign in to your SupportPilot workspace.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-[14px] text-steel">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary">
          Create a workspace
        </Link>
      </p>
    </div>
  );
}

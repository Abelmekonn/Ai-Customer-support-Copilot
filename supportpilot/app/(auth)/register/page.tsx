import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create workspace" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#111] p-8">
      <h1 className="typo-heading-1">Get in touch with the workspace.</h1>
      <p className="typo-subtitle mt-3 text-ink-tint">
        Your organization and admin account are provisioned together.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-6 text-[14px] text-steel">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}

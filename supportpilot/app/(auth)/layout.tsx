import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { SunsetStripe } from "@/components/brand/sunset-stripe";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-black">
      <main className="flex flex-1 items-start justify-center px-6 py-16">{children}</main>
    </div>
  );
}

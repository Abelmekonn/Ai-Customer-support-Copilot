import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const editorial = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "400",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SupportPilot",
    template: "%s · SupportPilot",
  },
  description:
    "AI copilot that helps customer support agents understand tickets, retrieve company policy, and draft accurate replies.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${editorial.variable} ${jetbrains.variable} h-full bg-black antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

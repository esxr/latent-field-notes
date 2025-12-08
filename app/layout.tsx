import type { Metadata } from "next";
import {
  Source_Sans_3,
  Source_Serif_4,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const uiSans = Source_Sans_3({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const serifBody = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Latent Field Notes",
  description:
    "AI systems, evals, and alignment patterns. Markdown-first blog powered by Next.js, Tailwind, shadcn, and giscus.",
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${uiSans.variable} ${serifBody.variable} ${mono.variable} bg-[var(--bg)] text-[var(--ink)] antialiased`}
      >
        <div className="relative min-h-screen">
          <SiteHeader />
          <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 pb-16 pt-8 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

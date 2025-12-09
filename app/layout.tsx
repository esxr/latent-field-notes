import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const uiSans = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const mono = Source_Code_Pro({
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
        className={`${uiSans.variable} ${mono.variable} bg-[var(--bg)] text-[var(--ink)] antialiased flex min-h-screen flex-col`}
      >
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 pb-16 pt-10 sm:px-7">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

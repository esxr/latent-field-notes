import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_60%_80%,rgba(14,165,233,0.18),transparent_35%)]" />
          <SiteHeader />
          <main className="relative mx-auto flex max-w-5xl flex-col gap-12 px-4 pb-16 pt-10 sm:px-6">
            {children}
          </main>
          <footer className="relative border-t border-white/5 bg-black/40 py-10">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-sm text-slate-300 sm:px-6">
              <div>
                Built with Next.js, Tailwind, shadcn patterns, and Markdown in
                GitHub.
              </div>
              <div className="text-slate-400">
                © {new Date().getFullYear()} Latent Field Notes
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

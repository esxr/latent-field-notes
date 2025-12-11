import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebar } from "@/components/chat-sidebar";

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
  title: "Pranav Dhoolia",
  description:
    "Pranav Dhoolia discussing about AI systems, evals, and fine-tuning in his personal blog.",
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
        className={`${uiSans.variable} ${mono.variable} bg-[var(--bg)] text-[var(--ink)] antialiased`}
      >
        <SidebarProvider defaultOpen={false}>
          <SidebarInset>
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-5 pb-16 pt-10 sm:px-7">
              {children}
            </main>
            <SiteFooter />
          </SidebarInset>
          <ChatSidebar />
        </SidebarProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Providers } from "@/lib/providers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FontSizeControl } from "@/components/FontSizeControl";
import { Toaster } from "sonner";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Eternal Codex — Human History According to AI",
  description:
    "5,226 years of human civilization, researched year-by-year by AI. Structured, sourced, machine-readable.",
  openGraph: {
    title: "Eternal Codex — Human History According to AI",
    description: "Every year from 2025 CE to 3200 BCE. Structured JSON with events, sources, and certainty levels.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Providers>
          {/* ─── Header ─── */}
          <header
            className="sticky top-0 z-50 border-b"
            style={{
              background: "rgba(5, 5, 5, 0.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderColor: "#222222",
            }}
          >
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="flex flex-col leading-none">
                  <span
                    className="text-base font-bold tracking-[0.06em] group-hover:opacity-90 transition-opacity"
                    style={{
                      fontFamily: "var(--font-heading), Georgia, serif",
                      color: "var(--gold)",
                    }}
                  >
                    ETERNAL CODEX
                  </span>
                  <span className="hidden sm:block text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
                    Human History According to AI
                  </span>
                </div>
              </Link>

              {/* Nav */}
              <nav className="flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:flex"><FontSizeControl /></span>
                <span className="hidden sm:block w-px h-4 bg-border/50 mx-1" />
                <ThemeToggle />
                <a
                  href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full border border-border/50 bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors ml-1"
                  aria-label="View on GitHub"
                >
                  <ExternalLink size={14} />
                </a>
              </nav>
            </div>
          </header>

          {/* ─── Main content ─── */}
          <main className="flex-1">{children}</main>

          {/* ─── Footer ─── */}
          <footer
            className="border-t py-8 text-center"
            style={{ borderColor: "rgba(232,200,138,0.1)" }}
          >
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <span>
                  Crafted by{" "}
                  <a
                    href="https://smarason.is"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors underline underline-offset-4"
                    style={{ color: "var(--gold)" }}
                  >
                    Magnus Smarason
                  </a>
                </span>
                <span
                  className="hidden sm:block font-semibold uppercase tracking-widest text-[10px]"
                  style={{ fontFamily: "var(--font-heading), serif", color: "rgba(232,200,138,0.4)" }}
                >
                  Eternal Codex
                </span>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    View Source
                  </a>
                  <a
                    href="https://github.com/Magnussmari/Human_history_Acording_to_AI/blob/main/CONTRIBUTING.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                    style={{ color: "var(--gold)", opacity: 0.8 }}
                  >
                    Contribute
                  </a>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground/40 font-mono">
                Claude Sonnet 4.6 — ICCRA Schema — Open Source
              </p>
            </div>
          </footer>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                border: "1px solid rgba(232,200,138,0.2)",
                color: "var(--foreground)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

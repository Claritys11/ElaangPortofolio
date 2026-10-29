import type { Metadata } from "next";
import { Archivo, Geist_Mono, Inter_Tight } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { INTRO_SCRIPT } from "@/lib/intro";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: "Elang Dimas Syadewa — Claritys", template: "%s — Claritys" },
    description: "Pwn-focused CTF player and builder from Malang, Indonesia.",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${interTight.variable} ${geistMono.variable}`}>
      <head>
        {/* Flags a first visit to "/" before paint, so the preloader shows without a flash (lib/intro.ts). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createIntroScript } from "@/lib/intro";
import { BASE_PATH } from "@/lib/site-config";
import { siteUrl } from "@/lib/site";
import { appearanceCssVariables, getAppearance, getProfile, getSiteConfig } from "@/lib/content";
import "./globals.css";

const archivo = localFont({ src: "../assets/fonts/archivo-variable.woff2", variable: "--font-archivo", weight: "100 900", display: "swap" });
const interTight = localFont({ src: "../assets/fonts/inter-tight-variable.woff2", variable: "--font-inter-tight", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "../assets/fonts/geist-mono-variable.woff2", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const [site, profile] = await Promise.all([getSiteConfig(), getProfile()]);
  return {
    metadataBase: new URL(`${siteUrl()}/`),
    title: {
      default: profile.seo?.defaultTitle ?? site.title,
      template: profile.seo?.titleTemplate ?? "%s — Claritys",
    },
    description: profile.seo?.description ?? site.description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteConfig();
  const appearance = getAppearance();
  return (
    <html lang={site.language} suppressHydrationWarning className={`${archivo.variable} ${interTight.variable} ${geistMono.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: appearanceCssVariables(appearance) }} />
        {/* Flags a first visit to "/" before paint, so the preloader shows without a flash (lib/intro.ts). */}
        <script dangerouslySetInnerHTML={{ __html: createIntroScript(BASE_PATH) }} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme={appearance.defaultTheme} enableSystem={false} disableTransitionOnChange>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

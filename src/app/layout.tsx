import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { TVEffect } from '@/components/TVEffect';
import { ShellGate } from '@/components/ShellGate';
import { normalizeProfileSettings } from '@/lib/about-default';
import { getProfileSettings } from '@/lib/server-storage';

export const dynamic = 'force-dynamic';

const FALLBACK_BASE_URL = 'https://claritys.my.id';
const FALLBACK_DESCRIPTION =
  'Cybersecurity specialist, CTF player, and web developer. Explore my portfolio, projects, and write-ups.';

function toAbsoluteUrl(value: string | undefined, fallback: string): string {
  if (!value?.trim()) {
    return fallback;
  }

  try {
    return new URL(value).toString();
  } catch {
    return fallback;
  }
}

function toHtmlLang(locale: string | undefined): string {
  if (!locale?.trim()) {
    return 'en';
  }

  const normalized = locale.replace('-', '_');
  return normalized.split('_')[0]?.toLowerCase() || 'en';
}

function getFallbackKeywords(name: string, igUsername: string): string[] {
  return [
    name,
    igUsername,
    'Cybersecurity',
    'CTF Player',
    'Write-ups',
    'Security Researcher',
    'Ethical Hacking',
    'Web Developer',
    'Portfolio',
    'Digital Forensics',
  ].filter(Boolean);
}

async function getSeoProfileSettings() {
  const profile = await getProfileSettings().catch(() => null);
  return normalizeProfileSettings(profile);
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getSeoProfileSettings();
  const seo = profile.seo ?? {};

  const name = profile.displayName || 'Elang Dimas Syadewa';
  const description =
    seo.description?.trim() || profile.aboutText || FALLBACK_DESCRIPTION;

  const baseUrl = toAbsoluteUrl(seo.canonicalUrl || profile.websiteUrl, FALLBACK_BASE_URL);
  const previewImage = toAbsoluteUrl(
    seo.previewImageUrl,
    `${baseUrl.replace(/\/$/, '')}/preview.png`
  );

  const igUsername =
    profile.instagramUrl?.split('/').filter(Boolean).pop() || '';
  const customKeywords = (seo.keywords ?? []).map((entry) => entry.trim()).filter(Boolean);
  const rawTitleTemplate = seo.titleTemplate?.trim() ?? '';
  const titleTemplate = rawTitleTemplate.includes('%s')
    ? rawTitleTemplate
    : rawTitleTemplate || `%s | ${name}`;
  const defaultTitle = seo.defaultTitle?.trim() || `${name} | Cybersecurity Portfolio`;
  const computedTitle = rawTitleTemplate.includes('%s')
    ? titleTemplate.replace('%s', defaultTitle)
    : defaultTitle;
  const siteName = seo.siteName?.trim() || `${name} Portfolio`;
  const locale = seo.locale?.trim() || 'id_ID';

  return {
    metadataBase: new URL(baseUrl),

    alternates: {
      canonical: baseUrl,
    },

    title: {
      template: titleTemplate,
      default: computedTitle,
    },

    description,

    keywords: customKeywords.length ? customKeywords : getFallbackKeywords(name, igUsername),

    authors: [{ name }],
    creator: name,

    icons: {
      icon: '/favicon.ico',
    },

    openGraph: {
      type: 'website',
      locale,
      url: baseUrl,
      title: computedTitle,
      description,
      siteName,
      images: [
        {
          url: previewImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: computedTitle,
      description,
      images: [previewImage],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSeoProfileSettings();
  const seo = profile.seo ?? {};

  const name = profile.displayName || 'Elang Dimas Syadewa';
  const baseUrl = toAbsoluteUrl(seo.canonicalUrl || profile.websiteUrl, FALLBACK_BASE_URL);
  const previewImage = toAbsoluteUrl(
    seo.previewImageUrl,
    `${baseUrl.replace(/\/$/, '')}/preview.png`
  );
  const description =
    seo.description?.trim() || profile.aboutText || FALLBACK_DESCRIPTION;
  const customSameAs = (seo.sameAs ?? []).map((entry) => entry.trim()).filter(Boolean);
  const fallbackSameAs = [profile.instagramUrl, profile.githubUrl]
    .map((entry) => (entry ?? '').trim())
    .filter(Boolean);
  const jobTitle = seo.jobTitle?.trim() || 'Cybersecurity Specialist';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: baseUrl,
    image: previewImage,
    sameAs: customSameAs.length ? customSameAs : fallbackSameAs,
    jobTitle,
    description,
  };

  return (
    <html lang={toHtmlLang(seo.locale)} suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD (SEO Advanced) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      <body className="font-body antialiased text-foreground min-h-screen selection:bg-primary/30 selection:text-primary">
        <ShellGate>
          <TVEffect />
          <Navbar />
          <main className="pt-16">{children}</main>
          <Toaster />
        </ShellGate>
      </body>
    </html>
  );
}
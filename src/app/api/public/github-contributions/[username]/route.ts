import { NextResponse } from 'next/server';

interface ContributionDay {
  date: string;
  label: string;
  count: number;
  level: number;
}

interface ContributionResponse {
  username: string;
  totalContributions: number;
  days: ContributionDay[];
  sourceUrl: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function readAttribute(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function parseContributionHtml(html: string): Pick<ContributionResponse, 'totalContributions' | 'days'> {
  const totalMatch = html.match(/<h2[^>]*id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s*contributions/i);
  const totalContributions = Number.parseInt((totalMatch?.[1] ?? '0').replace(/,/g, ''), 10) || 0;
  const days: ContributionDay[] = [];
  const dayPattern = /(<td\b[^>]*class="ContributionCalendar-day"[^>]*><\/td>)\s*<tool-tip\b[^>]*>([\s\S]*?)<\/tool-tip>/gi;

  for (const match of html.matchAll(dayPattern)) {
    const tag = match[1] ?? '';
    const tooltip = decodeHtml((match[2] ?? '').replace(/\s+/g, ' ').trim());
    const date = readAttribute(tag, 'data-date');
    const level = Number.parseInt(readAttribute(tag, 'data-level'), 10);
    const countMatch = tooltip.match(/^(\d+)\s+contributions?/i);
    const count = countMatch ? Number.parseInt(countMatch[1], 10) : 0;

    if (!date) {
      continue;
    }

    days.push({
      date,
      label: tooltip || `${count} contributions on ${date}`,
      count,
      level: Number.isFinite(level) ? Math.max(0, Math.min(4, level)) : 0,
    });
  }

  return {
    totalContributions,
    days: days.sort((left, right) => left.date.localeCompare(right.date)),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await params;
  const username = rawUsername.trim().replace(/^@/, '');

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    return NextResponse.json({ error: 'Invalid GitHub username.' }, { status: 400 });
  }

  const sourceUrl = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'ClaritysPortfolio/1.0 (+https://clarityz.my.id)',
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `GitHub contributions request failed with ${response.status}.` },
      { status: 502 }
    );
  }

  const html = await response.text();
  const parsed = parseContributionHtml(html);

  return NextResponse.json({
    username,
    totalContributions: parsed.totalContributions,
    days: parsed.days,
    sourceUrl,
  } satisfies ContributionResponse);
}

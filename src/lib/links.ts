/**
 * Static links for /links (the Instagram/Threads "link in bio" page), in display order.
 * The latest writeup card is fetched from the database and placed before these.
 */
export type BioLink = { label: string; href: string; hint: string; external?: boolean };

export const BIO_LINKS: BioLink[] = [
  { label: "All writeups", href: "/writeups", hint: "CTF solutions" },
  { label: "Projects", href: "/projects", hint: "web apps & tooling" },
  { label: "Portfolio", href: "/", hint: "claritys.web.id" },
  { label: "GitHub", href: "https://github.com/claritys11", hint: "@claritys11", external: true },
  { label: "Instagram", href: "https://instagram.com/elanggslibaw", hint: "@elanggslibaw", external: true },
  // TODO: confirm the Threads handle.
  { label: "Threads", href: "https://www.threads.net/@elanggslibaw", hint: "@elanggslibaw", external: true },
  { label: "Contact", href: "/#contact", hint: "team invites & collabs" },
];

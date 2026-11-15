import { SITE_BASE_URL, absoluteSiteUrl } from "@/lib/site-config";

/** Canonical site URL, including the configured base path but never a trailing slash. */
export const siteUrl = () => SITE_BASE_URL;
export { absoluteSiteUrl };

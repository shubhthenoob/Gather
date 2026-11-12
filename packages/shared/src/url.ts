const TRACKING_PARAMS = [
  /^utm_/i, /^fbclid$/i, /^gclid$/i, /^dclid$/i, /^msclkid$/i, /^mc_(cid|eid)$/i,
  /^ref$/i, /^ref_src$/i, /^igshid$/i, /^_hs(enc|mi)$/i, /^yclid$/i, /^s_cid$/i,
];

/**
 * Canonical form of a page URL used for duplicate detection and restore lookups.
 * Lowercases the host, drops "www.", the fragment, tracking params, default ports
 * and a trailing slash, and sorts the remaining query params.
 */
export function canonicalizeUrl(input: string): string {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return input.trim();
  }
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) u.port = "";
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.some((re) => re.test(k)))
    .sort(([a], [b]) => a.localeCompare(b));
  u.search = "";
  for (const [k, v] of params) u.searchParams.append(k, v);
  let path = u.pathname.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  u.pathname = path;
  // Treat http and https as the same page.
  return u.toString().replace(/^http:/, "https:");
}

export function domainOf(input: string): string {
  try {
    return new URL(input).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Friendly site name from a domain, e.g. "producthunt.com" -> "Product Hunt" is not knowable; use "producthunt.com". */
export function siteName(domain: string): string {
  return domain || "Unknown site";
}

const RESTRICTED = [/^chrome:/, /^chrome-extension:/, /^edge:/, /^about:/, /^view-source:/, /^devtools:/, /^file:/, /^data:/];
const RESTRICTED_HOSTS = ["chrome.google.com", "chromewebstore.google.com"];

export function isSupportedUrl(input: string | undefined): boolean {
  if (!input) return false;
  if (RESTRICTED.some((re) => re.test(input))) return false;
  try {
    const u = new URL(input);
    if (!/^https?:$/.test(u.protocol)) return false;
    return !RESTRICTED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public marketing pages may be indexed; personal libraries are private.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/day", "/search", "/settings", "/api", "/auth", "/home"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

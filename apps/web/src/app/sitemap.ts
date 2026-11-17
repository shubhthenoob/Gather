import type { MetadataRoute } from "next";
import { AUDIENCES } from "@/lib/audiences";
import { POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/guide", "/blog", "/privacy", "/terms"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const posts = POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.6 }));
  const audiences = AUDIENCES.map((a) => ({ url: `${SITE_URL}/for/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  return [...pages, ...audiences, ...posts];
}

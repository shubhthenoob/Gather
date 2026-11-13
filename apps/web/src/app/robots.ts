import type { MetadataRoute } from "next";

// Personal libraries are private: only the sign-in page may be indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/login", disallow: "/" },
  };
}

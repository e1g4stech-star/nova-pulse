import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://nova-pulse-eta.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/login", "/register"],
        disallow: ["/api/", "/dashboard", "/settings", "/billing", "/ai-", "/kalender", "/affiliate", "/posts", "/finance", "/media-studio"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
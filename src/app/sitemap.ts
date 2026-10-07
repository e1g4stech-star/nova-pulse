import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || "https://nova-pulse-eta.vercel.app";
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
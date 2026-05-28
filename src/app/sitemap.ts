import type { MetadataRoute } from "next";

const BASE = "https://conference.aalb.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/sponsor`,   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/register`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/proposal`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}

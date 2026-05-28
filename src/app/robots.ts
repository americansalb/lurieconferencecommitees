import type { MetadataRoute } from "next";

const BASE = "https://conference.aalb.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/admin",
          "/sponsors",     // admin board (singular /sponsor stays public)
          "/attendees",
          "/presenters",   // admin board (presenter confirm pages stay accessible by token only)
          "/notifications",
          "/profile",
          "/mentions",
          "/discussions",
          "/calendar",
          "/committees",
          "/login",
          "/register-account",
          "/forgot-password",
          "/reset-password",
          "/sponsor/status/",
          "/sponsor/invited/",
          "/sponsor/success/",
          "/attend/",
          "/presenters/confirm/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}

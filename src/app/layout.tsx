import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
// Side-effect import: db.ts bootstraps the in-app scheduler (email queue +
// reminders). Pulling it into the root layout guarantees the ticker starts
// even on a fresh deploy with no dynamic traffic — at the latest when the
// homepage's hourly revalidation renders this layout server-side.
import "@/lib/db";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://conference.aalb.org"),
  title: {
    default: "2026 Lurie Children's and AALB Conference",
    template: "%s | 2026 Lurie Children's and AALB Conference",
  },
  description:
    "The 2nd Joint Conference of Ann & Robert H. Lurie Children's Hospital of Chicago and Americans Against Language Barriers. True Language Access: Yesterday, Today, and Tomorrow. August 15 and 16, 2026, Chicago.",
  openGraph: {
    title: "2026 Lurie Children's and AALB Conference",
    description:
      "True Language Access: Yesterday, Today, and Tomorrow. August 15 and 16, 2026, Chicago.",
    url: "/",
    type: "website",
    locale: "en_US",
    siteName: "Lurie Children's and AALB Conference",
    images: [
      {
        url: "/og/conference-og.png",
        width: 1200,
        height: 630,
        alt: "2026 Lurie Children's and AALB Conference. True Language Access: Yesterday, Today, and Tomorrow. August 15–16, 2026, Chicago.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 Lurie Children's and AALB Conference",
    description:
      "True Language Access: Yesterday, Today, and Tomorrow. August 15 and 16, 2026, Chicago.",
    images: ["/og/conference-og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-gray-50`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

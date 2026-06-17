import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

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
    type: "website",
    locale: "en_US",
    siteName: "Lurie Children's and AALB Conference",
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 Lurie Children's and AALB Conference",
    description:
      "True Language Access: Yesterday, Today, and Tomorrow. August 15 and 16, 2026, Chicago.",
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

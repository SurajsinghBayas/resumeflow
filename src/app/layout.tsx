import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const description =
  "Know what to keep, and what to rewrite. Paste a job description, upload your resume, and see which lines to change.";

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "https://resflowai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "ResumeFlow",
  description,
  openGraph: {
    title: "Know what to keep, and what to rewrite.",
    description,
    url: site,
    siteName: "ResumeFlow",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ResumeFlow. Know what to keep, and what to rewrite.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Know what to keep, and what to rewrite.",
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-ink">{children}</body>
    </html>
  );
}

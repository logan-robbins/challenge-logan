import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionWrapper from "@/components/SessionWrapper";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Challenge Logan | Think you've got a problem I can't solve? Try me.",
  description:
    "Submit an engineering challenge you think Logan can't solve. AI turns thinkers into doers.",
  openGraph: {
    title: "Challenge Logan",
    description: "Think you've got a problem I can't solve? Try me.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <SiteNav />
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnCourse — Professional Online Training Platform",
  description:
    "LearnCourse is a professional online training platform offering structured courses, recorded video lessons, assignments and verifiable completion certificates.",
  keywords: [
    "online training",
    "course platform",
    "e-learning",
    "LMS",
    "certificates",
    "professional training",
  ],
  authors: [{ name: "LearnCourse" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "LearnCourse",
    description:
      "Professional online training platform with structured courses, video lessons and verifiable certificates.",
    siteName: "LearnCourse",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

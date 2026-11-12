import type { Metadata } from "next";
import { Inter, Manrope, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { DirectionManager } from "@/components/shared/direction-manager";

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

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CourseLearn — Professional Online Training Platform",
  description:
    "CourseLearn is a professional online training platform offering structured courses, recorded video lessons, assignments and verifiable completion certificates.",
  keywords: [
    "online training",
    "course platform",
    "e-learning",
    "LMS",
    "certificates",
    "professional training",
  ],
  authors: [{ name: "CourseLearn" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CourseLearn",
    description:
      "Professional online training platform with structured courses, video lessons and verifiable certificates.",
    siteName: "CourseLearn",
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
        className={`${inter.variable} ${manrope.variable} ${notoKufiArabic.variable} font-sans antialiased bg-background text-foreground`}
      >
        <DirectionManager />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

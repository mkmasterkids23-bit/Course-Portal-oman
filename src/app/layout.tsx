import type { Metadata } from "next";
import { Poppins, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { DirectionManager } from "@/components/shared/direction-manager";

const poppins = Poppins({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
        className={`${poppins.variable} ${notoKufiArabic.variable} font-sans antialiased bg-background text-foreground`}
      >
        <DirectionManager />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

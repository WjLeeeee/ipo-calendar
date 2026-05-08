import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "공모주 청약 캘린더 - 청약일정, 환불일, 상장일 한눈에 보기",
  description: "공모주 청약 일정, 환불일, 상장일을 캘린더와 리스트로 한눈에 확인하세요. 최신 공모주 정보를 실시간으로 제공합니다.",
  keywords: "공모주, 청약일정, 공모주캘린더, IPO, 청약, 환불일, 상장일, 공모가, 경쟁률",
  openGraph: {
    title: "공모주 청약 캘린더",
    description: "공모주 청약 일정, 환불일, 상장일을 한눈에 확인하세요.",
    url: "https://ipo-calendar-gold.vercel.app",
    siteName: "공모주 청약 캘린더",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
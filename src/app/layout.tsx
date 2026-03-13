import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "러닝맵 – 전국 마라톤·러닝 대회 지도",
  description: "전국 마라톤·러닝 대회 정보를 지도에서 한눈에. 코스 경로와 고도 프로파일을 확인하세요.",
  openGraph: {
    title: "러닝맵",
    description: "전국 마라톤·러닝 대회 지도 서비스",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} font-sans antialiased bg-white`}>
        <Header />
        <main className="pb-16 md:pb-0">{children}</main>
      </body>
    </html>
  );
}

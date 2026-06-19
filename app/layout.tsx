import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "우리 가족 건강 기록",
  description: "가족 건강검진 결과를 한곳에서 관리하세요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 모바일 우선: 데스크톱에서도 가운데 480px 폭으로 */}
        <div className="mx-auto w-full max-w-app min-h-screen bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}

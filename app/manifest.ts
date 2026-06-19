import type { MetadataRoute } from "next";

// /manifest.webmanifest 로 제공됨. 홈 화면 추가 시 앱처럼 동작(standalone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "건강수첩 - 우리 가족 건강 기록",
    short_name: "건강수첩",
    description: "가족 건강검진 결과를 한곳에서 관리하세요",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

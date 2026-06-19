import type { Config } from "tailwindcss";

// 디자인 토큰 — health-app-mockup.jsx 기준 (토스/똑닥 톤)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3B82F6", // 메인 파랑
          soft: "#EFF6FF",    // 연한 파랑 (선택 배경)
          deep: "#1D4ED8",    // 진한 파랑 (텍스트)
          card: "#5B9BF5",    // 알림 카드 배경
        },
        ink: "#1A1D23",       // 본문 텍스트
        sub: "#8B92A0",       // 보조 텍스트
        section: "#F8F9FB",   // 섹션/카드 배경
        line: "#EBEEF3",      // 타임라인/구분선
        ok: { DEFAULT: "#16A34A", bg: "#DCFCE7" }, // 정상
        bad: { DEFAULT: "#DC2626", bg: "#FEE2E2" }, // 이상/경계
        accent: "#7C3AED",    // 단일검사 보라
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Gender } from "@/lib/types";

// 검진 항목별 권장 주기 (국가검진 기준 위주)
// ⚠️ 일반 참고용. 개인 위험도/병력에 따라 실제 권장은 달라질 수 있음.
// 데이터 없는 항목은 "권장 정보 없음"으로 표시.

export interface ScreeningRule {
  intervalMonths: number; // 권장 재검 주기 (개월)
  minAge?: number; // 권장 시작 연령 (만 나이)
  maxAge?: number; // 권장 종료 연령
  gender?: Gender; // 특정 성별만 대상이면 지정
  source: string; // 근거 (예: "국가 위암검진")
  note?: string; // 부가 설명
}

// 한 항목에 규칙이 여러 개면 배열 (성별/연령별로 다른 경우)
const RULES: Record<string, ScreeningRule> = {
  // 국가 일반건강검진 (만 20세 이상, 2년 주기)
  height: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  weight: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  bmi: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  waist: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  bp1_sys: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  bp1_dia: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  hemoglobin: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  glucose_fasting: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  cholesterol_total: {
    intervalMonths: 24,
    minAge: 20,
    source: "국가 일반건강검진",
    note: "총콜레스테롤 등 지질검사 포함",
  },
  ast: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  alt: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  ggt: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  creatinine: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  urine_protein: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },
  chest_xray: { intervalMonths: 24, minAge: 20, source: "국가 일반건강검진" },

  // 국가 6대 암검진
  gastroscopy: {
    intervalMonths: 24,
    minAge: 40,
    source: "국가 위암검진",
    note: "위장조영촬영으로 대체 가능",
  },
  upper_gi_series: { intervalMonths: 24, minAge: 40, source: "국가 위암검진" },
  fobt: {
    intervalMonths: 12,
    minAge: 50,
    source: "국가 대장암검진",
    note: "분변잠혈 양성 시 대장내시경 권장",
  },
  mammography: {
    intervalMonths: 24,
    minAge: 40,
    gender: "F",
    source: "국가 유방암검진",
  },
  pap: {
    intervalMonths: 24,
    minAge: 20,
    gender: "F",
    source: "국가 자궁경부암검진",
  },
  low_dose_ct: {
    intervalMonths: 24,
    minAge: 54,
    maxAge: 74,
    source: "국가 폐암검진",
    note: "고위험 흡연자(30갑년 이상) 대상",
  },

  // 골다공증
  dexa: {
    intervalMonths: 24,
    minAge: 54,
    gender: "F",
    source: "골다공증 검사",
    note: "폐경 후 여성 권장",
  },
};

export function getRule(itemCode: string | null): ScreeningRule | null {
  if (!itemCode) return null;
  return RULES[itemCode] ?? null;
}

// 만 나이 계산
export function ageAt(birthDate: string | null, ref: Date): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (!Number.isFinite(b.getTime())) return null;
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}

// 이 구성원이 해당 규칙의 권장 대상인지 (연령·성별)
export function isTarget(
  rule: ScreeningRule,
  age: number | null,
  gender: Gender | null
): boolean {
  if (rule.gender && gender !== rule.gender) return false;
  if (age !== null) {
    if (rule.minAge !== undefined && age < rule.minAge) return false;
    if (rule.maxAge !== undefined && age > rule.maxAge) return false;
  }
  return true;
}

export type ScreeningStatus =
  | { kind: "due" } // 권장 대상인데 안 받았거나 주기 지남
  | { kind: "ok"; lastDate: string } // 받았고 주기 내
  | { kind: "received"; lastDate: string } // 받은 적 있음 (권장 정보 없는 항목)
  | { kind: "none" }; // 권장 대상 아니고 기록도 없음

// 목록 뱃지용 상태 판정
export function getStatus(
  itemCode: string,
  lastDate: string | null, // 해당 구성원이 마지막으로 받은 날 (YYYY-MM-DD)
  age: number | null,
  gender: Gender | null,
  today: Date
): ScreeningStatus {
  const rule = RULES[itemCode] ?? null;
  const target = rule ? isTarget(rule, age, gender) : false;

  if (!lastDate) {
    return target ? { kind: "due" } : { kind: "none" };
  }

  // 받은 적 있음 — 권장 규칙이 있으면 주기 경과 여부 판정
  if (rule && target) {
    const last = new Date(lastDate);
    const next = new Date(last);
    next.setMonth(next.getMonth() + rule.intervalMonths);
    return next <= today ? { kind: "due" } : { kind: "ok", lastDate };
  }
  return { kind: "received", lastDate };
}

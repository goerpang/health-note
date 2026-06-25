import type { Gender } from "@/lib/types";

// 표준 검진항목의 정상범위 (자동 정상/이상 판정용)
// item_definitions의 normal_range 텍스트를 기계가 판정 가능한 형태로 정리.
// ⚠️ 일반 참고 기준이며 의학적 진단이 아님. 사용자가 직접 수정 가능.

type SimpleRule =
  | { kind: "between"; low: number; high: number } // low~high 정상
  | { kind: "max"; high: number } // high 이하 정상 (낮을수록 좋음)
  | { kind: "min"; low: number }; // low 이상 정상 (높을수록 좋음)

type Rule = SimpleRule | { kind: "byGender"; M: SimpleRule; F: SimpleRule };

const RANGES: Record<string, Rule> = {
  bmi: { kind: "between", low: 18.5, high: 22.9 },
  waist: {
    kind: "byGender",
    M: { kind: "max", high: 90 },
    F: { kind: "max", high: 85 },
  },
  bp1_sys: { kind: "max", high: 120 },
  bp1_dia: { kind: "max", high: 80 },
  bp2_sys: { kind: "max", high: 120 },
  bp2_dia: { kind: "max", high: 80 },
  pulse: { kind: "between", low: 60, high: 100 },
  hemoglobin: {
    kind: "byGender",
    M: { kind: "between", low: 13, high: 17 },
    F: { kind: "between", low: 12, high: 16 },
  },
  glucose_fasting: { kind: "between", low: 70, high: 99 },
  cholesterol_total: { kind: "max", high: 200 },
  ldl: { kind: "max", high: 130 },
  hdl: { kind: "min", low: 60 },
  triglyceride: { kind: "max", high: 150 },
  vitamin_d: { kind: "between", low: 30, high: 100 },
  ast: { kind: "max", high: 40 },
  alt: { kind: "max", high: 40 },
  ggt: {
    kind: "byGender",
    M: { kind: "max", high: 63 },
    F: { kind: "max", high: 35 },
  },
  creatinine: { kind: "between", low: 0.6, high: 1.2 },
  iop_l: { kind: "between", low: 10, high: 21 },
  iop_r: { kind: "between", low: 10, high: 21 },
  dexa: { kind: "min", low: -1.0 },
};

function evalSimple(r: SimpleRule, v: number): boolean {
  switch (r.kind) {
    case "between":
      return v >= r.low && v <= r.high;
    case "max":
      return v <= r.high;
    case "min":
      return v >= r.low;
  }
}

// 정상이면 "normal", 비정상이면 "abnormal", 판정 불가면 null
export function classifyValue(
  itemCode: string | null,
  value: string,
  gender: Gender | null
): "normal" | "abnormal" | null {
  if (!itemCode) return null;
  const rule = RANGES[itemCode];
  if (!rule) return null;

  const v = parseFloat(value);
  if (!Number.isFinite(v)) return null;

  let simple: SimpleRule | null;
  if (rule.kind === "byGender") {
    simple = gender === "M" ? rule.M : gender === "F" ? rule.F : null;
  } else {
    simple = rule;
  }
  if (!simple) return null; // 성별 미상 등 판정 보류

  return evalSimple(simple, v) ? "normal" : "abnormal";
}

// 0 또는 음수가 정상값으로 허용되는 항목인지 (예: 골밀도 T-score)
// 직접입력/범위 미상 항목은 알 수 없으므로 허용(true)
export function allowsNonPositive(itemCode: string | null): boolean {
  if (!itemCode) return true;
  const rule = RANGES[itemCode];
  if (!rule) return true;
  const check = (r: SimpleRule) =>
    (r.kind === "min" && r.low <= 0) || (r.kind === "between" && r.low <= 0);
  if (rule.kind === "byGender") return check(rule.M) || check(rule.F);
  return check(rule);
}

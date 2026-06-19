// DB 테이블 대응 TypeScript 타입 (0001_init.sql 기준)

export type Gender = "M" | "F";
export type RecordType = "checkup" | "single";
export type FileType = "image" | "pdf";
export type FamilyRole = "owner" | "member";

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  name: string;
  birth_date: string | null;
  gender: Gender | null;
  emoji: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface CheckupRecord {
  id: string;
  member_id: string;
  type: RecordType;
  record_date: string;
  hospital: string | null;
  notes: string | null;
  created_at: string;
}

export interface CheckupItem {
  id: string;
  record_id: string;
  item_code: string | null;
  item_name: string;
  value: string | null;
  unit: string | null;
  is_abnormal: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  record_id: string;
  file_url: string;
  file_type: FileType | null;
  created_at: string;
}

export interface ItemDefinition {
  item_code: string;
  category: string;
  item_name: string;
  unit: string | null;
  normal_range: string | null;
  description: string | null;
  sort_order: number;
}

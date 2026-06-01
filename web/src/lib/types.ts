// Domain model. Money is always an integer number of rupiah (IDR).
export type PersonId = "mei" | "bas";

export type SplitType = "equal" | "custom" | "full";

export interface Profile {
  id: PersonId;
  name: string;
  color: string; // identity color (hex)
  soft: string; // soft background tint (hex)
  initial: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // glyph key in CAT_GLYPHS
  color: string; // hex
  budget: number | null; // monthly budget in rupiah, null = no budget
}

export interface Shares {
  mei: number;
  bas: number;
}

export interface Expense {
  id: string;
  spent_at: string; // ISO date YYYY-MM-DD
  category_id: string;
  payer_id: PersonId;
  amount: number; // total in rupiah
  description: string;
  split_type: SplitType;
  owner?: PersonId; // only for split_type === 'full'
  recurring?: boolean;
  shares: Shares; // SUM(shares) === amount
  // Stored receipt. Live mode: a Storage object path "<household>/<id>.jpg".
  // Local mode: a data: URL held in memory. null/undefined = no receipt.
  receipt_path?: string | null;
}

export interface Settlement {
  id: string;
  from_id: PersonId;
  to_id: PersonId;
  amount: number;
  note: string | null;
  settled_at: string; // ISO date
}

export interface Recurring {
  id: string;
  description: string;
  category_id: string;
  payer_id: PersonId;
  amount: number;
  split_type: SplitType;
  day: number; // day of month 1..28
  active: boolean;
}

export interface TrendPoint {
  m: string; // month label, e.g. 'Mei'
  total: number;
}

import type { CreditTransaction } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";

const TABLE = "credit_transactions";
const COLUMNS = "id, amount, reason, trip_log_id, payment_id, created_at";

/** 마이페이지에서 한 번에 보여줄 최대 건수. */
const DEFAULT_LIMIT = 100;

type CreditTransactionRow = {
  id: string;
  amount: number | string;
  reason: string | null;
  trip_log_id: string | null;
  payment_id: string | null;
  created_at: string;
};

function toTransaction(row: CreditTransactionRow): CreditTransaction {
  return {
    id: row.id,
    amount: Number(row.amount) || 0,
    reason: row.reason ?? "",
    tripLogId: row.trip_log_id,
    paymentId: row.payment_id,
    createdAt: row.created_at,
  };
}

/**
 * 내 크레딧 원장을 최신순으로 가져온다.
 *
 * user_id로 거르지 않는 이유: RLS가 이미 본인 행만 내려준다.
 * 여기서 한 번 더 거르면 "필터를 빼면 남의 것도 보인다"는 착각을 남긴다.
 * (실제로 확인함 — 남의 행을 요청해도 0건이 돌아온다.)
 *
 * 원장은 서버(service_role)만 쓸 수 있다. 브라우저에서는 읽기만 가능하다.
 */
export async function fetchCreditTransactions(
  limit: number = DEFAULT_LIMIT,
): Promise<CreditTransaction[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      getErrorMessage(error, "크레딧 사용 내역을 불러오지 못했습니다."),
    );
  }

  return (data as CreditTransactionRow[]).map(toTransaction);
}

export type CreditReasonTone = "earn" | "spend";

export interface CreditReasonDescription {
  label: string;
  /** 부가 설명. 없으면 표시하지 않는다. */
  hint?: string;
  tone: CreditReasonTone;
}

/**
 * 원장의 사유 코드를 사람이 읽는 문구로 바꾼다.
 *
 * 모르는 코드도 반드시 무언가를 돌려준다. 서버에 새 사유가 생겼을 때
 * 화면에서 그 줄이 통째로 사라지거나 빈칸이 되면 안 되기 때문이다.
 */
export function describeCreditReason(
  transaction: CreditTransaction,
): CreditReasonDescription {
  const tone: CreditReasonTone = transaction.amount >= 0 ? "earn" : "spend";

  switch (transaction.reason) {
    case "signup":
      return { label: "가입 축하 크레딧", tone: "earn" };
    case "generate":
      return { label: "여행 일정 생성", hint: "AI 호출 1회", tone: "spend" };
    case "refund":
      return {
        label: "생성 실패 환불",
        hint: "AI 응답을 받지 못해 되돌렸습니다",
        tone: "earn",
      };
    case "purchase":
    case "payment":
    case "topup":
      return { label: "크레딧 충전", tone: "earn" };
    case "grant":
    case "admin":
      return { label: "관리자 지급", tone: "earn" };
    default:
      return {
        label: tone === "earn" ? "크레딧 적립" : "크레딧 사용",
        hint: transaction.reason || undefined,
        tone,
      };
  }
}

export interface CreditSummary {
  /** 충전·환불·지급으로 들어온 합계(양수). */
  earned: number;
  /** 사용으로 나간 합계(양수로 환산). */
  spent: number;
}

/** 내역 상단에 보여줄 합계. 잔액은 user_credits에서 따로 읽는다. */
export function summarizeCredits(
  transactions: CreditTransaction[],
): CreditSummary {
  let earned = 0;
  let spent = 0;

  for (const transaction of transactions) {
    if (transaction.amount >= 0) {
      earned += transaction.amount;
    } else {
      spent += -transaction.amount;
    }
  }

  return { earned, spent };
}

/** "2026. 9. 4. 오후 5:15" 형태. 목록에서 한 줄에 들어가야 해서 초는 뺀다. */
export function formatTransactionTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

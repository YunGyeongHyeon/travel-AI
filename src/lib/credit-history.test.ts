import type { CreditTransaction } from "@/types";
import {
  describeCreditReason,
  fetchCreditTransactions,
  summarizeCredits,
} from "@/lib/credit-history";

const client = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => client,
}));

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    amount: -1,
    reason: "generate",
    trip_log_id: null,
    payment_id: null,
    created_at: "2026-09-04T08:15:22.128Z",
    ...overrides,
  };
}

function tx(overrides: Partial<CreditTransaction> = {}): CreditTransaction {
  return {
    id: "tx-1",
    amount: -1,
    reason: "generate",
    tripLogId: null,
    paymentId: null,
    createdAt: "2026-09-04T08:15:22.128Z",
    ...overrides,
  };
}

/** .from().select().order().limit() 사슬을 통째로 세운다. */
function mockQuery(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  client.from.mockReturnValue({ select });
  return { select, order, limit };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchCreditTransactions", () => {
  it("snake_case 컬럼을 camelCase로 바꿔 돌려준다", async () => {
    mockQuery({
      data: [row({ amount: "3", reason: "signup", payment_id: "pay-1" })],
      error: null,
    });

    const transactions = await fetchCreditTransactions();

    expect(transactions).toEqual([
      {
        id: "tx-1",
        amount: 3,
        reason: "signup",
        tripLogId: null,
        paymentId: "pay-1",
        createdAt: "2026-09-04T08:15:22.128Z",
      },
    ]);
    expect(client.from).toHaveBeenCalledWith("credit_transactions");
  });

  it("최신순으로 정렬하고 건수를 제한한다", async () => {
    const { order, limit } = mockQuery({ data: [], error: null });

    await fetchCreditTransactions(20);

    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limit).toHaveBeenCalledWith(20);
  });

  it("조회에 실패하면 에러를 던진다", async () => {
    mockQuery({ data: null, error: { message: "permission denied" } });

    await expect(fetchCreditTransactions()).rejects.toThrow("permission denied");
  });
});

describe("describeCreditReason", () => {
  it("알려진 사유는 사람이 읽는 문구로 바꾼다", () => {
    expect(describeCreditReason(tx({ reason: "signup", amount: 3 })).label).toBe(
      "가입 축하 크레딧",
    );
    expect(describeCreditReason(tx({ reason: "generate" })).label).toBe(
      "여행 일정 생성",
    );
    expect(
      describeCreditReason(tx({ reason: "refund", amount: 1 })).label,
    ).toBe("생성 실패 환불");
    expect(
      describeCreditReason(tx({ reason: "purchase", amount: 10 })).label,
    ).toBe("크레딧 충전");
  });

  it("사유를 모를 때는 부호로 적립·사용을 가른다", () => {
    expect(describeCreditReason(tx({ reason: "promo", amount: 5 })).tone).toBe(
      "earn",
    );
    expect(describeCreditReason(tx({ reason: "promo", amount: -5 })).tone).toBe(
      "spend",
    );
  });

  it("아는 사유는 금액 부호와 무관하게 성격을 고정한다", () => {
    // 환불은 언제나 적립, 생성은 언제나 사용이다.
    // 데이터가 이상해도 문구가 뒤집히면 더 헷갈린다.
    expect(describeCreditReason(tx({ reason: "refund", amount: 1 })).tone).toBe(
      "earn",
    );
    expect(
      describeCreditReason(tx({ reason: "generate", amount: 5 })).tone,
    ).toBe("spend");
  });

  it("모르는 사유도 빈칸으로 두지 않는다", () => {
    // 서버에 새 사유가 생겨도 그 줄이 통째로 비면 안 된다.
    const unknown = describeCreditReason(tx({ reason: "promo", amount: 2 }));

    expect(unknown.label).toBe("크레딧 적립");
    expect(unknown.hint).toBe("promo");
  });
});

describe("summarizeCredits", () => {
  it("적립과 사용을 따로 더한다", () => {
    const summary = summarizeCredits([
      tx({ id: "a", amount: 3, reason: "signup" }),
      tx({ id: "b", amount: -1 }),
      tx({ id: "c", amount: -1 }),
      tx({ id: "d", amount: 1, reason: "refund" }),
    ]);

    // 사용은 양수로 환산해 돌려준다 — 화면에서 부호를 직접 붙인다.
    expect(summary).toEqual({ earned: 4, spent: 2 });
  });

  it("내역이 없으면 0으로 시작한다", () => {
    expect(summarizeCredits([])).toEqual({ earned: 0, spent: 0 });
  });
});

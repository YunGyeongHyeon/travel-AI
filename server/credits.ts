import { createServiceClient } from "./auth.js";

/**
 * 크레딧 차감/환불.
 *
 * 왜 서버가, 그것도 service_role로 하는가:
 *   - 잔액을 올리는 조작(환불)을 클라이언트가 부를 수 있으면 무한 크레딧이 된다.
 *   - 그래서 supabase/credits.sql에서 두 함수의 실행 권한을 service_role에만 줬다.
 *   - 차감 로직 자체도 Postgres 함수 안에 있다. 여기서 select → if → update로
 *     쪼개면 동시 요청이 같은 잔액을 읽어 둘 다 통과한다.
 */

/** 잔액이 부족해 차감하지 못한 경우 함수가 돌려주는 값 */
const INSUFFICIENT = -1;

export type ConsumeResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "insufficient" | "unavailable" };

/**
 * 크레딧 1개를 차감한다. AI를 호출하기 "전에" 부른다.
 *
 * 실패(insufficient)면 호출부는 402를 반환하고 AI를 부르지 않는다.
 * unavailable은 DB 자체를 못 쓴 경우다 — 이때는 과금하지 않고 통과시킨다.
 * 크레딧 시스템 장애로 서비스 전체를 멈추는 편이 더 나쁘다.
 */
export async function consumeCredit(userId: string): Promise<ConsumeResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, reason: "unavailable" };
  }

  const { data, error } = await supabase.rpc("consume_credit", {
    p_user_id: userId,
    p_reason: "generate",
  });

  if (error) {
    console.error("크레딧 차감 실패:", error);
    return { ok: false, reason: "unavailable" };
  }

  const remaining = Number(data);
  if (remaining === INSUFFICIENT) {
    return { ok: false, reason: "insufficient" };
  }
  return { ok: true, remaining };
}

/**
 * 차감했던 크레딧을 되돌린다. AI 호출이 실패했을 때 부른다.
 *
 * 이게 없으면 Gemini 503이나 JSON 깨짐으로 실패했을 때
 * 사용자는 결과 없이 크레딧만 잃는다.
 *
 * 환불 자체가 실패해도 예외를 던지지 않는다. 이미 원래 에러를 응답하는
 * 중이고, 환불 실패로 그 에러를 덮으면 원인을 알 수 없게 된다.
 */
export async function refundCredit(userId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { error } = await supabase.rpc("refund_credit", {
    p_user_id: userId,
    p_reason: "refund",
  });

  if (error) {
    // 원장(credit_transactions)에 차감만 남고 환불이 빠진 상태가 된다.
    // 눈에 띄게 남겨서 나중에 손으로 맞출 수 있게 한다.
    console.error(`크레딧 환불 실패 (user ${userId}) — 수동 보정 필요:`, error);
  }
}

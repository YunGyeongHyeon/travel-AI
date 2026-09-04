import type { TravelRequest, TripLogSummary, TripPlan } from "../src/types/index.js";
import { createUserScopedClient } from "./auth.js";

const TABLE = "trip_logs";

/**
 * 생성한 일정을 여행 로그로 남긴다.
 *
 * 프론트가 아니라 서버가 쓰는 이유: 응답을 돌려주기 전에 기록이 끝나야
 * 사용자가 결과를 받자마자 창을 닫아도 이미 돈이 나간 일정이 사라지지 않는다.
 *
 * 실패해도 예외를 던지지 않는다. 일정 자체는 유효하므로 화면에는 띄워야 한다.
 */
export async function insertTripLog(
  token: string,
  userId: string,
  request: TravelRequest,
  plan: TripPlan,
): Promise<TripLogSummary | null> {
  const supabase = createUserScopedClient(token);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      is_favorite: false,
      trip_title: plan.tripTitle,
      destination_name: plan.destinationName || request.destination,
      duration_summary: plan.durationSummary ?? "",
      target_budget: plan.budgetAnalysis?.targetBudget ?? request.budget ?? 0,
      request,
      plan,
    })
    .select("id, created_at, is_favorite")
    .single();

  if (error || !data) {
    console.error("여행 로그 저장 실패:", error);
    return null;
  }

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    isFavorite: data.is_favorite as boolean,
    tripTitle: plan.tripTitle,
    destinationName: plan.destinationName || request.destination,
    durationSummary: plan.durationSummary ?? "",
    targetBudget: plan.budgetAnalysis?.targetBudget ?? request.budget ?? 0,
  };
}

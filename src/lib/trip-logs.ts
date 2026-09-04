import type { TripLog, TripLogSummary, TripPlan } from "@/types";
import { getSupabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";

const TABLE = "trip_logs";

/** 목록에 필요한 컬럼만. plan(jsonb)은 목록에서 절대 내려받지 않는다. */
const SUMMARY_COLUMNS =
  "id, created_at, is_favorite, trip_title, destination_name, duration_summary, target_budget";

type TripLogRow = {
  id: string;
  created_at: string;
  is_favorite: boolean;
  trip_title: string;
  destination_name: string;
  duration_summary: string;
  target_budget: number;
  plan?: TripPlan;
};

function toSummary(row: TripLogRow): TripLogSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    isFavorite: row.is_favorite,
    tripTitle: row.trip_title,
    destinationName: row.destination_name,
    durationSummary: row.duration_summary,
    targetBudget: Number(row.target_budget) || 0,
  };
}

export async function fetchTripLogs(): Promise<TripLogSummary[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      getErrorMessage(error, "여행 로그를 불러오지 못했습니다."),
    );
  }

  return (data as TripLogRow[]).map(toSummary);
}

/** 로그 하나를 일정 본문(plan)까지 통째로 가져온다. 목록에서 열 때만 호출. */
export async function fetchTripLog(logId: string): Promise<TripLog> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(`${SUMMARY_COLUMNS}, plan`)
    .eq("id", logId)
    .single();

  if (error || !data) {
    throw new Error(
      getErrorMessage(error, "여행 일정을 불러오지 못했습니다."),
    );
  }

  const row = data as TripLogRow;
  return { ...toSummary(row), plan: row.plan as TripPlan };
}

/** 즐겨찾기(스크랩) 토글. */
export async function setTripLogFavorite(
  logId: string,
  isFavorite: boolean,
): Promise<void> {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({ is_favorite: isFavorite })
    .eq("id", logId);

  if (error) {
    throw new Error(
      getErrorMessage(error, "즐겨찾기를 변경하지 못했습니다."),
    );
  }
}

export async function deleteTripLog(logId: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq("id", logId);

  if (error) {
    throw new Error(getErrorMessage(error, "여행 로그를 삭제하지 못했습니다."));
  }
}

/** 장소 교체처럼 일정 본문이 바뀌었을 때 로그에도 반영한다. */
export async function updateTripLogPlan(
  logId: string,
  plan: TripPlan,
): Promise<void> {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({ plan })
    .eq("id", logId);

  if (error) {
    throw new Error(getErrorMessage(error, "변경한 일정을 저장하지 못했습니다."));
  }
}

// ── localStorage → Supabase 1회성 이관 ───────────────────────
// 로그인 기능이 붙기 전 localStorage에 쌓아둔 일정을 잃지 않도록 옮긴다.
// 옮긴 뒤 키를 지우므로 계정당 한 번만 실행된다.

const LEGACY_SAVED_TRIPS_KEY = "ai_travel_saved_trips";

export async function migrateLegacyTrips(userId: string): Promise<number> {
  let legacy: TripPlan[];
  try {
    const stored = localStorage.getItem(LEGACY_SAVED_TRIPS_KEY);
    if (!stored) return 0;
    const parsed = JSON.parse(stored) as unknown;
    legacy = Array.isArray(parsed) ? (parsed as TripPlan[]) : [];
  } catch {
    // 깨진 값이면 되살릴 방법이 없다. 지우고 넘어간다.
    localStorage.removeItem(LEGACY_SAVED_TRIPS_KEY);
    return 0;
  }

  if (legacy.length === 0) {
    localStorage.removeItem(LEGACY_SAVED_TRIPS_KEY);
    return 0;
  }

  // 예전에 '저장' 버튼을 눌러 남긴 것들이므로 즐겨찾기로 옮긴다.
  const rows = legacy
    .filter((plan) => plan && plan.tripTitle)
    .map((plan) => ({
      user_id: userId,
      created_at: plan.createdAt ?? new Date().toISOString(),
      is_favorite: true,
      trip_title: plan.tripTitle,
      destination_name: plan.destinationName ?? plan.request?.destination ?? "",
      duration_summary: plan.durationSummary ?? "",
      target_budget: plan.budgetAnalysis?.targetBudget ?? 0,
      request: plan.request ?? {},
      plan,
    }));

  if (rows.length === 0) {
    localStorage.removeItem(LEGACY_SAVED_TRIPS_KEY);
    return 0;
  }

  const { error } = await getSupabase().from(TABLE).insert(rows);
  if (error) {
    // 실패하면 키를 남겨둔다. 다음 로그인 때 다시 시도.
    console.error("기존 저장 일정 이관 실패", error);
    return 0;
  }

  localStorage.removeItem(LEGACY_SAVED_TRIPS_KEY);
  return rows.length;
}

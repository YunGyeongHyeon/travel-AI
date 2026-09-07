import type { TripPlan } from "@/types";

/**
 * 일정의 이동 구간을 집계한다.
 *
 * 예전에는 이 자리에 "Efficiency Score 98.4%"가 하드코딩돼 있었다.
 * 퍼센트를 내려면 최적화하지 않았을 때의 동선(비교 기준)이 있어야 하는데
 * AI 응답에도, 우리 데이터에도 그런 게 없다. 그래서 지어낸 숫자 대신
 * 실제로 셀 수 있는 값만 보여준다.
 */
export interface TripTransportStats {
  /** nextTransport가 있는 구간 수. 각 날의 마지막 장소에는 보통 없다. */
  legCount: number;
  totalMinutes: number;
  totalCost: number;
  walkLegs: number;
}

export function getTripTransportStats(trip: TripPlan): TripTransportStats {
  const stats: TripTransportStats = {
    legCount: 0,
    totalMinutes: 0,
    totalCost: 0,
    walkLegs: 0,
  };

  for (const day of trip.days ?? []) {
    for (const spot of day.spots ?? []) {
      const leg = spot.nextTransport;
      if (!leg) continue;

      stats.legCount += 1;
      // AI 응답이라 값이 비거나 문자열로 올 수 있다. 합계가 NaN이 되면 안 된다.
      stats.totalMinutes += Number(leg.durationMinutes) || 0;
      stats.totalCost += Number(leg.estimatedCost) || 0;
      if (leg.mode === "walk") stats.walkLegs += 1;
    }
  }

  return stats;
}

/** 375 → "6시간 15분", 120 → "2시간", 45 → "45분" */
export function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours === 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

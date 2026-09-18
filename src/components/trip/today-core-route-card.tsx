import type { DayPlan } from "@/types";
import { formatMinutes } from "@/lib/trip-stats";
import { Footprints } from "lucide-react";

interface TodayCoreRouteCardProps {
  day: DayPlan;
  totalMoveMinutes?: number;
  onMore?: () => void;
}

export function TodayCoreRouteCard({
  day,
  totalMoveMinutes,
  onMore,
}: TodayCoreRouteCardProps) {
  const top = day.spots.slice(0, 3);
  const overflow = Math.max(0, day.spots.length - 3);
  const dayMove =
    totalMoveMinutes ??
    day.spots.reduce(
      (sum, s) => sum + (Number(s.nextTransport?.durationMinutes) || 0),
      0,
    );

  return (
    <div className="col-span-12 rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-1">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-slate-900">오늘 핵심 동선</h3>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-[#6B4EFF]">
            Day {day.dayNumber}
          </span>
        </div>
        {dayMove > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#6B4EFF]/30 px-2.5 py-1 text-[11px] font-bold text-[#6B4EFF]">
            <Footprints className="size-3.5" />
            총 이동 {formatMinutes(dayMove)}
          </span>
        )}
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-slate-400">오늘 확정된 스팟이 아직 없어요</p>
      ) : (
        <ol className="space-y-2">
          {top.map((spot, i) => (
            <li key={spot.id} className="flex items-center gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#6B4EFF] text-[10px] font-black text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {spot.name}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {spot.timeSlot}
                  {spot.address ? ` · ${spot.address}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {overflow > 0 && (
        <button
          type="button"
          onClick={onMore}
          className="mt-3 text-[11px] font-bold text-[#6B4EFF] hover:underline cursor-pointer"
        >
          +{overflow} 더보기
        </button>
      )}
    </div>
  );
}

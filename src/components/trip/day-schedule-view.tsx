import React from "react";
import { TripPlan, PlaceSpot } from "@/types";
import { SpotCard } from "./spot-card";
import { DAY_MARKER_COLORS } from "@/lib/formatters";
import { Calendar, Compass, DollarSign, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DayScheduleViewProps {
  trip: TripPlan;
  activeDay: number | "all";
  selectedSpotId: string | null;
  onSelectDay: (day: number | "all") => void;
  onSelectSpot: (spot: PlaceSpot) => void;
  onSwapSpot: (spot: PlaceSpot) => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  trip,
  activeDay,
  selectedSpotId,
  onSelectDay,
  onSelectSpot,
  onSwapSpot,
}) => {
  const filteredDays =
    activeDay === "all"
      ? trip.days
      : trip.days.filter((d) => d.dayNumber === activeDay);

  return (
    <div className="space-y-6">
      {/* Day Selector Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectDay("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeDay === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>전체 일정 ({trip.days.length}일)</span>
        </button>

        {trip.days.map((day, idx) => {
          const isCurrent = activeDay === day.dayNumber;
          const dayColor = DAY_MARKER_COLORS[idx % DAY_MARKER_COLORS.length];
          return (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => onSelectDay(day.dayNumber)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex-shrink-0 flex items-center gap-2 cursor-pointer ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isCurrent ? "#ffffff" : dayColor }}
              />
              <span>Day {day.dayNumber}</span>
              <span className="text-[11px] opacity-80 hidden sm:inline font-normal truncate max-w-[120px]">
                {day.areaFocus}
              </span>
            </button>
          );
        })}
      </div>

      {/* Render Day Sections */}
      <div className="space-y-8">
        {filteredDays.map((day) => {
          const dayColor = DAY_MARKER_COLORS[(day.dayNumber - 1) % DAY_MARKER_COLORS.length];

          return (
            <Card
              key={day.dayNumber}
              className="p-5 sm:p-7 space-y-4"
            >
              {/* Day Header Banner */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-xs"
                        style={{ backgroundColor: dayColor }}
                      >
                        Day {day.dayNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-indigo-500" />
                        주요 권역: {day.areaFocus}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {day.themeTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {day.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center bg-white px-4 py-2.5 rounded-2xl border border-slate-200 flex-shrink-0">
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                        하루 예상 경비
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        ₩{day.dayEstimatedCost?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transit summary badge */}
                {day.transitSummary && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">이동 요약:</span>
                    <span>{day.transitSummary}</span>
                  </div>
                )}
              </div>

              {/* Spot Timeline List */}
              <div className="space-y-4 pt-1">
                {day.spots.map((spot, spotIdx) => (
                  <SpotCard
                    key={spot.id || `spot-${day.dayNumber}-${spotIdx}`}
                    spot={spot}
                    stepNumber={spotIdx + 1}
                    dayNumber={day.dayNumber}
                    dayColor={dayColor}
                    isSelected={spot.id === selectedSpotId}
                    onSelect={() => onSelectSpot(spot)}
                    onSwapSpot={onSwapSpot}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

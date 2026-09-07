import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlaceSpot, TripPlan } from "@/types";
import { InteractiveMap } from "./interactive-map";
import { DayScheduleView } from "./day-schedule-view";
import { FoodGuideView } from "./food-guide-view";
import { BudgetDetailView } from "./budget-detail-view";
import { TravelTipsView } from "./travel-tips-view";
import {
  MapPin,
  Layers,
  Utensils,
  PieChart,
  Luggage,
  Route,
  CalendarDays,
} from "lucide-react";

type DetailTab = "schedule" | "food" | "budget" | "tips";

const TABS: { id: DetailTab; label: string; icon: typeof Layers; activeClass: string }[] = [
  {
    id: "schedule",
    label: "일자별 상세 일정",
    icon: Layers,
    activeClass: "bg-slate-900 text-white shadow-md",
  },
  {
    id: "food",
    label: "미식 특화 가이드",
    icon: Utensils,
    activeClass: "bg-orange-500 text-white shadow-md",
  },
  {
    id: "budget",
    label: "예산 & 환율 분석",
    icon: PieChart,
    activeClass: "bg-emerald-600 text-white shadow-md",
  },
  {
    id: "tips",
    label: "동선 최적화 팁",
    icon: Luggage,
    activeClass: "bg-indigo-900 text-white shadow-md",
  },
];

function isDetailTab(value: string | null): value is DetailTab {
  return value === "schedule" || value === "food" || value === "budget" || value === "tips";
}

interface TripDetailViewProps {
  trip: TripPlan;
  onSwapSpot: (spot: PlaceSpot) => void;
}

export function TripDetailView({ trip, onSwapSpot }: TripDetailViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: DetailTab = isDetailTab(tabParam) ? tabParam : "schedule";
  // 기본은 첫째 날. 전체를 한 번에 뿌리면 핀이 뒤엉켜 그날 동선을 읽을 수 없다.
  const [activeDayNumber, setActiveDayNumber] = useState<number | "all">(
    () => trip.days[0]?.dayNumber ?? 1,
  );
  // 지도에만 적용되는 전체 보기. 왼쪽 목록은 선택한 날짜를 그대로 둔 채
  // 전체 동선만 훑어볼 수 있게 분리했다.
  const [showAllOnMap, setShowAllOnMap] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // 다른 일정을 열면 날짜 선택이 남아 있을 수 있다(그 일정엔 없는 날짜일 수도).
  useEffect(() => {
    setActiveDayNumber(trip.days[0]?.dayNumber ?? 1);
    setShowAllOnMap(false);
    setSelectedSpotId(null);
  }, [trip.id, trip.days]);

  const mapActiveDay = showAllOnMap ? "all" : activeDayNumber;

  // 스크롤은 카드가 실제로 그려진 뒤에 해야 한다.
  // 날짜가 바뀌면 목록이 새로 렌더되므로 커밋 이후로 미룬다.
  const pendingScrollSpotId = useRef<string | null>(null);

  useEffect(() => {
    const spotId = pendingScrollSpotId.current;
    if (!spotId) return;
    pendingScrollSpotId.current = null;

    document.getElementById(`spot-${spotId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedSpotId, activeDayNumber]);

  /** 목록에서 선택. 이미 그 자리를 보고 있으므로 스크롤하지 않는다. */
  const handleSelectSpot = (spot: PlaceSpot) => {
    setSelectedSpotId(spot.id);
  };

  /**
   * 지도 범례의 일차를 눌렀을 때.
   * 전체 동선 보기 중이었다면 해제해야 지도가 고른 날짜를 실제로 반영한다.
   */
  const handleSelectDayFromMap = (dayNumber: number) => {
    setActiveDayNumber(dayNumber);
    setShowAllOnMap(false);
    setSelectedSpotId(null);
  };

  /** 지도 핀에서 선택. 해당 날짜로 전환하고 왼쪽 상세로 스크롤한다. */
  const handleSelectSpotFromMap = (spot: PlaceSpot) => {
    const day = trip.days.find((d) => d.spots.some((s) => s.id === spot.id));

    // 전체 보기 중에 다른 날 핀을 누르면 목록도 그 날로 옮겨줘야
    // 스크롤할 카드가 화면에 존재한다.
    if (day && activeDayNumber !== "all" && activeDayNumber !== day.dayNumber) {
      setActiveDayNumber(day.dayNumber);
    }

    setSelectedSpotId(spot.id);
    pendingScrollSpotId.current = spot.id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                isActive
                  ? tab.activeClass
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <DayScheduleView
              trip={trip}
              activeDay={activeDayNumber}
              selectedSpotId={selectedSpotId}
              onSelectDay={(day) => {
                setActiveDayNumber(day);
              }}
              onSelectSpot={handleSelectSpot}
              onSwapSpot={onSwapSpot}
            />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-[32px] border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span className="truncate">인터랙티브 동선 맵</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllOnMap((prev) => !prev)}
                  title={
                    showAllOnMap
                      ? "선택한 날짜의 핀만 표시합니다"
                      : "모든 날짜의 핀을 함께 표시합니다"
                  }
                  aria-pressed={showAllOnMap}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    showAllOnMap
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {showAllOnMap ? (
                    <Route className="w-3.5 h-3.5" />
                  ) : (
                    <CalendarDays className="w-3.5 h-3.5" />
                  )}
                  <span className="whitespace-nowrap">
                    {showAllOnMap ? "전체 동선" : "이 날짜만"}
                  </span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                핀을 누르면 왼쪽 상세 일정으로 이동합니다
              </p>

              <div className="h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-100">
                <InteractiveMap
                  trip={trip}
                  activeDay={mapActiveDay}
                  selectedSpotId={selectedSpotId}
                  onSelectSpot={handleSelectSpotFromMap}
                  onSelectDay={handleSelectDayFromMap}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "food" && (
        <FoodGuideView trip={trip} onSelectSpot={handleSelectSpot} />
      )}

      {activeTab === "budget" && <BudgetDetailView trip={trip} />}

      {activeTab === "tips" && <TravelTipsView trip={trip} />}
    </div>
  );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlaceSpot, TripPlan } from "@/types";
import { InteractiveMap } from "./interactive-map";
import { DayScheduleView } from "./day-schedule-view";
import { FoodGuideView } from "./food-guide-view";
import { BudgetDetailView } from "./budget-detail-view";
import { TravelTipsView } from "./travel-tips-view";
import { MapPin, Layers, Utensils, PieChart, Luggage } from "lucide-react";

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
  const [activeDayNumber, setActiveDayNumber] = useState<number | "all">("all");
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const handleSelectSpot = (spot: PlaceSpot) => {
    setSelectedSpotId(spot.id);
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>인터랙티브 동선 맵</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  마커 클릭 시 상세 이동
                </span>
              </div>

              <div className="h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-100">
                <InteractiveMap
                  trip={trip}
                  activeDay={activeDayNumber}
                  selectedSpotId={selectedSpotId}
                  onSelectSpot={handleSelectSpot}
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

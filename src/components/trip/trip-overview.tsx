import { useState } from "react";
import { Link } from "react-router-dom";
import { TripPlan, PlaceSpot } from "@/types";
import { InteractiveMap } from "./interactive-map";
import { TodayCoreRouteCard } from "./today-core-route-card";
import { formatMinutes, getTripTransportStats } from "@/lib/trip-stats";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Footprints,
} from "lucide-react";

interface TripOverviewProps {
  trip: TripPlan;
  onSelectSpot?: (spot: PlaceSpot) => void;
}

export function TripOverview({ trip, onSelectSpot }: TripOverviewProps) {
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const currentDay =
    trip.days.find((d) => d.dayNumber === activeDayNumber) ?? trip.days[0];

  if (!currentDay) {
    return null;
  }

  const targetBudget = trip.budgetAnalysis.targetBudget || 1000000;
  const totalCost = trip.budgetAnalysis.totalEstimatedCost || 600000;
  const spentPercent = Math.min(
    100,
    Math.round((totalCost / targetBudget) * 100),
  );

  // 전 일정의 이동 구간 집계. 지어낸 효율 점수 대신 실제로 셀 수 있는 값만 쓴다.
  const transport = getTripTransportStats(trip);

  const activeSpot = selectedSpotId
    ? (currentDay.spots.find((s) => s.id === selectedSpotId) ??
      currentDay.spots[0])
    : currentDay.spots[0];

  const handleSelectSpot = (spot: PlaceSpot) => {
    setSelectedSpotId(spot.id);
    onSelectSpot?.(spot);
  };

  /**
   * 지도 범례의 일차를 눌렀을 때. 핀과 아래 Day Timeline이 함께 바뀐다.
   * 이전 날짜에서 고른 스팟은 새 날짜에 없으므로 선택을 비운다.
   */
  const handleSelectDay = (dayNumber: number) => {
    setActiveDayNumber(dayNumber);
    setSelectedSpotId(null);
  };

  const handlePrevDay = () => {
    if (activeDayNumber > 1) {
      setActiveDayNumber((prev) => prev - 1);
      setSelectedSpotId(null);
    }
  };

  const handleNextDay = () => {
    if (activeDayNumber < trip.days.length) {
      setActiveDayNumber((prev) => prev + 1);
      setSelectedSpotId(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5 items-stretch">
      <TodayCoreRouteCard
        day={currentDay}
        onMore={() => {
          /* Day timeline is below — scroll into view via schedule link if needed */
        }}
      />
      <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[440px] lg:min-h-[500px]">
        <div className="flex-1 relative w-full h-full min-h-[360px]">
          <InteractiveMap
            trip={trip}
            activeDay={activeDayNumber}
            selectedSpotId={selectedSpotId}
            onSelectSpot={handleSelectSpot}
            onSelectDay={handleSelectDay}
          />
        </div>

        {/*
          지도가 isolate로 갇혔으므로 z-10이면 그 위에 뜬다.
          예전의 z-[400]은 Leaflet과 겨루려던 값인데, 그 값이 루트 맥락으로
          새어 나가 모달까지 덮었다.
        */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/70 flex justify-between items-center shadow-lg z-10">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="bg-slate-900 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
              D{currentDay.dayNumber}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Current Focus • {currentDay.areaFocus}
              </p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {activeSpot ? activeSpot.name : currentDay.themeTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[11px] font-bold hidden sm:block">
              {currentDay.spots.length}개 스팟
            </div>
            <Link
              to="/plan/detail?tab=schedule"
              className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors"
              title="일정 전체 보기"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-indigo-600 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-indigo-100 min-h-[220px]">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-indigo-100 text-xs sm:text-sm font-semibold opacity-90">
              전체 이동 시간
            </p>
            <div className="w-6 h-6 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
          </div>
          <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tight">
            {transport.legCount > 0 ? formatMinutes(transport.totalMinutes) : "—"}
          </p>
        </div>

        {/*
          예전에는 여기에 "98.4%"와 "이동 시간 45% 단축"이 박혀 있었다.
          퍼센트를 내려면 최적화 전 동선이라는 비교 기준이 필요한데 그런 데이터가
          없어서 어떤 일정을 열어도 같은 숫자가 나왔다. 실제로 셀 수 있는 것만 남긴다.
        */}
        <div className="pt-4 border-t border-white/15">
          {transport.legCount > 0 ? (
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1 text-xs opacity-90">
                <p>
                  이동 {transport.legCount}구간 · 교통비 ₩
                  {transport.totalCost.toLocaleString()}
                </p>
                <p className="flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5 shrink-0" />
                  도보 {transport.walkLegs}구간
                </p>
              </div>
              <svg
                className="w-8 h-8 shrink-0 opacity-40"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          ) : (
            <p className="text-xs leading-relaxed opacity-75">
              이 일정에는 구간별 이동 정보가 없습니다
            </p>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[380px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center text-sm sm:text-base">
              <span className="w-2 h-5 bg-indigo-600 rounded mr-2" />
              Day {currentDay.dayNumber} Timeline
            </h3>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentDay.areaFocus}
            </span>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
            {currentDay.spots.slice(0, 4).map((spot, idx) => {
              const isFirst = idx === 0;
              const isSelected = spot.id === selectedSpotId;
              return (
                <div
                  key={spot.id || idx}
                  onClick={() => handleSelectSpot(spot)}
                  className="relative flex items-start space-x-3.5 pl-7 cursor-pointer group transition-all"
                >
                  <div
                    className={`absolute left-0 w-6 h-6 rounded-full z-10 flex items-center justify-center transition-all ${
                      isSelected || isFirst
                        ? "bg-white border-2 border-indigo-600"
                        : "bg-slate-100 border-2 border-slate-200 group-hover:border-indigo-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected || isFirst ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[11px] font-bold text-slate-400">
                      {spot.timeSlot}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {spot.name}
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                      {spot.categoryName} •{" "}
                      {spot.recommendedMenu?.[0] || spot.description}
                    </p>
                    {spot.category === "restaurant" && (
                      <span className="text-[10px] text-orange-600 font-bold block mt-0.5">
                        ★ 현지 대표 미식 스팟
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={activeDayNumber === 1}
            className="font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev Day</span>
          </button>

          <span className="font-extrabold text-slate-700">
            {activeDayNumber} / {trip.days.length}
          </span>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={activeDayNumber === trip.days.length}
            className="font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <span>Next Day</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[220px]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Budget Tracker
            </h3>
            <span className="text-xs text-slate-400">목표 예산 대비 설계</span>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            JPY/KRW 9.1
          </span>
        </div>

        <div className="my-3">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">
              예상 지출: ₩{totalCost.toLocaleString()}
            </span>
            <span className="font-bold text-slate-800">
              목표: ₩{targetBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>* 식사, 교통비, 입장료 종합 포함</span>
          <Link
            to="/plan/detail?tab=budget"
            className="text-indigo-600 font-bold hover:underline"
          >
            상세 보기 →
          </Link>
        </div>
      </div>

      <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[220px]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base">
            Gourmet Highlights
          </h3>
          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
            {trip.foodSpotlights.length || 4}선
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 py-1">
          {trip.foodSpotlights.length > 0 ? (
            <>
              <Link
                to="/plan/detail?tab=food"
                className="aspect-square bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5 transition-all"
              >
                <span className="text-xl mb-1">🍣</span>
                <span className="font-bold text-slate-800 line-clamp-1">
                  {trip.foodSpotlights[0]?.name || "스시"}
                </span>
              </Link>

              <Link
                to="/plan/detail?tab=food"
                className="aspect-square bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5 transition-all"
              >
                <span className="text-xl mb-1">🥘</span>
                <span className="font-bold text-slate-800 line-clamp-1">
                  {trip.foodSpotlights[1]?.name || "오코노미야키"}
                </span>
              </Link>

              <Link
                to="/plan/detail?tab=food"
                className="aspect-square border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl flex items-center justify-center flex-col text-slate-400 hover:text-orange-600 transition-all"
              >
                <span className="text-lg font-bold">+</span>
                <span className="text-[10px] font-semibold">더보기</span>
              </Link>
            </>
          ) : (
            <>
              <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5">
                <span className="text-xl mb-1">🍜</span>
                <span className="font-bold">라멘</span>
              </div>
              <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5">
                <span className="text-xl mb-1">🍢</span>
                <span className="font-bold">쿠시카츠</span>
              </div>
              <Link
                to="/plan/detail?tab=food"
                className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center"
              >
                <span className="text-slate-400 text-lg">+</span>
              </Link>
            </>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-1">
          * 동선 상의 시그니처 로컬 맛집 연계
        </p>
      </div>
    </div>
  );
}

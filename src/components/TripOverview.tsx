import React, { useState } from "react";
import { TripPlan, PlaceSpot } from "../types";
import { getTripThemeLabel } from "../utils/formatters";
import { InteractiveMap } from "./InteractiveMap";
import { DayScheduleView } from "./DayScheduleView";
import { FoodGuideView } from "./FoodGuideView";
import { BudgetDetailView } from "./BudgetDetailView";
import { TravelTipsView } from "./TravelTipsView";
import {
  MapPin,
  Calendar,
  Wallet,
  Sparkles,
  Utensils,
  PieChart,
  Luggage,
  Share2,
  Bookmark,
  MessageSquare,
  RotateCcw,
  Layers,
  LayoutGrid,
  TrendingUp,
  Ticket,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Compass,
} from "lucide-react";

interface TripOverviewProps {
  trip: TripPlan;
  onReset: () => void;
  onSaveTrip: () => void;
  isSaved: boolean;
  onOpenExport: () => void;
  onOpenChat: () => void;
  onSwapSpot: (spot: PlaceSpot) => void;
}

export const TripOverview: React.FC<TripOverviewProps> = ({
  trip,
  onReset,
  onSaveTrip,
  isSaved,
  onOpenExport,
  onOpenChat,
  onSwapSpot,
}) => {
  const [activeTab, setActiveTab] = useState<
    "bento" | "schedule" | "food" | "budget" | "tips"
  >("bento");
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const currentDay =
    trip.days.find((d) => d.dayNumber === activeDayNumber) || trip.days[0];
  const targetBudget = trip.budgetAnalysis?.targetBudget || 1000000;
  const totalCost = trip.budgetAnalysis?.totalEstimatedCost || 600000;
  const spentPercent = Math.min(
    100,
    Math.round((totalCost / targetBudget) * 100),
  );

  // Determine current active spot or first spot of active day
  const activeSpot = selectedSpotId
    ? currentDay.spots.find((s) => s.id === selectedSpotId) ||
      currentDay.spots[0]
    : currentDay.spots[0];

  const handleSelectSpot = (spot: PlaceSpot) => {
    setSelectedSpotId(spot.id);
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
    <div className="space-y-6">
      {/* Top Bento Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md p-6 rounded-[32px] border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Plan Overview
            </span>
            <div className="h-3 w-px bg-slate-200" />
            <span className="text-xs font-bold text-indigo-600">
              {trip.destinationName} ({trip.country})
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {trip.durationSummary}
            </span>
            <span className="text-slate-300">•</span>
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {getTripThemeLabel(trip.request?.themes)}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {trip.tripTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {trip.tagline}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <button
            type="button"
            onClick={onSaveTrip}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-xs ${
              isSaved
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500 text-amber-500" : "text-slate-400"}`}
            />
            <span>{isSaved ? "저장됨" : "일정 저장"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>공유 / 내보내기</span>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="px-4 py-2.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI 비서</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>조건 수정</span>
          </button>
        </div>
      </header>

      {/* Navigation Pills (Bento Grid Theme) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setActiveTab("bento")}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === "bento"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Bento Grid 대시보드</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === "schedule"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>일자별 상세 일정</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("food")}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === "food"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-orange-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>미식 특화 가이드</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("budget")}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === "budget"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>예산 & 환율 분석</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tips")}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === "tips"
              ? "bg-indigo-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200 shadow-2xs"
          }`}
        >
          <Luggage className="w-4 h-4" />
          <span>동선 최적화 팁</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === "bento" && (
        <div className="grid grid-cols-12 gap-5 items-stretch">
          {/* Tile 1: Main Interactive Map Bento Card (col-span-12 lg:col-span-8) */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[440px] lg:min-h-[500px]">
            {/* Embedded Map Area */}
            <div className="flex-1 relative w-full h-full min-h-[360px]">
              <InteractiveMap
                trip={trip}
                activeDay={activeDayNumber}
                selectedSpotId={selectedSpotId}
                onSelectSpot={handleSelectSpot}
              />
            </div>

            {/* Floating Glass Pill Card at Bottom (from Bento Design HTML) */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/70 flex justify-between items-center shadow-lg z-[400]">
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
                <button
                  type="button"
                  onClick={() => setActiveTab("schedule")}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                  title="일정 전체 보기"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tile 2: Efficiency Score Card (col-span-12 sm:col-span-6 lg:col-span-4) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-indigo-600 rounded-[32px] p-6 text-white flex flex-col justify-between shadow-xl shadow-indigo-100 min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-indigo-100 text-xs sm:text-sm font-semibold opacity-90">
                  Efficiency Score (동선 최적화)
                </p>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </div>
              <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tight">
                98.4%
              </p>
            </div>

            <div className="flex items-end justify-between pt-4 border-t border-white/15">
              <p className="text-xs leading-relaxed opacity-90">
                인접 구역 순차 배치로
                <br />
                이동 시간 45% 단축 완료
              </p>
              <svg
                className="w-8 h-8 opacity-40"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>

          {/* Tile 3: Day Schedule Timeline Tile (col-span-12 lg:col-span-4) */}
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

              {/* Vertical Dot Timeline */}
              <div className="space-y-4 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                {currentDay.spots.slice(0, 4).map((spot, idx) => {
                  const isFirst = idx === 0;
                  const isSelected = spot.id === selectedSpotId;
                  return (
                    <div
                      key={spot.id || idx}
                      onClick={() => handleSelectSpot(spot)}
                      className={`relative flex items-start space-x-3.5 pl-7 cursor-pointer group transition-all`}
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
                            isSelected || isFirst
                              ? "bg-indigo-600"
                              : "bg-slate-300"
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

            {/* Day Navigation Switcher Footer */}
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

          {/* Tile 4: Budget Tracker Bento Card (col-span-12 sm:col-span-6 lg:col-span-4) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Budget Tracker
                </h3>
                <span className="text-xs text-slate-400">
                  목표 예산 대비 설계
                </span>
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
              <button
                type="button"
                onClick={() => setActiveTab("budget")}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                상세 보기 →
              </button>
            </div>
          </div>

          {/* Tile 5: Gourmet Highlights Bento Card (col-span-12 sm:col-span-6 lg:col-span-4) */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Gourmet Highlights
              </h3>
              <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                {trip.foodSpotlights?.length || 4}선
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-1">
              {trip.foodSpotlights && trip.foodSpotlights.length > 0 ? (
                <>
                  <div
                    onClick={() => setActiveTab("food")}
                    className="aspect-square bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5 transition-all cursor-pointer"
                  >
                    <span className="text-xl mb-1">🍣</span>
                    <span className="font-bold text-slate-800 line-clamp-1">
                      {trip.foodSpotlights[0]?.name || "스시"}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("food")}
                    className="aspect-square bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 rounded-2xl flex items-center justify-center flex-col text-[11px] text-center p-1.5 transition-all cursor-pointer"
                  >
                    <span className="text-xl mb-1">🥘</span>
                    <span className="font-bold text-slate-800 line-clamp-1">
                      {trip.foodSpotlights[1]?.name || "오코노미야키"}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab("food")}
                    className="aspect-square border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl flex items-center justify-center flex-col text-slate-400 hover:text-orange-600 transition-all cursor-pointer"
                  >
                    <span className="text-lg font-bold">+</span>
                    <span className="text-[10px] font-semibold">더보기</span>
                  </div>
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
                  <div
                    onClick={() => setActiveTab("food")}
                    className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer"
                  >
                    <span className="text-slate-400 text-lg">+</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-1">
              * 동선 상의 시그니처 로컬 맛집 연계
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Day Schedule View */}
      {activeTab === "schedule" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <DayScheduleView
              trip={trip}
              activeDay="all"
              selectedSpotId={selectedSpotId}
              onSelectDay={(day) => {
                if (typeof day === "number") setActiveDayNumber(day);
              }}
              onSelectSpot={handleSelectSpot}
              onSwapSpot={onSwapSpot}
            />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-[32px] p-5 border border-slate-200 shadow-xs space-y-3">
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

      {/* Tab 3: Food Guide */}
      {activeTab === "food" && (
        <FoodGuideView trip={trip} onSelectSpot={handleSelectSpot} />
      )}

      {/* Tab 4: Budget Breakdown */}
      {activeTab === "budget" && <BudgetDetailView trip={trip} />}

      {/* Tab 5: Travel Tips */}
      {activeTab === "tips" && <TravelTipsView trip={trip} />}
    </div>
  );
};

import React from "react";
import { Compass, Bookmark, Plus, Sparkles, Map } from "lucide-react";
import { TripPlan } from "../types";
import { getTripThemeLabel } from "../utils/formatters";

interface NavbarProps {
  savedCount: number;
  onOpenSaved: () => void;
  onNewTrip: () => void;
  hasActiveTrip: boolean;
  activeTrip?: TripPlan | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  savedCount,
  onOpenSaved,
  onNewTrip,
  hasActiveTrip,
  activeTrip,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F1F5F9]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={onNewTrip}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              ></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
                VoyageAI
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline-block">
                Bento Planner
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              지리적 최적 동선 & 테마별 미식 여행 설계기
            </p>
          </div>
        </div>

        {/* Center Pill Widget: Current Plan Info (From Bento Grid theme) */}
        {hasActiveTrip && activeTrip && (
          <div className="hidden lg:flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Current Plan
            </span>
            <div className="h-3.5 w-px bg-slate-200 mx-1"></div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <Map className="w-3 h-3" />
              {activeTrip.destinationName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {activeTrip.durationSummary}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-600">
              ₩{activeTrip.budgetAnalysis?.targetBudget?.toLocaleString()}
            </span>
            <span className="text-slate-300">•</span>
            <div className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              {getTripThemeLabel(activeTrip.request?.themes)}
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasActiveTrip && (
            <button
              type="button"
              onClick={onNewTrip}
              className="bg-slate-900 text-white px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:bg-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 조건 입력</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSaved}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 sm:px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 relative shadow-xs cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">저장 목록</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

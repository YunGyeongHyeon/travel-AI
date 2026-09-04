import { Link } from "react-router-dom";
import { History, LogOut, Plus, Map, Star } from "lucide-react";
import { TripPlan } from "@/types";
import { getTripThemeLabel } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  logCount: number;
  favoriteCount: number;
  onOpenLogs: () => void;
  hasActiveTrip: boolean;
  activeTrip?: TripPlan | null;
  userEmail?: string | null;
  onSignOut: () => void;
}

export function Navbar({
  logCount,
  favoriteCount,
  onOpenLogs,
  hasActiveTrip,
  activeTrip,
  userEmail,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F1F5F9]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link
          to="/"
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
        </Link>

        {hasActiveTrip && activeTrip && (
          <Link
            to="/plan"
            className="hidden lg:flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs hover:border-indigo-200"
          >
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
          </Link>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {hasActiveTrip && (
            <Button asChild className="h-auto rounded-full px-4 py-2.5 text-xs font-bold">
              <Link to="/">
                <Plus className="w-3.5 h-3.5" />
                <span>새 조건 입력</span>
              </Link>
            </Button>
          )}

          {userEmail && (
            <>
              <Button
                variant="secondary"
                onClick={onOpenLogs}
                className="relative h-auto rounded-full px-4 py-2.5 text-xs font-bold"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">여행 로그</span>
                {logCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {logCount}
                  </span>
                )}
                {favoriteCount > 0 && (
                  <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {favoriteCount}
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-1.5">
                <span
                  className="hidden md:inline text-[11px] font-semibold text-slate-500 max-w-[10rem] truncate"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSignOut}
                  title="로그아웃"
                  aria-label="로그아웃"
                  className="text-slate-400 hover:text-rose-600"
                >
                  <LogOut />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

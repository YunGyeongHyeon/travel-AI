import { Link } from "react-router-dom";
import { Coins, History, LogOut, Plus, Map, Star } from "lucide-react";
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
  /** null이면 크레딧을 도입하지 않은 상태라 표시하지 않는다. */
  credits?: number | null;
  onSignOut: () => void;
}

export function Navbar({
  logCount,
  favoriteCount,
  onOpenLogs,
  hasActiveTrip,
  activeTrip,
  userEmail,
  credits,
  onSignOut,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F1F5F9]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="flex min-w-0 shrink items-center gap-3 cursor-pointer select-none group"
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
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 whitespace-nowrap">
                VoyageAI
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hidden xl:inline-block whitespace-nowrap">
                Bento Planner
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden xl:block truncate">
              지리적 최적 동선 & 테마별 미식 여행 설계기
            </p>
          </div>
        </Link>

        {/*
          좁아지면 덜 중요한 항목부터 접는다: 테마 → 예산 → "Current Plan" 라벨.
          목적지는 마지막까지 남기되 truncate로 … 처리한다.
          min-w-0가 없으면 flex 자식이 콘텐츠 크기 밑으로 못 줄어들어
          글자가 세로로 쪼개지며 헤더를 넘긴다.
        */}
        {hasActiveTrip && activeTrip && (
          <Link
            to="/plan"
            title={`${activeTrip.destinationName} • ${activeTrip.durationSummary}`}
            className="hidden lg:flex min-w-0 shrink items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs hover:border-indigo-200"
          >
            <span className="hidden xl:inline shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Current Plan
            </span>
            <div className="hidden xl:block shrink-0 h-3.5 w-px bg-slate-200" />
            <span className="flex min-w-0 items-center gap-1 text-xs font-bold text-indigo-600">
              <Map className="w-3 h-3 shrink-0" />
              <span className="truncate">{activeTrip.destinationName}</span>
            </span>
            <span className="shrink-0 text-slate-300">•</span>
            <span className="shrink-0 text-xs font-semibold text-slate-600 whitespace-nowrap">
              {activeTrip.durationSummary}
            </span>
            <span className="hidden xl:inline shrink-0 text-slate-300">•</span>
            <span className="hidden xl:inline shrink-0 text-xs font-semibold text-slate-600 whitespace-nowrap">
              ₩{activeTrip.budgetAnalysis?.targetBudget?.toLocaleString()}
            </span>
            <span className="hidden 2xl:inline shrink-0 text-slate-300">•</span>
            <div className="hidden 2xl:block shrink-0 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              {getTripThemeLabel(activeTrip.request?.themes)}
            </div>
          </Link>
        )}

        {/* shrink-0: 우측 조작부는 절대 눌리지 않게 두고, 공간은 좌측 Current Plan이 양보한다 */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {hasActiveTrip && (
            <Button
              asChild
              className="h-auto shrink-0 rounded-full px-3 sm:px-4 py-2.5 text-xs font-bold"
            >
              <Link to="/">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline whitespace-nowrap">
                  새 조건 입력
                </span>
              </Link>
            </Button>
          )}

          {userEmail && (
            <>
              {credits !== null && credits !== undefined && (
                <div
                  title={`남은 크레딧 ${credits}개 — 일정 1건 생성에 1개 필요`}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 sm:px-3 py-2 text-xs font-bold border ${
                    credits === 0
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span>{credits}</span>
                  <span className="hidden lg:inline font-semibold">크레딧</span>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={onOpenLogs}
                title="여행 로그"
                className="relative h-auto shrink-0 rounded-full px-3 sm:px-4 py-2.5 text-xs font-bold"
              >
                <History className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                <span className="hidden lg:inline whitespace-nowrap">여행 로그</span>
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

              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className="hidden xl:inline text-[11px] font-semibold text-slate-500 max-w-[8rem] 2xl:max-w-[12rem] truncate"
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
                  className="shrink-0 text-slate-400 hover:text-rose-600"
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

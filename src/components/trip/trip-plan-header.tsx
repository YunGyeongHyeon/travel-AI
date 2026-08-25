import { Link, useLocation } from "react-router-dom";
import {
  Bookmark,
  MessageSquare,
  RotateCcw,
  Share2,
  LayoutGrid,
  Layers,
} from "lucide-react";
import type { TripPlan } from "@/types";
import { getTripThemeLabel } from "@/lib/formatters";
import { Button } from "@/components/ui/button";

type TripPlanHeaderProps = {
  trip: TripPlan;
  isSaved: boolean;
  onSaveTrip: () => void;
  onOpenExport: () => void;
  onOpenChat: () => void;
};

export function TripPlanHeader({
  trip,
  isSaved,
  onSaveTrip,
  onOpenExport,
  onOpenChat,
}: TripPlanHeaderProps) {
  const location = useLocation();
  const isOverview = location.pathname === "/plan";
  const isDetail = location.pathname.startsWith("/plan/detail");

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md p-6 rounded-[32px] border border-slate-200 shadow-sm">
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
            {getTripThemeLabel(trip.request.themes)}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {trip.tripTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          {trip.tagline}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
        <Button
          variant="secondary"
          onClick={onSaveTrip}
          className={`h-auto rounded-full px-4 py-2.5 text-xs font-bold ${
            isSaved ? "bg-amber-50 border-amber-300 text-amber-800" : ""
          }`}
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500 text-amber-500" : "text-slate-400"}`}
          />
          <span>{isSaved ? "저장됨" : "일정 저장"}</span>
        </Button>

        <Button
          variant="secondary"
          onClick={onOpenExport}
          className="h-auto rounded-full px-4 py-2.5 text-xs font-bold"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span>공유 / 내보내기</span>
        </Button>

        <Button onClick={onOpenChat} className="h-auto rounded-full px-4 py-2.5 text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI 비서</span>
        </Button>

        {!isOverview && (
          <Button
            variant="secondary"
            asChild
            className="h-auto rounded-full px-4 py-2.5 text-xs font-bold"
          >
            <Link to="/plan">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>전체 보기</span>
            </Link>
          </Button>
        )}

        {!isDetail && (
          <Button
            variant="secondary"
            asChild
            className="h-auto rounded-full px-4 py-2.5 text-xs font-bold"
          >
            <Link to="/plan/detail">
              <Layers className="w-3.5 h-3.5" />
              <span>상세 일정</span>
            </Link>
          </Button>
        )}

        <Button asChild className="h-auto rounded-full px-4 py-2.5 text-xs font-bold">
          <Link to="/">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>조건 수정</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

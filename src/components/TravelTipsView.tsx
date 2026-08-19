import React, { useState } from "react";
import { TripPlan } from "../types";
import { Compass, Ticket, CheckSquare, ShieldAlert, CloudSun, Check, Sparkles } from "lucide-react";

interface TravelTipsViewProps {
  trip: TripPlan;
}

export const TravelTipsView: React.FC<TravelTipsViewProps> = ({ trip }) => {
  const tips = trip.localTravelTips;
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="space-y-8">
      {/* Route Optimization Geographic Explanation */}
      <div className="bg-slate-900 rounded-[32px] p-6 sm:p-8 text-white shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Geographic Route Analytics</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          동선 낭비 0%를 위한 맞춤 설계 비결 🗺️
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          {trip.routeOptimizationExplanation ||
            "각 일차별로 인접한 구역끼리 밀집 배치하여 대중교통 환승 횟수를 최소화하고, 도보 이동 시간을 아껴 여행지에서의 체류 시간을 극대화했습니다."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Passes */}
        {tips?.recommendedPasses && (
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                추천 교통 패스 & 티켓
              </h4>
            </div>

            <ul className="space-y-2.5">
              {tips.recommendedPasses.map((pass, idx) => (
                <li
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{pass}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Packing Checklist */}
        {tips?.packingEssentials && (
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                여행 필수 준비물 체크리스트
              </h4>
            </div>

            <div className="space-y-2">
              {tips.packingEssentials.map((item, idx) => {
                const isDone = !!checkedItems[item];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(item)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm ${
                      isDone
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through opacity-80"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-medium">{item}</span>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Local Etiquette & Rules */}
        {tips?.localEtiquette && (
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                현지 매너 & 주의사항
              </h4>
            </div>

            <ul className="space-y-2.5">
              {tips.localEtiquette.map((etiquette, idx) => (
                <li
                  key={idx}
                  className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100 text-xs sm:text-sm text-slate-700 flex items-start gap-2.5"
                >
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{etiquette}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weather & Outfit Advice */}
        {tips?.weatherAdvice && (
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CloudSun className="w-4 h-4" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                날씨 및 옷차림 가이드
              </h4>
            </div>

            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {tips.weatherAdvice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

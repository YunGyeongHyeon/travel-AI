import React, { useState } from "react";
import { TripPlan } from "@/types";
import { DollarSign, PieChart, Sparkles, TrendingUp, Wallet, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BudgetDetailViewProps {
  trip: TripPlan;
}

export const BudgetDetailView: React.FC<BudgetDetailViewProps> = ({ trip }) => {
  const analysis = trip.budgetAnalysis;
  const target = analysis.targetBudget || 1000000;
  const total = analysis.totalEstimatedCost || 600000;
  const remaining = target - total;
  const percentUsed = Math.min(100, Math.round((total / target) * 100));

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState<number>(100000);
  const isJapan = trip.destinationName?.includes("일본") || trip.country?.includes("일본") || trip.destinationName?.includes("오사카") || trip.destinationName?.includes("도쿄") || trip.destinationName?.includes("후쿠오카");
  const exchangeRateJPY = 0.11; // 1 KRW ≈ 0.11 JPY (or 100 JPY ≈ 910 KRW)
  const exchangeRateUSD = 0.00075;
  const exchangeRateEUR = 0.00069;

  const categories = [
    {
      key: "food",
      data: analysis.categories?.food,
      defaultLabel: "식비 & 미식",
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: "🍜",
    },
    {
      key: "lodging",
      data: analysis.categories?.lodging,
      defaultLabel: "숙박비",
      color: "bg-teal-500",
      textColor: "text-teal-700",
      bgLight: "bg-teal-50",
      borderColor: "border-teal-200",
      icon: "🏨",
    },
    {
      key: "transport",
      data: analysis.categories?.transport,
      defaultLabel: "교통비 & 패스",
      color: "bg-blue-500",
      textColor: "text-blue-700",
      bgLight: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: "🚆",
    },
    {
      key: "attraction",
      data: analysis.categories?.attraction,
      defaultLabel: "관광 / 입장료",
      color: "bg-purple-500",
      textColor: "text-purple-700",
      bgLight: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: "🎟️",
    },
    {
      key: "shoppingEtc",
      data: analysis.categories?.shoppingEtc,
      defaultLabel: "쇼핑 & 비상금",
      color: "bg-rose-500",
      textColor: "text-rose-700",
      bgLight: "bg-rose-50",
      borderColor: "border-rose-200",
      icon: "🛍️",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Target Budget Card */}
        <Card className="rounded-[28px] p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>설정 목표 예산</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            ₩{target.toLocaleString()}
          </p>
          <span className="text-xs text-slate-400 mt-1.5 block">
            {trip.durationSummary} 기준 총 예산
          </span>
        </Card>

        {/* Estimated Spend Card */}
        <Card className="rounded-[28px] p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>AI 최적 예상 총액</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">
            ₩{total.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 font-bold mt-1.5 block">
            예산의 {percentUsed}% 사용 (안정적 설계)
          </span>
        </Card>

        {/* Remaining Surplus Card */}
        <Card className="rounded-[28px] p-6">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>남은 여유 비상금</span>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${remaining >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
            {remaining >= 0 ? `+₩${remaining.toLocaleString()}` : `-₩${Math.abs(remaining).toLocaleString()}`}
          </p>
          <span className="text-xs text-slate-500 mt-1.5 block">
            쇼핑 및 현지 돌발 지출에 활용 가능
          </span>
        </Card>
      </div>

      {/* Progress Bar Breakdown */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            항목별 예산 배분 & 지출 구성비
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            실제 여행 일정의 모든 식사, 교통비, 입장료를 종합 반영한 최적의 밸런스입니다.
          </p>
        </div>

        {/* Multi-segmented Visual Progress Bar */}
        <div className="w-full h-3.5 rounded-full bg-slate-100 flex overflow-hidden">
          {categories.map((cat) => {
            const pct = cat.data?.percentage || 20;
            return (
              <div
                key={cat.key}
                className={`${cat.color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${cat.data?.label || cat.defaultLabel}: ${pct}%`}
              />
            );
          })}
        </div>

        {/* Category Detailed Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {categories.map((cat) => {
            const amount = cat.data?.estimatedAmount || 0;
            const pct = cat.data?.percentage || 0;
            const label = cat.data?.label || cat.defaultLabel;

            return (
              <div
                key={cat.key}
                className={`rounded-[24px] p-5 border ${cat.bgLight} ${cat.borderColor} space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span className="text-sm">{cat.icon}</span>
                    <span>{label}</span>
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                    {pct}%
                  </span>
                </div>

                <div className="text-lg font-bold text-slate-900">
                  ₩{amount.toLocaleString()}
                </div>

                {cat.data?.details && cat.data.details.length > 0 && (
                  <ul className="text-xs text-slate-600 space-y-1 pt-2 border-t border-black/5">
                    {cat.data.details.map((detail, dIdx) => (
                      <li key={dIdx} className="line-clamp-2 leading-relaxed">
                        • {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Saving Tips Section */}
      {analysis.savingTips && analysis.savingTips.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-[32px] p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base sm:text-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>AI 추천 예산 세이빙 & 가성비 꿀팁</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {analysis.savingTips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-emerald-200 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Live Currency Converter */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            현지 통화 간편 환율 계산기
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* KRW Input */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              원화 (KRW)
            </label>
            <input
              type="number"
              value={convertAmount}
              onChange={(e) => setConvertAmount(Number(e.target.value) || 0)}
              className="w-full font-bold text-base bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900"
              step="10000"
            />
          </div>

          {/* JPY Output */}
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200">
            <span className="text-[11px] font-bold text-rose-700 block mb-1">
              일본 엔화 (JPY)
            </span>
            <div className="text-lg font-bold text-rose-950 py-1.5">
              ¥{Math.round(convertAmount * exchangeRateJPY).toLocaleString()}
            </div>
          </div>

          {/* USD Output */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-700 block mb-1">
              미국 달러 (USD)
            </span>
            <div className="text-lg font-bold text-blue-950 py-1.5">
              ${(convertAmount * exchangeRateUSD).toFixed(2)}
            </div>
          </div>

          {/* EUR Output */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200">
            <span className="text-[11px] font-bold text-indigo-700 block mb-1">
              유로 (EUR)
            </span>
            <div className="text-lg font-bold text-indigo-950 py-1.5">
              €{(convertAmount * exchangeRateEUR).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

import React, { useState } from "react";
import {
  TravelRequest,
  TravelTheme,
  CompanionType,
  PaceType,
  TransportType,
} from "@/types";
import {
  THEME_CONFIG,
  COMPANION_CONFIG,
  PACE_CONFIG,
  TRANSPORT_CONFIG,
} from "@/lib/formatters";
import { PRESET_OPTIONS, PresetOption } from "@/data/sample-trips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Zap,
  Sliders,
  Check,
  ChevronRight,
  Flame,
} from "lucide-react";

interface TripInputFormProps {
  isLoading: boolean;
  onSubmit: (request: TravelRequest) => void;
  onSelectPreset: (preset: PresetOption) => void;
}

const POPULAR_DESTINATIONS = [
  "일본 오사카",
  "일본 도쿄",
  "일본 후쿠오카",
  "일본 교토",
  "제주도",
  "태국 방콕",
  "베트남 다낭",
  "프랑스 파리",
  "대만 타이베이",
];

const BUDGET_PRESETS = [500000, 800000, 1000000, 1500000, 2000000, 3000000];

export const TripInputForm: React.FC<TripInputFormProps> = ({
  isLoading,
  onSubmit,
  onSelectPreset,
}) => {
  const [destination, setDestination] = useState("");
  const [durationNights, setDurationNights] = useState(2);
  const [durationDays, setDurationDays] = useState(3);
  const [budget, setBudget] = useState(1000000);
  const [currency, setCurrency] = useState<"KRW" | "JPY" | "USD" | "EUR">(
    "KRW",
  );
  const [themes, setThemes] = useState<TravelTheme[]>(["food", "hotplace"]);
  const [companions, setCompanions] = useState<CompanionType>("friends");
  const [pace, setPace] = useState<PaceType>("moderate");
  const [transportPreference, setTransportPreference] =
    useState<TransportType>("public");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const toggleTheme = (themeKey: TravelTheme) => {
    setThemes((prev) =>
      prev.includes(themeKey)
        ? prev.length > 1
          ? prev.filter((t) => t !== themeKey)
          : prev
        : [...prev, themeKey],
    );
  };

  const handleNightsChange = (nights: number) => {
    setDurationNights(nights);
    setDurationDays(nights + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    onSubmit({
      destination: destination.trim(),
      durationNights,
      durationDays,
      budget,
      currency,
      themes,
      companions,
      pace,
      transportPreference,
      specialRequests: specialRequests.trim(),
    });
  };

  return (
    <Card className="rounded-[32px] py-0 gap-0 p-6 sm:p-8 space-y-8">
      {/* Quick Presets Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Curated Presets</span>
          </div>
          <span className="text-xs text-slate-400">
            클릭 즉시 조건이 채워집니다
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PRESET_OPTIONS.map((p) => {
            const isSelected =
              destination === p.request.destination &&
              durationNights === p.request.durationNights;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDestination(p.request.destination);
                  setDurationNights(p.request.durationNights);
                  setDurationDays(p.request.durationDays);
                  setBudget(p.request.budget);
                  setThemes(p.request.themes);
                  setCompanions(p.request.companions);
                  setPace(p.request.pace);
                  setTransportPreference(p.request.transportPreference);
                  setSpecialRequests(p.request.specialRequests || "");
                  onSelectPreset(p);
                }}
                className={`p-3 text-left rounded-2xl border transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                <div className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded inline-block mb-1">
                  {p.badge}
                </div>
                <div className="font-bold text-xs text-slate-900 line-clamp-1">
                  {p.title}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {p.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Main Custom Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Destination & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Destination */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>여행 목적지 (Destination)</span>
            </Label>

            <div className="relative">
              <Input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 일본 오사카, 도쿄, 제주도, 파리, 방콕"
                required
                className="h-auto bg-slate-50 rounded-2xl px-4 py-3.5 text-sm font-semibold"
              />
            </div>

            {/* Quick destination tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_DESTINATIONS.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setDestination(city)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    destination === city
                      ? "bg-slate-900 text-white border-slate-900 font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>여행 기간 (Duration)</span>
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[
                { nights: 1, days: 2, label: "1박 2일" },
                { nights: 2, days: 3, label: "2박 3일" },
                { nights: 3, days: 4, label: "3박 4일" },
                { nights: 4, days: 5, label: "4박 5일" },
              ].map((dur) => (
                <button
                  key={dur.nights}
                  type="button"
                  onClick={() => handleNightsChange(dur.nights)}
                  className={`py-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    durationNights === dur.nights
                      ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs sm:text-sm block">{dur.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Budget with presets and slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>희망 여행 경비 (Budget Tracker)</span>
            </label>

            <div className="text-right">
              <span className="text-lg sm:text-xl font-black text-slate-900">
                ₩{budget.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">
                ({durationNights}박 {durationDays}일 총액)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={300000}
              max={5000000}
              step={50000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="budget-range"
              aria-label="희망 여행 경비"
            />
          </div>

          {/* Quick budget chip buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {BUDGET_PRESETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBudget(amt)}
                className={`text-xs px-3.5 py-1 rounded-full border transition-all cursor-pointer ${
                  budget === amt
                    ? "bg-slate-900 text-white border-slate-900 font-bold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {amt >= 1000000 ? `${amt / 10000}만 원` : `${amt / 10000}만 원`}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Travel Themes (Multi-select) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>여행 테마 선택 (Themes)</span>
            </label>
            <span className="text-xs text-slate-400 font-medium">
              {themes.length}개 선택됨
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {(Object.keys(THEME_CONFIG) as TravelTheme[]).map((themeKey) => {
              const theme = THEME_CONFIG[themeKey];
              const isSelected = themes.includes(themeKey);
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => toggleTheme(themeKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="text-lg mb-1">{theme.icon}</div>
                  <div className="text-xs font-bold leading-tight">
                    {theme.label}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}
                  >
                    {theme.description}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              동행자, 일정 페이스, 이동 수단 등 상세 옵션{" "}
              {isAdvancedOpen ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </button>

          {isAdvancedOpen && (
            <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-[28px] space-y-5 animate-fadeIn">
              {/* Companions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>동행자 구성</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(Object.keys(COMPANION_CONFIG) as CompanionType[]).map(
                    (compKey) => {
                      const comp = COMPANION_CONFIG[compKey];
                      const isSelected = companions === compKey;
                      return (
                        <button
                          key={compKey}
                          type="button"
                          onClick={() => setCompanions(compKey)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white font-bold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-base block mb-0.5">
                            {comp.icon}
                          </span>
                          <span className="text-xs block">{comp.label}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Pace & Transport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pace */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5 text-orange-500" />
                    <span>일정 밀도 (페이스)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PACE_CONFIG) as PaceType[]).map((paceKey) => {
                      const p = PACE_CONFIG[paceKey];
                      const isSelected = pace === paceKey;
                      return (
                        <button
                          key={paceKey}
                          type="button"
                          onClick={() => setPace(paceKey)}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-orange-500 border-orange-500 text-white font-bold"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-xs font-bold block">
                            {p.label}
                          </span>
                          <span
                            className={`text-[10px] block mt-0.5 ${isSelected ? "text-orange-100" : "text-slate-400"}`}
                          >
                            {p.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transport */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                    <span>선호 이동 수단</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(TRANSPORT_CONFIG) as TransportType[]).map(
                      (transKey) => {
                        const t = TRANSPORT_CONFIG[transKey];
                        const isSelected = transportPreference === transKey;
                        return (
                          <button
                            key={transKey}
                            type="button"
                            onClick={() => setTransportPreference(transKey)}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white font-bold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-xs font-bold block">
                              {t.label}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  특별 요청 사항 (선택)
                </Label>
                <Textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="예: 웨이팅이 너무 길지 않은 곳, 스시와 야키니쿠는 꼭 먹기, 일몰 시간에 맞춰 전망대 배치 등"
                  rows={2}
                  className="min-h-16 rounded-2xl p-3.5 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="default"
            size="lg"
            disabled={isLoading}
            className="w-full shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI가 Bento 최적 동선과 맛집을 설계하고 있습니다...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>
                  {destination} {durationNights}박 {durationDays}일 최적 일정
                  생성하기
                </span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

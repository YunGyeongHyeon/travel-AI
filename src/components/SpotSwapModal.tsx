import React, { useState } from "react";
import { PlaceSpot, TripPlan } from "../types";
import { RefreshCw, X, Sparkles, Check, Loader2 } from "lucide-react";

interface SpotSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: PlaceSpot | null;
  trip: TripPlan;
  onConfirmSwap: (oldSpotId: string, newSpot: PlaceSpot) => void;
}

export const SpotSwapModal: React.FC<SpotSwapModalProps> = ({
  isOpen,
  onClose,
  spot,
  trip,
  onConfirmSwap,
}) => {
  const [preference, setPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !spot) return null;

  const quickPreferences = [
    "웨이팅이 적고 가성비 좋은 로컬 식당",
    "더 고급스럽고 분위기 좋은 곳",
    "해당 구역의 미쉐린 가이드/유명 핫플레이스",
    "가벼운 디저트나 스페셜티 카페",
    "실내에서 편하게 즐길 수 있는 곳",
  ];

  const handleSwap = async (customPref?: string) => {
    const finalPref = customPref || preference || "인근 최적의 대안 장소";
    setIsLoading(true);

    try {
      const res = await fetch("/api/regenerate-spot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: trip.destinationName,
          dayNumber: 1,
          currentSpot: spot,
          userPreference: finalPref,
        }),
      });

      const newSpot: PlaceSpot = await res.json();
      onConfirmSwap(spot.id, newSpot);
      onClose();
    } catch (err) {
      console.error("Failed to swap spot:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">장소 / 맛집 대안 변경</h3>
              <p className="text-xs text-slate-500">동선에 무리를 주지 않는 새로운 장소를 추천합니다</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Spot Preview */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            현재 선택된 장소
          </span>
          <div className="font-bold text-sm text-slate-900">{spot.name}</div>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{spot.description}</p>
        </div>

        {/* Quick Preference Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            어떤 스타일의 대안을 원하시나요?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickPreferences.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPreference(qp);
                  handleSwap(qp);
                }}
                disabled={isLoading}
                className="text-xs bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer text-left"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            직접 원하는 조건 입력 (선택)
          </label>
          <input
            type="text"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            placeholder="예: 라멘 말고 야키토리 집으로, 해산물 전문점 등"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => handleSwap()}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>추천 장소 찾는 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>새로운 장소로 교체하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { PlaceSpot, TripPlan } from "../types";
import { RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { Button, ErrorBanner, Modal } from "./ui";

interface SpotSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: PlaceSpot | null;
  trip: TripPlan;
  onConfirmSwap: (oldSpotId: string, newSpot: PlaceSpot) => void;
}

const QUICK_PREFERENCES = [
  "웨이팅이 적고 가성비 좋은 로컬 식당",
  "더 고급스럽고 분위기 좋은 곳",
  "해당 구역의 미쉐린 가이드/유명 핫플레이스",
  "가벼운 디저트나 스페셜티 카페",
  "실내에서 편하게 즐길 수 있는 곳",
];

export function SpotSwapModal({
  isOpen,
  onClose,
  spot,
  trip,
  onConfirmSwap,
}: SpotSwapModalProps) {
  const [preference, setPreference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = async (customPref?: string) => {
    if (!spot) return;

    const finalPref = customPref || preference || "인근 최적의 대안 장소";
    const dayNumber =
      trip.days.find((day) => day.spots.some((item) => item.id === spot.id))
        ?.dayNumber ?? 1;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/regenerate-spot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: trip.destinationName,
          dayNumber,
          currentSpot: spot,
          userPreference: finalPref,
        }),
      });

      if (!res.ok) {
        throw new Error("대안 장소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }

      const newSpot = (await res.json()) as PlaceSpot;
      onConfirmSwap(spot.id, newSpot);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "대안 장소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen && !!spot}
      onClose={onClose}
      title="장소 / 맛집 대안 변경"
      description="동선에 무리를 주지 않는 새로운 장소를 추천합니다"
      icon={
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <RefreshCw className="w-4 h-4" />
        </div>
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="indigo"
            size="sm"
            onClick={() => void handleSwap()}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 shadow-md"
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
          </Button>
        </>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {spot && (
        <>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              현재 선택된 장소
            </span>
            <div className="font-bold text-sm text-slate-900">{spot.name}</div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {spot.description}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              어떤 스타일의 대안을 원하시나요?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PREFERENCES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setPreference(option);
                    void handleSwap(option);
                  }}
                  disabled={isLoading}
                  className="text-xs bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 font-medium px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

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
        </>
      )}
    </Modal>
  );
}

import { useState } from "react";
import { RefreshCw, Sparkles, Loader2 } from "lucide-react";
import type { PlaceSpot, TripPlan } from "@/types";
import { regenerateSpot } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { AlertBanner } from "@/components/alert-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      const newSpot = await regenerateSpot({
        destination: trip.destinationName,
        dayNumber,
        currentSpot: spot,
        userPreference: finalPref,
      });
      onConfirmSwap(spot.id, newSpot);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "대안 장소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen && !!spot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>장소 / 맛집 대안 변경</DialogTitle>
              <DialogDescription>
                동선에 무리를 주지 않는 새로운 장소를 추천합니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <AlertBanner message={error} onDismiss={() => setError(null)} />
        )}

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
              <Label className="text-xs font-bold text-slate-700">
                어떤 스타일의 대안을 원하시나요?
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PREFERENCES.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreference(option);
                      void handleSwap(option);
                    }}
                    disabled={isLoading}
                    className="h-auto whitespace-normal text-left text-xs"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                직접 원하는 조건 입력 (선택)
              </Label>
              <Input
                type="text"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="예: 라멘 말고 야키토리 집으로, 해산물 전문점 등"
                className="h-auto rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSwap()}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                추천 장소 찾는 중...
              </>
            ) : (
              <>
                <Sparkles />
                새로운 장소로 교체하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

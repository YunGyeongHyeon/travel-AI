import { Bookmark, Trash2, ArrowRight } from "lucide-react";
import type { TripPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTrips: TripPlan[];
  onLoadTrip: (trip: TripPlan) => void;
  onDeleteTrip: (tripId: string) => void;
}

export function SavedTripsModal({
  isOpen,
  onClose,
  savedTrips,
  onLoadTrip,
  onDeleteTrip,
}: SavedTripsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>저장된 여행 일정 목록</DialogTitle>
              <DialogDescription>
                언제든 다시 불러와서 수정하거나 확인할 수 있습니다
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          <div className="space-y-3 pr-1">
            {savedTrips.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>아직 저장된 여행 일정이 없습니다.</p>
                <p className="mt-0.5">
                  일정 생성 후 상단의 '일정 저장' 버튼을 눌러보세요!
                </p>
              </div>
            ) : (
              savedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3 group"
                >
                  <button
                    type="button"
                    onClick={() => onLoadTrip(trip)}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{trip.destinationName}</Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        {trip.durationSummary}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {trip.tripTitle}
                    </h4>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      예산: ₩{trip.budgetAnalysis.targetBudget.toLocaleString()} •{" "}
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={() => onLoadTrip(trip)}
                      title="일정 열기"
                    >
                      <ArrowRight />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteTrip(trip.id)}
                      title="삭제"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

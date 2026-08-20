import { TripPlan } from "../types";
import { Bookmark, Trash2, ArrowRight } from "lucide-react";
import { Button, Modal } from "./ui";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="저장된 여행 일정 목록"
      description="언제든 다시 불러와서 수정하거나 확인할 수 있습니다"
      icon={
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <Bookmark className="w-4 h-4" />
        </div>
      }
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
        {savedTrips.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>아직 저장된 여행 일정이 없습니다.</p>
            <p className="mt-0.5">일정 생성 후 상단의 '일정 저장' 버튼을 눌러보세요!</p>
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
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {trip.destinationName}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {trip.durationSummary}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-amber-700 transition-colors">
                  {trip.tripTitle}
                </h4>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  예산: ₩{trip.budgetAnalysis?.targetBudget?.toLocaleString()} •{" "}
                  {new Date(trip.createdAt).toLocaleDateString()}
                </div>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoadTrip(trip)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors cursor-pointer"
                  title="일정 열기"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTrip(trip.id)}
                  className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

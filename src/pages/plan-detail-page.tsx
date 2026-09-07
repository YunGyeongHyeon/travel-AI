import { TripDetailView } from "@/components/trip/trip-detail-view";
import { TripPlanHeader } from "@/components/trip/trip-plan-header";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";

export function PlanDetailPage() {
  const {
    currentTrip,
    currentLogId,
    isCurrentTripFavorite,
    toggleCurrentTripFavorite,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
  } = useTripPlannerContext();

  if (!currentTrip) {
    return null;
  }

  return (
    <div className="space-y-6">
      <TripPlanHeader
        trip={currentTrip}
        isFavorite={isCurrentTripFavorite}
        canFavorite={!!currentLogId}
        onToggleFavorite={toggleCurrentTripFavorite}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <TripDetailView
        trip={currentTrip}
        onSwapSpot={(spot) => setSwapTargetSpot(spot)}
      />
    </div>
  );
}

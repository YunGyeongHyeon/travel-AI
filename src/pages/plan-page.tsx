import { TripOverview } from "@/components/trip/trip-overview";
import { TripPlanHeader } from "@/components/trip/trip-plan-header";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";

export function PlanPage() {
  const {
    currentTrip,
    currentLogId,
    isCurrentTripFavorite,
    toggleCurrentTripFavorite,
    setIsExportOpen,
    setIsChatOpen,
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
      <TripOverview trip={currentTrip} />
    </div>
  );
}

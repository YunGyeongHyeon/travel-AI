import { TripOverview } from "@/components/trip/trip-overview";
import { TripPlanHeader } from "@/components/trip/trip-plan-header";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";

export function PlanPage() {
  const {
    currentTrip,
    isCurrentTripSaved,
    saveCurrentTrip,
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
        isSaved={isCurrentTripSaved}
        onSaveTrip={saveCurrentTrip}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
      />
      <TripOverview trip={currentTrip} />
    </div>
  );
}

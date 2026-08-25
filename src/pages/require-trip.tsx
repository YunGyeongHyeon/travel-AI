import { Navigate, Outlet } from "react-router-dom";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";

export function RequireTrip() {
  const { currentTrip } = useTripPlannerContext();

  if (!currentTrip) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

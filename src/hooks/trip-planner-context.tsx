import { createContext, useContext, type ReactNode } from "react";
import { useTripPlanner } from "@/hooks/use-trip-planner";
import { useAuth } from "@/hooks/auth-context";

type TripPlannerContextValue = ReturnType<typeof useTripPlanner>;

const TripPlannerContext = createContext<TripPlannerContextValue | null>(null);

export function TripPlannerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useTripPlanner(user?.id ?? null);
  return (
    <TripPlannerContext.Provider value={value}>
      {children}
    </TripPlannerContext.Provider>
  );
}

export function useTripPlannerContext() {
  const context = useContext(TripPlannerContext);
  if (!context) {
    throw new Error("useTripPlannerContext는 TripPlannerProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}

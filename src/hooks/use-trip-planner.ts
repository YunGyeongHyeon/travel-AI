import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceSpot, TravelRequest, TripPlan } from "@/types";
import { generateItinerary as requestItinerary } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

const STORAGE_KEY = "ai_travel_saved_trips";
const CURRENT_TRIP_KEY = "ai_travel_current_trip";

function loadSavedTrips(): TripPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TripPlan[]) : [];
  } catch {
    return [];
  }
}

function persistSavedTrips(trips: TripPlan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error("Failed to save trips to localStorage", error);
  }
}

function loadCurrentTrip(): TripPlan | null {
  try {
    const stored = sessionStorage.getItem(CURRENT_TRIP_KEY);
    return stored ? (JSON.parse(stored) as TripPlan) : null;
  } catch {
    return null;
  }
}

function persistCurrentTrip(trip: TripPlan | null) {
  try {
    if (trip) {
      sessionStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(trip));
    } else {
      sessionStorage.removeItem(CURRENT_TRIP_KEY);
    }
  } catch (error) {
    console.error("Failed to persist current trip", error);
  }
}

export function useTripPlanner() {
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(() =>
    loadCurrentTrip(),
  );
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [swapTargetSpot, setSwapTargetSpot] = useState<PlaceSpot | null>(null);

  const lastRequestRef = useRef<TravelRequest | null>(null);

  useEffect(() => {
    setSavedTrips(loadSavedTrips());
  }, []);

  const generateItinerary = useCallback(async (request: TravelRequest) => {
    lastRequestRef.current = request;
    setIsLoading(true);
    setError(null);

    try {
      const plan = await requestItinerary(request);
      setCurrentTrip(plan);
      persistCurrentTrip(plan);
      return plan;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryLastGenerate = useCallback(async () => {
    if (!lastRequestRef.current) {
      return null;
    }
    return generateItinerary(lastRequestRef.current);
  }, [generateItinerary]);

  const saveCurrentTrip = useCallback(() => {
    if (!currentTrip) return;

    setSavedTrips((prev) => {
      const exists = prev.some((trip) => trip.id === currentTrip.id);
      const updated = exists
        ? prev.filter((trip) => trip.id !== currentTrip.id)
        : [currentTrip, ...prev];
      persistSavedTrips(updated);
      return updated;
    });
  }, [currentTrip]);

  const deleteSavedTrip = useCallback((tripId: string) => {
    setSavedTrips((prev) => {
      const updated = prev.filter((trip) => trip.id !== tripId);
      persistSavedTrips(updated);
      return updated;
    });
  }, []);

  const loadSavedTrip = useCallback((trip: TripPlan) => {
    setCurrentTrip(trip);
    persistCurrentTrip(trip);
    setError(null);
    setIsSavedOpen(false);
  }, []);

  const applySpotSwap = useCallback((oldSpotId: string, newSpot: PlaceSpot) => {
    setCurrentTrip((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        days: prev.days.map((day) => ({
          ...day,
          spots: day.spots.map((spot) => (spot.id === oldSpotId ? newSpot : spot)),
        })),
      };
      persistCurrentTrip(next);
      return next;
    });
  }, []);

  const isCurrentTripSaved = currentTrip
    ? savedTrips.some((trip) => trip.id === currentTrip.id)
    : false;

  return {
    currentTrip,
    savedTrips,
    isLoading,
    error,
    isSavedOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    isCurrentTripSaved,
    setIsSavedOpen,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
    clearError: () => setError(null),
    generateItinerary,
    retryLastGenerate,
    saveCurrentTrip,
    deleteSavedTrip,
    loadSavedTrip,
    applySpotSwap,
  };
}

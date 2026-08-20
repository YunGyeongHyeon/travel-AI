import { useCallback, useEffect, useRef, useState } from "react";
import { PlaceSpot, TravelRequest, TripPlan } from "../types";

const STORAGE_KEY = "ai_travel_saved_trips";

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

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

export function useTripPlanner() {
  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(null);
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInputForm, setShowInputForm] = useState(true);
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
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(
            response,
            "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
      }

      const plan = (await response.json()) as TripPlan;
      setCurrentTrip(plan);
      setShowInputForm(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryLastGenerate = useCallback(() => {
    if (lastRequestRef.current) {
      void generateItinerary(lastRequestRef.current);
    }
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
    setShowInputForm(false);
    setError(null);
    setIsSavedOpen(false);
  }, []);

  const applySpotSwap = useCallback((oldSpotId: string, newSpot: PlaceSpot) => {
    setCurrentTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day) => ({
          ...day,
          spots: day.spots.map((spot) => (spot.id === oldSpotId ? newSpot : spot)),
        })),
      };
    });
  }, []);

  const isCurrentTripSaved = currentTrip
    ? savedTrips.some((trip) => trip.id === currentTrip.id)
    : false;

  return {
    currentTrip,
    savedTrips,
    isLoading,
    showInputForm,
    error,
    isSavedOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    isCurrentTripSaved,
    setShowInputForm,
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

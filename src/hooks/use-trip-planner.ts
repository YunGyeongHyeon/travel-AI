import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PlaceSpot,
  TravelRequest,
  TripLogSummary,
  TripPlan,
} from "@/types";
import { generateItinerary as requestItinerary } from "@/lib/api";
import {
  deleteTripLog,
  fetchTripLog,
  fetchTripLogs,
  migrateLegacyTrips,
  setTripLogFavorite,
  updateTripLogPlan,
} from "@/lib/trip-logs";
import { fetchCreditBalance } from "@/lib/credits";
import { getErrorMessage } from "@/lib/errors";

const CURRENT_TRIP_KEY = "ai_travel_current_trip";

type PersistedCurrent = {
  logId: string | null;
  plan: TripPlan;
};

function loadCurrentTrip(): PersistedCurrent | null {
  try {
    const stored = sessionStorage.getItem(CURRENT_TRIP_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<PersistedCurrent>;
    return parsed?.plan
      ? { logId: parsed.logId ?? null, plan: parsed.plan }
      : null;
  } catch {
    return null;
  }
}

function persistCurrentTrip(current: PersistedCurrent | null) {
  try {
    if (current) {
      sessionStorage.setItem(CURRENT_TRIP_KEY, JSON.stringify(current));
    } else {
      sessionStorage.removeItem(CURRENT_TRIP_KEY);
    }
  } catch (error) {
    console.error("Failed to persist current trip", error);
  }
}

/**
 * @param userId 로그인한 사용자 id. null이면 비로그인 상태로 보고 모든 로그를 비운다.
 */
export function useTripPlanner(userId: string | null) {
  const restored = useRef<PersistedCurrent | null>(loadCurrentTrip());

  const [currentTrip, setCurrentTrip] = useState<TripPlan | null>(
    () => restored.current?.plan ?? null,
  );
  const [currentLogId, setCurrentLogId] = useState<string | null>(
    () => restored.current?.logId ?? null,
  );
  const [logs, setLogs] = useState<TripLogSummary[]>([]);
  // null = 크레딧 미도입(supabase/credits.sql 미실행) 또는 조회 실패.
  // 이때는 화면에 크레딧을 아예 표시하지 않는다.
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // 로그인 상태로 들어왔다면 곧바로 로그를 불러올 참이다.
  // false로 시작하면 목록이 잠깐 "로그 없음"으로 깜빡인다.
  const [isLogsLoading, setIsLogsLoading] = useState(() => Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  // 생성 실패일 때만 다시 시도 버튼을 띄운다.
  // 저장/삭제 실패에까지 재생성을 걸면 AI 비용이 또 나간다.
  const [canRetryGenerate, setCanRetryGenerate] = useState(false);

  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [swapTargetSpot, setSwapTargetSpot] = useState<PlaceSpot | null>(null);

  const lastRequestRef = useRef<TravelRequest | null>(null);

  const fail = useCallback((err: unknown, fallback: string) => {
    setError(getErrorMessage(err, fallback));
    setCanRetryGenerate(false);
  }, []);

  const refreshLogs = useCallback(async () => {
    setIsLogsLoading(true);
    try {
      setLogs(await fetchTripLogs());
    } catch (err) {
      fail(err, "여행 로그를 불러오지 못했습니다.");
    } finally {
      setIsLogsLoading(false);
    }
  }, [fail]);

  const refreshCredits = useCallback(async () => {
    setCredits(await fetchCreditBalance());
  }, []);

  useEffect(() => {
    if (!userId) {
      setLogs([]);
      setCredits(null);
      setCurrentTrip(null);
      setCurrentLogId(null);
      persistCurrentTrip(null);
      return;
    }

    let active = true;
    void (async () => {
      await migrateLegacyTrips(userId);
      if (!active) return;
      await refreshLogs();
      if (!active) return;
      await refreshCredits();
    })();

    return () => {
      active = false;
    };
  }, [userId, refreshLogs, refreshCredits]);

  /**
   * 일정 생성. 서버가 Claude를 호출하고 그 자리에서 로그로 남긴 뒤 돌려준다.
   * 사용자가 따로 저장을 누를 필요가 없다 — 호출한 순간 이미 비용이 나갔기 때문에.
   */
  const generateItinerary = useCallback(async (request: TravelRequest) => {
    lastRequestRef.current = request;
    setIsLoading(true);
    setError(null);
    setCanRetryGenerate(false);

    try {
      const { plan, log, isDemo, creditsRemaining } =
        await requestItinerary(request);

      if (creditsRemaining !== undefined && creditsRemaining !== null) {
        setCredits(creditsRemaining);
      }

      setCurrentTrip(plan);
      setCurrentLogId(log?.id ?? null);
      persistCurrentTrip({ logId: log?.id ?? null, plan });

      if (log) {
        setLogs((prev) => [log, ...prev]);
      } else if (isDemo) {
        // AI 키가 없어서 나온 견본. 실패가 아니므로 사실만 알린다.
        setError(
          "AI 키가 설정되지 않아 견본 일정을 보여주고 있습니다. 이 일정은 로그에 저장되지 않습니다.",
        );
      } else {
        // 일정 자체는 유효하니 화면에는 띄우고, 기록만 실패했다고 알린다.
        setError(
          "일정은 생성했지만 로그 저장에 실패했습니다. 이 일정은 목록에서 다시 찾을 수 없습니다.",
        );
      }
      return plan;
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
      setCanRetryGenerate(true);

      // 실패 시 서버가 크레딧을 환불했을 수도, 잔액 부족으로 아예 안 깎았을 수도
      // 있다. 어느 쪽인지 추측하지 말고 실제 잔액을 다시 읽는다.
      void refreshCredits();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [refreshCredits]);

  const retryLastGenerate = useCallback(async () => {
    if (!lastRequestRef.current) {
      return null;
    }
    return generateItinerary(lastRequestRef.current);
  }, [generateItinerary]);

  /** 즐겨찾기(스크랩) 토글. 실패하면 화면을 원래대로 되돌린다. */
  const toggleFavorite = useCallback(
    async (logId: string) => {
      const target = logs.find((log) => log.id === logId);
      if (!target) return;

      const next = !target.isFavorite;
      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, isFavorite: next } : log,
        ),
      );

      try {
        await setTripLogFavorite(logId, next);
      } catch (err) {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === logId ? { ...log, isFavorite: !next } : log,
          ),
        );
        fail(err, "즐겨찾기를 변경하지 못했습니다.");
      }
    },
    [logs, fail],
  );

  const toggleCurrentTripFavorite = useCallback(() => {
    if (!currentLogId) return;
    void toggleFavorite(currentLogId);
  }, [currentLogId, toggleFavorite]);

  const deleteLog = useCallback(
    async (logId: string) => {
      const snapshot = logs;
      setLogs((prev) => prev.filter((log) => log.id !== logId));

      // 지금 보고 있던 로그를 지웠다면 화면에서도 내린다.
      if (logId === currentLogId) {
        setCurrentTrip(null);
        setCurrentLogId(null);
        persistCurrentTrip(null);
      }

      try {
        await deleteTripLog(logId);
      } catch (err) {
        setLogs(snapshot);
        fail(err, "여행 로그를 삭제하지 못했습니다.");
      }
    },
    [logs, currentLogId, fail],
  );

  /** 목록에서 로그를 열면 그때 일정 본문을 가져온다. */
  const openLog = useCallback(
    async (logId: string) => {
      try {
        const log = await fetchTripLog(logId);
        setCurrentTrip(log.plan);
        setCurrentLogId(log.id);
        persistCurrentTrip({ logId: log.id, plan: log.plan });
        setError(null);
        setCanRetryGenerate(false);
        setIsLogsOpen(false);
        return log.plan;
      } catch (err) {
        fail(err, "여행 일정을 불러오지 못했습니다.");
        return null;
      }
    },
    [fail],
  );

  const applySpotSwap = useCallback(
    (oldSpotId: string, newSpot: PlaceSpot) => {
      if (!currentTrip) return;

      // 저장은 setState 업데이터 밖에서 한다.
      // StrictMode는 업데이터를 두 번 호출하므로 안에 두면 DB에 두 번 쓴다.
      const next = {
        ...currentTrip,
        days: currentTrip.days.map((day) => ({
          ...day,
          spots: day.spots.map((spot) =>
            spot.id === oldSpotId ? newSpot : spot,
          ),
        })),
      };

      setCurrentTrip(next);
      persistCurrentTrip({ logId: currentLogId, plan: next });

      // 바뀐 일정을 로그에도 반영해 둔다. 실패해도 화면은 그대로 둔다.
      if (currentLogId) {
        void updateTripLogPlan(currentLogId, next).catch((err: unknown) => {
          fail(err, "변경한 일정을 저장하지 못했습니다.");
        });
      }
    },
    [currentTrip, currentLogId, fail],
  );

  const isCurrentTripFavorite = currentLogId
    ? (logs.find((log) => log.id === currentLogId)?.isFavorite ?? false)
    : false;

  const favoriteCount = logs.filter((log) => log.isFavorite).length;

  return {
    currentTrip,
    currentLogId,
    logs,
    credits,
    favoriteCount,
    isLoading,
    isLogsLoading,
    error,
    canRetryGenerate,
    isLogsOpen,
    isExportOpen,
    isChatOpen,
    swapTargetSpot,
    isCurrentTripFavorite,
    setIsLogsOpen,
    setIsExportOpen,
    setIsChatOpen,
    setSwapTargetSpot,
    clearError: () => setError(null),
    generateItinerary,
    retryLastGenerate,
    refreshLogs,
    refreshCredits,
    toggleFavorite,
    toggleCurrentTripFavorite,
    deleteLog,
    openLog,
    applySpotSwap,
  };
}

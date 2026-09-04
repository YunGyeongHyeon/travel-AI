import { act, renderHook, waitFor } from "@testing-library/react";
import { useTripPlanner } from "./use-trip-planner";
import {
  createMockLog,
  createMockSpot,
  createMockTrip,
  mockRequest,
} from "../test/fixtures";

const api = vi.hoisted(() => ({
  generateItinerary: vi.fn(),
}));

const store = vi.hoisted(() => ({
  fetchTripLogs: vi.fn(),
  fetchTripLog: vi.fn(),
  setTripLogFavorite: vi.fn(),
  deleteTripLog: vi.fn(),
  updateTripLogPlan: vi.fn(),
  migrateLegacyTrips: vi.fn(),
}));

const credits = vi.hoisted(() => ({
  fetchCreditBalance: vi.fn(),
}));

vi.mock("@/lib/api", () => api);
vi.mock("@/lib/trip-logs", () => store);
vi.mock("@/lib/credits", () => credits);

const USER_ID = "user-1";
const CURRENT_TRIP_KEY = "ai_travel_current_trip";

/** 로그 목록 로딩이 끝난 훅을 만든다. */
async function renderLoggedIn(userId: string | null = USER_ID) {
  const rendered = renderHook(({ id }) => useTripPlanner(id), {
    initialProps: { id: userId },
  });
  await waitFor(() => {
    expect(rendered.result.current.isLogsLoading).toBe(false);
  });
  return rendered;
}

beforeEach(() => {
  vi.clearAllMocks();
  credits.fetchCreditBalance.mockResolvedValue(3);
  store.fetchTripLogs.mockResolvedValue([]);
  store.migrateLegacyTrips.mockResolvedValue(0);
  store.setTripLogFavorite.mockResolvedValue(undefined);
  store.deleteTripLog.mockResolvedValue(undefined);
  store.updateTripLogPlan.mockResolvedValue(undefined);
});

describe("useTripPlanner", () => {
  it("처음에는 일정도 로그도 없다", async () => {
    const { result } = await renderLoggedIn();

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.currentLogId).toBeNull();
    expect(result.current.logs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("로그인하면 기존 localStorage 일정을 옮기고 로그를 불러온다", async () => {
    const logs = [createMockLog({ id: "log-1" })];
    store.fetchTripLogs.mockResolvedValue(logs);

    const { result } = await renderLoggedIn();

    expect(store.migrateLegacyTrips).toHaveBeenCalledWith(USER_ID);
    expect(result.current.logs).toEqual(logs);
  });

  it("비로그인 상태에서는 로그를 조회하지 않는다", async () => {
    await renderLoggedIn(null);

    expect(store.fetchTripLogs).not.toHaveBeenCalled();
    expect(store.migrateLegacyTrips).not.toHaveBeenCalled();
  });

  it("일정을 생성하면 로그 목록 맨 앞에 붙고 세션에 남는다", async () => {
    const plan = createMockTrip();
    const log = createMockLog({ id: "log-new" });
    api.generateItinerary.mockResolvedValue({ plan, log });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(api.generateItinerary).toHaveBeenCalledWith(mockRequest);
    expect(result.current.currentTrip).toEqual(plan);
    expect(result.current.currentLogId).toBe("log-new");
    expect(result.current.logs[0].id).toBe("log-new");
    expect(result.current.error).toBeNull();

    const persisted = JSON.parse(
      sessionStorage.getItem(CURRENT_TRIP_KEY) ?? "{}",
    );
    expect(persisted.logId).toBe("log-new");
    expect(persisted.plan.tripTitle).toBe(plan.tripTitle);
  });

  it("로그 저장이 실패해도 일정은 보여주고 경고만 남긴다", async () => {
    const plan = createMockTrip();
    api.generateItinerary.mockResolvedValue({ plan, log: null });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.currentTrip).toEqual(plan);
    expect(result.current.currentLogId).toBeNull();
    expect(result.current.error).toContain("로그 저장에 실패");
    // 재생성은 돈이 또 나가므로 저장 실패에는 다시 시도를 붙이지 않는다.
    expect(result.current.canRetryGenerate).toBe(false);
  });

  it("로그인하면 크레딧 잔액을 불러온다", async () => {
    credits.fetchCreditBalance.mockResolvedValue(7);

    const { result } = await renderLoggedIn();

    await waitFor(() => {
      expect(result.current.credits).toBe(7);
    });
  });

  it("생성에 성공하면 응답에 담긴 남은 크레딧으로 갱신한다", async () => {
    api.generateItinerary.mockResolvedValue({
      plan: createMockTrip(),
      log: createMockLog(),
      creditsRemaining: 2,
    });

    const { result } = await renderLoggedIn();
    await waitFor(() => expect(result.current.credits).toBe(3));

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.credits).toBe(2);
    // 응답에 값이 있으므로 굳이 다시 조회하지 않는다 (최초 1회만)
    expect(credits.fetchCreditBalance).toHaveBeenCalledTimes(1);
  });

  it("크레딧을 도입하지 않았으면(null) 잔액을 건드리지 않는다", async () => {
    credits.fetchCreditBalance.mockResolvedValue(null);
    api.generateItinerary.mockResolvedValue({
      plan: createMockTrip(),
      log: createMockLog(),
      creditsRemaining: null,
    });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.credits).toBeNull();
  });

  it("생성에 실패하면 잔액을 추측하지 않고 다시 조회한다", async () => {
    api.generateItinerary.mockRejectedValue(
      new Error("크레딧이 모두 소진되었습니다."),
    );
    credits.fetchCreditBalance
      .mockResolvedValueOnce(1) // 최초 로드
      .mockResolvedValueOnce(0); // 실패 후 재조회

    const { result } = await renderLoggedIn();
    await waitFor(() => expect(result.current.credits).toBe(1));

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    await waitFor(() => {
      expect(result.current.credits).toBe(0);
    });
    expect(credits.fetchCreditBalance).toHaveBeenCalledTimes(2);
  });

  it("데모 모드는 견본이라고 알리되 저장 실패로 취급하지 않는다", async () => {
    const plan = createMockTrip();
    api.generateItinerary.mockResolvedValue({ plan, log: null, isDemo: true });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.currentTrip).toEqual(plan);
    expect(result.current.error).toContain("견본 일정");
    expect(result.current.error).not.toContain("저장에 실패");
    // 견본은 로그가 아니므로 목록에 끼어들면 안 된다.
    expect(result.current.logs).toEqual([]);
    expect(result.current.currentLogId).toBeNull();
    expect(result.current.canRetryGenerate).toBe(false);
  });

  it("생성에 실패하면 다시 시도할 수 있게 표시한다", async () => {
    api.generateItinerary.mockRejectedValue(new Error("Failed to fetch"));

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.error).toBe("Failed to fetch");
    expect(result.current.canRetryGenerate).toBe(true);
  });

  it("다시 시도하면 마지막 요청으로 재생성한다", async () => {
    const plan = createMockTrip();
    api.generateItinerary
      .mockRejectedValueOnce(new Error("잠시 후 다시 시도해 주세요."))
      .mockResolvedValueOnce({ plan, log: createMockLog() });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });
    expect(result.current.error).toBe("잠시 후 다시 시도해 주세요.");

    await act(async () => {
      await result.current.retryLastGenerate();
    });

    expect(result.current.currentTrip).toEqual(plan);
    expect(api.generateItinerary).toHaveBeenCalledTimes(2);
    expect(api.generateItinerary).toHaveBeenLastCalledWith(mockRequest);
  });

  it("즐겨찾기를 토글하면 서버에도 반영한다", async () => {
    store.fetchTripLogs.mockResolvedValue([createMockLog({ id: "log-1" })]);

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.toggleFavorite("log-1");
    });

    expect(store.setTripLogFavorite).toHaveBeenCalledWith("log-1", true);
    expect(result.current.logs[0].isFavorite).toBe(true);
    expect(result.current.favoriteCount).toBe(1);
  });

  it("즐겨찾기 저장에 실패하면 화면을 되돌린다", async () => {
    store.fetchTripLogs.mockResolvedValue([createMockLog({ id: "log-1" })]);
    store.setTripLogFavorite.mockRejectedValue(new Error("네트워크 오류"));

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.toggleFavorite("log-1");
    });

    expect(result.current.logs[0].isFavorite).toBe(false);
    expect(result.current.error).toBe("네트워크 오류");
    expect(result.current.canRetryGenerate).toBe(false);
  });

  it("현재 보고 있는 일정의 즐겨찾기를 토글한다", async () => {
    const plan = createMockTrip();
    const log = createMockLog({ id: "log-cur" });
    api.generateItinerary.mockResolvedValue({ plan, log });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });
    expect(result.current.isCurrentTripFavorite).toBe(false);

    await act(async () => {
      result.current.toggleCurrentTripFavorite();
    });

    await waitFor(() => {
      expect(result.current.isCurrentTripFavorite).toBe(true);
    });
    expect(store.setTripLogFavorite).toHaveBeenCalledWith("log-cur", true);
  });

  it("로그를 삭제하면 목록에서 사라진다", async () => {
    store.fetchTripLogs.mockResolvedValue([
      createMockLog({ id: "log-1" }),
      createMockLog({ id: "log-2" }),
    ]);

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.deleteLog("log-1");
    });

    expect(store.deleteTripLog).toHaveBeenCalledWith("log-1");
    expect(result.current.logs.map((log) => log.id)).toEqual(["log-2"]);
  });

  it("보고 있던 로그를 삭제하면 화면에서도 내린다", async () => {
    const plan = createMockTrip();
    api.generateItinerary.mockResolvedValue({
      plan,
      log: createMockLog({ id: "log-open" }),
    });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    await act(async () => {
      await result.current.deleteLog("log-open");
    });

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.currentLogId).toBeNull();
    expect(sessionStorage.getItem(CURRENT_TRIP_KEY)).toBeNull();
  });

  it("삭제에 실패하면 목록을 복구한다", async () => {
    store.fetchTripLogs.mockResolvedValue([createMockLog({ id: "log-1" })]);
    store.deleteTripLog.mockRejectedValue(new Error("삭제 권한이 없습니다."));

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.deleteLog("log-1");
    });

    expect(result.current.logs.map((log) => log.id)).toEqual(["log-1"]);
    expect(result.current.error).toBe("삭제 권한이 없습니다.");
  });

  it("로그를 열면 일정 본문을 받아와 현재 일정으로 세운다", async () => {
    const plan = createMockTrip({ tripTitle: "예전에 만든 일정" });
    store.fetchTripLog.mockResolvedValue({
      ...createMockLog({ id: "log-old" }),
      plan,
    });

    const { result } = await renderLoggedIn();
    act(() => {
      result.current.setIsLogsOpen(true);
    });

    await act(async () => {
      await result.current.openLog("log-old");
    });

    expect(result.current.currentTrip?.tripTitle).toBe("예전에 만든 일정");
    expect(result.current.currentLogId).toBe("log-old");
    expect(result.current.isLogsOpen).toBe(false);
  });

  it("로그를 여는 데 실패하면 에러만 남기고 현재 일정은 건드리지 않는다", async () => {
    store.fetchTripLog.mockRejectedValue(new Error("찾을 수 없습니다."));

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.openLog("없는-로그");
    });

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.error).toBe("찾을 수 없습니다.");
  });

  it("장소를 교체하면 로그에도 반영한다", async () => {
    const original = createMockSpot({ id: "d1-s1", name: "원래 장소" });
    const replacement = createMockSpot({ id: "alt-1", name: "대체 장소" });
    const plan = createMockTrip({
      days: [
        {
          dayNumber: 1,
          themeTitle: "첫째 날",
          summary: "요약",
          areaFocus: "난바",
          spots: [original],
          dayEstimatedCost: 10_000,
          transitSummary: "도보",
        },
      ],
    });
    api.generateItinerary.mockResolvedValue({
      plan,
      log: createMockLog({ id: "log-swap" }),
    });

    const { result } = await renderLoggedIn();

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    await act(async () => {
      result.current.applySpotSwap("d1-s1", replacement);
    });

    expect(result.current.currentTrip?.days[0].spots[0].name).toBe("대체 장소");
    await waitFor(() => {
      expect(store.updateTripLogPlan).toHaveBeenCalledWith(
        "log-swap",
        expect.objectContaining({ id: plan.id }),
      );
    });
  });

  it("로그아웃하면 현재 일정과 로그를 모두 비운다", async () => {
    const plan = createMockTrip();
    api.generateItinerary.mockResolvedValue({
      plan,
      log: createMockLog({ id: "log-1" }),
    });

    const { result, rerender } = renderHook(({ id }) => useTripPlanner(id), {
      initialProps: { id: USER_ID as string | null },
    });

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });
    expect(result.current.currentTrip).not.toBeNull();

    await act(async () => {
      rerender({ id: null });
    });

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.logs).toEqual([]);
    expect(result.current.credits).toBeNull();
    expect(sessionStorage.getItem(CURRENT_TRIP_KEY)).toBeNull();
  });

  it("세션에 남은 일정을 새로고침 후에도 복원한다", async () => {
    const plan = createMockTrip({ tripTitle: "복원된 일정" });
    sessionStorage.setItem(
      CURRENT_TRIP_KEY,
      JSON.stringify({ logId: "log-restored", plan }),
    );

    const { result } = await renderLoggedIn();

    expect(result.current.currentTrip?.tripTitle).toBe("복원된 일정");
    expect(result.current.currentLogId).toBe("log-restored");
  });

  it("세션 값이 깨져 있어도 빈 상태로 시작한다", async () => {
    sessionStorage.setItem(CURRENT_TRIP_KEY, "{not-json");

    const { result } = await renderLoggedIn();

    expect(result.current.currentTrip).toBeNull();
  });
});

import { act, renderHook, waitFor } from "@testing-library/react";
import { useTripPlanner } from "./use-trip-planner";
import { createMockSpot, createMockTrip, mockRequest } from "../test/fixtures";

const STORAGE_KEY = "ai_travel_saved_trips";

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

function mockFetchError(statusBody: unknown, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => statusBody,
  });
}

describe("useTripPlanner", () => {
  it("처음에는 입력 폼을 보여주고 일정이 없다", () => {
    const { result } = renderHook(() => useTripPlanner());

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.savedTrips).toEqual([]);
  });

  it("localStorage에 저장된 일정을 마운트 시 불러온다", () => {
    const saved = createMockTrip({ id: "saved-1" });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([saved]));

    const { result } = renderHook(() => useTripPlanner());

    expect(result.current.savedTrips).toHaveLength(1);
    expect(result.current.savedTrips[0].id).toBe("saved-1");
  });

  it("잘못된 localStorage 값이 있어도 빈 목록으로 시작한다", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    const { result } = renderHook(() => useTripPlanner());

    expect(result.current.savedTrips).toEqual([]);
  });

  it("일정 생성에 성공하면 현재 일정을 넣고 sessionStorage에 저장한다", async () => {
    const plan = createMockTrip();
    vi.stubGlobal("fetch", mockFetchOk(plan));

    const { result } = renderHook(() => useTripPlanner());

    let returned: Awaited<ReturnType<typeof result.current.generateItinerary>> =
      null;

    await act(async () => {
      returned = await result.current.generateItinerary(mockRequest);
    });

    expect(returned).toEqual(plan);
    expect(result.current.currentTrip).toEqual(plan);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(sessionStorage.getItem("ai_travel_current_trip")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/generate-itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockRequest),
    });
  });

  it("서버가 에러를 주면 error 상태에 메시지를 담는다", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchError({ error: "여행 목적지(destination)를 입력해주세요." }),
    );

    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.currentTrip).toBeNull();
    expect(result.current.error).toBe(
      "여행 목적지(destination)를 입력해주세요.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("네트워크 실패 시 에러 메시지를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));

    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    expect(result.current.error).toBe("Failed to fetch");
  });

  it("다시 시도하면 마지막 요청으로 생성을 재호출한다", async () => {
    const plan = createMockTrip();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "잠시 후 다시 시도해 주세요." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => plan,
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });
    expect(result.current.error).toBe("잠시 후 다시 시도해 주세요.");

    await act(async () => {
      result.current.retryLastGenerate();
    });

    await waitFor(() => {
      expect(result.current.currentTrip).toEqual(plan);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("현재 일정을 저장하면 localStorage에도 남긴다", async () => {
    const plan = createMockTrip({ id: "trip-save" });
    vi.stubGlobal("fetch", mockFetchOk(plan));
    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    act(() => {
      result.current.saveCurrentTrip();
    });

    expect(result.current.isCurrentTripSaved).toBe(true);
    expect(result.current.savedTrips[0].id).toBe("trip-save");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(
      1,
    );
  });

  it("이미 저장된 일정을 다시 저장하면 목록에서 뺀다", async () => {
    const plan = createMockTrip({ id: "trip-toggle" });
    vi.stubGlobal("fetch", mockFetchOk(plan));
    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });
    act(() => {
      result.current.saveCurrentTrip();
    });
    act(() => {
      result.current.saveCurrentTrip();
    });

    expect(result.current.isCurrentTripSaved).toBe(false);
    expect(result.current.savedTrips).toEqual([]);
  });

  it("저장된 일정을 불러오면 현재 일정으로 연다", () => {
    const saved = createMockTrip({ id: "loaded" });
    const { result } = renderHook(() => useTripPlanner());

    act(() => {
      result.current.loadSavedTrip(saved);
    });

    expect(result.current.currentTrip?.id).toBe("loaded");
    expect(result.current.isSavedOpen).toBe(false);
  });

  it("저장된 일정을 삭제한다", () => {
    const saved = createMockTrip({ id: "to-delete" });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([saved]));
    const { result } = renderHook(() => useTripPlanner());

    act(() => {
      result.current.deleteSavedTrip("to-delete");
    });

    expect(result.current.savedTrips).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("스팟을 다른 장소로 교체한다", async () => {
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
    vi.stubGlobal("fetch", mockFetchOk(plan));
    const { result } = renderHook(() => useTripPlanner());

    await act(async () => {
      await result.current.generateItinerary(mockRequest);
    });

    act(() => {
      result.current.applySpotSwap("d1-s1", replacement);
    });

    expect(result.current.currentTrip?.days[0].spots[0].name).toBe("대체 장소");
  });
});

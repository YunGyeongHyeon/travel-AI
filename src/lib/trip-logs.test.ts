import {
  deleteTripLog,
  fetchTripLog,
  fetchTripLogs,
  migrateLegacyTrips,
  setTripLogFavorite,
} from "@/lib/trip-logs";
import { createMockTrip } from "@/test/fixtures";

const client = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => client,
}));

const LEGACY_KEY = "ai_travel_saved_trips";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    created_at: "2026-01-01T00:00:00.000Z",
    is_favorite: true,
    trip_title: "오사카 미식 탐방",
    destination_name: "오사카",
    duration_summary: "2박 3일",
    target_budget: "1000000",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("trip-logs", () => {
  it("목록은 snake_case 컬럼을 camelCase로 바꿔 돌려준다", async () => {
    const order = vi.fn().mockResolvedValue({ data: [row()], error: null });
    const select = vi.fn().mockReturnValue({ order });
    client.from.mockReturnValue({ select });

    const logs = await fetchTripLogs();

    expect(logs).toEqual([
      {
        id: "log-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        isFavorite: true,
        tripTitle: "오사카 미식 탐방",
        destinationName: "오사카",
        durationSummary: "2박 3일",
        targetBudget: 1_000_000,
      },
    ]);
    expect(client.from).toHaveBeenCalledWith("trip_logs");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("목록에서는 일정 본문(plan)을 내려받지 않는다", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockReturnValue({ order });
    client.from.mockReturnValue({ select });

    await fetchTripLogs();

    expect(select.mock.calls[0][0]).not.toContain("plan");
  });

  it("목록 조회에 실패하면 에러를 던진다", async () => {
    const order = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "권한이 없습니다." } });
    const select = vi.fn().mockReturnValue({ order });
    client.from.mockReturnValue({ select });

    await expect(fetchTripLogs()).rejects.toThrow("권한이 없습니다.");
  });

  it("로그 하나를 열 때는 일정 본문까지 가져온다", async () => {
    const plan = createMockTrip({ tripTitle: "저장된 일정" });
    const single = vi
      .fn()
      .mockResolvedValue({ data: { ...row(), plan }, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    client.from.mockReturnValue({ select });

    const log = await fetchTripLog("log-1");

    expect(log.plan.tripTitle).toBe("저장된 일정");
    expect(select.mock.calls[0][0]).toContain("plan");
    expect(eq).toHaveBeenCalledWith("id", "log-1");
  });

  it("즐겨찾기는 is_favorite 컬럼만 갱신한다", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    client.from.mockReturnValue({ update });

    await setTripLogFavorite("log-1", true);

    expect(update).toHaveBeenCalledWith({ is_favorite: true });
    expect(eq).toHaveBeenCalledWith("id", "log-1");
  });

  it("삭제에 실패하면 에러를 던진다", async () => {
    const eq = vi
      .fn()
      .mockResolvedValue({ error: { message: "삭제할 수 없습니다." } });
    const del = vi.fn().mockReturnValue({ eq });
    client.from.mockReturnValue({ delete: del });

    await expect(deleteTripLog("log-1")).rejects.toThrow("삭제할 수 없습니다.");
  });
});

describe("migrateLegacyTrips", () => {
  it("localStorage에 있던 일정을 즐겨찾기로 옮기고 키를 지운다", async () => {
    const plan = createMockTrip({ tripTitle: "예전 일정" });
    localStorage.setItem(LEGACY_KEY, JSON.stringify([plan]));
    const insert = vi.fn().mockResolvedValue({ error: null });
    client.from.mockReturnValue({ insert });

    const moved = await migrateLegacyTrips("user-1");

    expect(moved).toBe(1);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "user-1",
        is_favorite: true,
        trip_title: "예전 일정",
        destination_name: "오사카",
        duration_summary: "2박 3일",
        target_budget: 1_000_000,
      }),
    ]);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it("옮길 게 없으면 아무것도 쓰지 않는다", async () => {
    const insert = vi.fn();
    client.from.mockReturnValue({ insert });

    expect(await migrateLegacyTrips("user-1")).toBe(0);
    expect(insert).not.toHaveBeenCalled();
  });

  it("값이 깨져 있으면 키를 지우고 넘어간다", async () => {
    localStorage.setItem(LEGACY_KEY, "{not-json");
    const insert = vi.fn();
    client.from.mockReturnValue({ insert });

    expect(await migrateLegacyTrips("user-1")).toBe(0);
    expect(insert).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it("이관에 실패하면 다음 로그인에 다시 시도하도록 키를 남긴다", async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify([createMockTrip()]));
    const insert = vi
      .fn()
      .mockResolvedValue({ error: { message: "insert failed" } });
    client.from.mockReturnValue({ insert });
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await migrateLegacyTrips("user-1")).toBe(0);
    expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });
});

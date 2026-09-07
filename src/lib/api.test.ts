import { generateItinerary, regenerateSpot, sendTripChat } from "@/lib/api";
import { createMockLog, createMockSpot, createMockTrip, mockRequest } from "@/test/fixtures";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ auth }),
}));

function signedIn(accessToken = "test-access-token") {
  auth.getSession.mockResolvedValue({
    data: { session: { access_token: accessToken } },
  });
}

function signedOut() {
  auth.getSession.mockResolvedValue({ data: { session: null } });
}

function mockFetchOk(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("api", () => {
  it("일정 생성 요청에 로그인 토큰을 실어 보낸다", async () => {
    signedIn();
    const plan = createMockTrip();
    const log = createMockLog();
    const fetchMock = mockFetchOk({ plan, log });

    const result = await generateItinerary(mockRequest);

    expect(result).toEqual({ plan, log });
    expect(fetchMock).toHaveBeenCalledWith("/api/generate-itinerary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-access-token",
      },
      body: JSON.stringify(mockRequest),
    });
  });

  it("로그인 세션이 없으면 요청 자체를 보내지 않는다", async () => {
    signedOut();
    const fetchMock = mockFetchOk({});

    await expect(generateItinerary(mockRequest)).rejects.toThrow(
      "로그인이 필요합니다. 다시 로그인해 주세요.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("서버가 준 에러 메시지를 그대로 올린다", async () => {
    signedIn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "세션이 만료되었습니다. 다시 로그인해 주세요." }),
      }),
    );

    await expect(generateItinerary(mockRequest)).rejects.toThrow(
      "세션이 만료되었습니다. 다시 로그인해 주세요.",
    );
  });

  it("에러 본문을 읽을 수 없으면 기본 메시지를 쓴다", async () => {
    signedIn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    await expect(generateItinerary(mockRequest)).rejects.toThrow(
      "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });

  it("장소 교체 요청도 토큰을 함께 보낸다", async () => {
    signedIn("spot-token");
    const spot = createMockSpot({ id: "alt-1" });
    const fetchMock = mockFetchOk(spot);

    const result = await regenerateSpot({
      destination: "오사카",
      dayNumber: 1,
      currentSpot: createMockSpot(),
      userPreference: "조용한 곳",
    });

    expect(result).toEqual(spot);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/regenerate-spot");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer spot-token",
    );
  });

  it("채팅 응답이 비어 있으면 안내 문구로 대체한다", async () => {
    signedIn();
    mockFetchOk({ reply: "" });

    const reply = await sendTripChat({
      tripContext: createMockTrip(),
      message: "맛집 추천해줘",
      chatHistory: [],
    });

    expect(reply).toBe("죄송합니다, 잠시 후 다시 질문해주세요.");
  });
});

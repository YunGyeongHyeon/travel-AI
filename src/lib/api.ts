import type {
  ChatMessage,
  GenerateItineraryResult,
  PlaceSpot,
  TravelRequest,
  TripPlan,
} from "@/types";
import { getErrorMessage } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";

async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

/**
 * AI 엔드포인트는 전부 로그인한 사용자만 호출할 수 있다.
 * 서버가 이 토큰을 JWKS로 검증하고, 같은 토큰으로 로그를 기록한다.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("로그인이 필요합니다. 다시 로그인해 주세요.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function postJson<T>(
  url: string,
  body: unknown,
  fallback: string,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }
  return (await response.json()) as T;
}

export async function generateItinerary(
  request: TravelRequest,
): Promise<GenerateItineraryResult> {
  return postJson<GenerateItineraryResult>(
    "/api/generate-itinerary",
    request,
    "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

export async function regenerateSpot(input: {
  destination: string;
  dayNumber: number;
  currentSpot: PlaceSpot;
  userPreference: string;
}): Promise<PlaceSpot> {
  return postJson<PlaceSpot>(
    "/api/regenerate-spot",
    input,
    "대안 장소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

export async function sendTripChat(input: {
  tripContext: TripPlan;
  message: string;
  chatHistory: ChatMessage[];
}): Promise<string> {
  try {
    const data = await postJson<{ reply?: string }>(
      "/api/trip-chat",
      input,
      "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    );
    return data.reply || "죄송합니다, 잠시 후 다시 질문해주세요.";
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  }
}

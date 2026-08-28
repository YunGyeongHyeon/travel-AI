import type { ChatMessage, PlaceSpot, TravelRequest, TripPlan } from "@/types";
import { getErrorMessage } from "@/lib/errors";

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

async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await readApiError(response, fallback));
  }
  return (await response.json()) as T;
}

export async function generateItinerary(
  request: TravelRequest,
): Promise<TripPlan> {
  return requestJson<TripPlan>(
    "/api/generate-itinerary",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

export async function regenerateSpot(input: {
  destination: string;
  dayNumber: number;
  currentSpot: PlaceSpot;
  userPreference: string;
}): Promise<PlaceSpot> {
  return requestJson<PlaceSpot>(
    "/api/regenerate-spot",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "대안 장소를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

export async function sendTripChat(input: {
  tripContext: TripPlan;
  message: string;
  chatHistory: ChatMessage[];
}): Promise<string> {
  try {
    const data = await requestJson<{ reply?: string }>(
      "/api/trip-chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
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

import { getSupabase } from "@/lib/supabase";

export async function getTestData(): Promise<void> {
  const { data: user_info, error } = await getSupabase()
    .from("user_info")
    .select("*");

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  }

  console.log(user_info);
}

export async function registerUser(input: {
  email: string;
  password: string;
}): Promise<void> {
  const { data: authData, error: authError } = await getSupabase().auth.signUp({
    email: input.email,
    password: input.password,
  });
  console.log(authData);
  if (authError) {
    throw new Error(
      getErrorMessage(
        authError,
        "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<void> {
  const { data: authData, error: authError } =
    await getSupabase().auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
  console.log(authData);
  if (authError) {
    throw new Error(
      getErrorMessage(
        authError,
        "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
      ),
    );
  }
}

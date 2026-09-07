import type { ChatMessage, PlaceSpot, TripPlan } from "../types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonUnknown(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned) as unknown;
  }
}

export type TripPlanDraft = Omit<TripPlan, "id" | "createdAt" | "request">;

export function isTripPlanDraft(value: unknown): value is TripPlanDraft {
  if (!isRecord(value)) return false;
  return (
    typeof value.tripTitle === "string" &&
    typeof value.destinationName === "string" &&
    Array.isArray(value.days)
  );
}

export function isPlaceSpot(value: unknown): value is PlaceSpot {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.lat === "number" &&
    typeof value.lng === "number"
  );
}

export function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;
  return (
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

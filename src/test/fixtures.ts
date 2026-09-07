import type {
  PlaceSpot,
  TravelRequest,
  TripLogSummary,
  TripPlan,
} from "@/types";

export const mockRequest: TravelRequest = {
  destination: "일본 오사카",
  durationDays: 3,
  durationNights: 2,
  budget: 1_000_000,
  currency: "KRW",
  themes: ["food", "hotplace"],
  companions: "friends",
  pace: "moderate",
  transportPreference: "public",
};

export function createMockSpot(overrides: Partial<PlaceSpot> = {}): PlaceSpot {
  return {
    id: "d1-s1",
    timeSlot: "09:00 - 10:00",
    timePeriod: "morning",
    name: "테스트 장소",
    category: "attraction",
    categoryName: "관광",
    address: "Osaka",
    lat: 34.69,
    lng: 135.5,
    description: "설명",
    highlights: ["하이라이트"],
    estimatedCost: 10_000,
    estimatedDuration: "1시간",
    tips: "팁",
    ...overrides,
  };
}

export function createMockTrip(overrides: Partial<TripPlan> = {}): TripPlan {
  return {
    id: "trip-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    request: mockRequest,
    tripTitle: "테스트 여행",
    tagline: "태그라인",
    destinationName: "오사카",
    country: "일본",
    centerCoordinates: { lat: 34.69, lng: 135.5, zoom: 13 },
    durationSummary: "2박 3일",
    highlights: ["하이라이트"],
    days: [
      {
        dayNumber: 1,
        themeTitle: "첫째 날",
        summary: "요약",
        areaFocus: "난바",
        spots: [createMockSpot()],
        dayEstimatedCost: 10_000,
        transitSummary: "도보",
      },
    ],
    budgetAnalysis: {
      targetBudget: 1_000_000,
      totalEstimatedCost: 10_000,
      remainingBudget: 990_000,
      perPersonDailyCost: 3333,
      categories: {
        food: {
          category: "food",
          label: "식비",
          allocatedAmount: 1,
          estimatedAmount: 1,
          percentage: 1,
          details: [],
        },
        attraction: {
          category: "attraction",
          label: "관광",
          allocatedAmount: 1,
          estimatedAmount: 1,
          percentage: 1,
          details: [],
        },
        transport: {
          category: "transport",
          label: "교통",
          allocatedAmount: 1,
          estimatedAmount: 1,
          percentage: 1,
          details: [],
        },
        lodging: {
          category: "lodging",
          label: "숙박",
          allocatedAmount: 1,
          estimatedAmount: 1,
          percentage: 1,
          details: [],
        },
        shoppingEtc: {
          category: "shoppingEtc",
          label: "쇼핑",
          allocatedAmount: 1,
          estimatedAmount: 1,
          percentage: 1,
          details: [],
        },
      },
      savingTips: [],
    },
    foodSpotlights: [],
    routeOptimizationExplanation: "",
    localTravelTips: {
      recommendedPasses: [],
      packingEssentials: [],
      localEtiquette: [],
      weatherAdvice: "",
    },
    ...overrides,
  };
}

export function createMockLog(
  overrides: Partial<TripLogSummary> = {},
): TripLogSummary {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-01-01T00:00:00.000Z",
    isFavorite: false,
    tripTitle: "테스트 여행",
    destinationName: "오사카",
    durationSummary: "2박 3일",
    targetBudget: 1_000_000,
    ...overrides,
  };
}

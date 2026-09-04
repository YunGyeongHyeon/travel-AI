/**
 * 구조화 출력(output_config.format)용 JSON Schema.
 *
 * Gemini의 `responseMimeType: "application/json"`은 "JSON처럼 생긴 무언가"만 보장했다.
 * Claude의 구조화 출력은 이 스키마에 맞는 JSON임을 보장하므로,
 * "AI가 이상한 모양을 뱉어서 파싱 실패" 경로 자체가 사라진다.
 *
 * 스키마 제약 (Anthropic 구조화 출력):
 *   - 모든 object에 additionalProperties: false 필수
 *   - 재귀 스키마, 숫자/문자열 범위 제약(minimum, maxLength 등) 미지원
 *   - enum, anyOf, $ref는 지원
 */

const str = { type: "string" } as const;
const num = { type: "number" } as const;
const strArray = { type: "array", items: { type: "string" } } as const;

/** src/types/index.ts의 TransportSegment */
const transportSegment = {
  type: "object",
  additionalProperties: false,
  properties: {
    mode: {
      type: "string",
      enum: ["walk", "subway", "bus", "taxi", "train", "ferry", "car"],
    },
    description: str,
    durationMinutes: num,
    estimatedCost: num,
    distance: str,
    transferTips: str,
  },
  required: ["mode", "description", "durationMinutes", "estimatedCost"],
} as const;

/** src/types/index.ts의 PlaceSpot */
export const placeSpotSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: str,
    timeSlot: str,
    timePeriod: {
      type: "string",
      enum: ["morning", "lunch", "afternoon", "dinner", "evening", "night"],
    },
    name: str,
    localName: str,
    category: {
      type: "string",
      enum: [
        "restaurant",
        "cafe",
        "attraction",
        "shopping",
        "lodging",
        "transport",
        "activity",
        "night",
      ],
    },
    categoryName: str,
    address: str,
    lat: num,
    lng: num,
    description: str,
    highlights: strArray,
    recommendedMenu: strArray,
    mustTryItems: strArray,
    estimatedCost: num,
    estimatedDuration: str,
    tips: str,
    photoKeyword: str,
    rating: num,
    reviewCount: num,
    openingHours: str,
    // 그날 마지막 장소에는 다음 이동이 없으므로 선택 항목이다.
    nextTransport: transportSegment,
    reservationRequired: { type: "boolean" },
  },
  required: [
    "id",
    "timeSlot",
    "timePeriod",
    "name",
    "category",
    "categoryName",
    "address",
    "lat",
    "lng",
    "description",
    "highlights",
    "estimatedCost",
    "estimatedDuration",
    "tips",
  ],
} as const;

const budgetCategoryItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: str,
    label: str,
    allocatedAmount: num,
    estimatedAmount: num,
    percentage: num,
    details: strArray,
  },
  required: [
    "category",
    "label",
    "allocatedAmount",
    "estimatedAmount",
    "percentage",
    "details",
  ],
} as const;

/** TripPlanDraft = Omit<TripPlan, "id" | "createdAt" | "request"> */
export const tripPlanDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tripTitle: str,
    tagline: str,
    destinationName: str,
    country: str,
    centerCoordinates: {
      type: "object",
      additionalProperties: false,
      properties: { lat: num, lng: num, zoom: num },
      required: ["lat", "lng", "zoom"],
    },
    durationSummary: str,
    highlights: strArray,
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          dayNumber: num,
          date: str,
          themeTitle: str,
          summary: str,
          areaFocus: str,
          spots: { type: "array", items: placeSpotSchema },
          dayEstimatedCost: num,
          transitSummary: str,
        },
        required: [
          "dayNumber",
          "themeTitle",
          "summary",
          "areaFocus",
          "spots",
          "dayEstimatedCost",
          "transitSummary",
        ],
      },
    },
    budgetAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        targetBudget: num,
        totalEstimatedCost: num,
        remainingBudget: num,
        perPersonDailyCost: num,
        categories: {
          type: "object",
          additionalProperties: false,
          properties: {
            food: budgetCategoryItem,
            attraction: budgetCategoryItem,
            transport: budgetCategoryItem,
            lodging: budgetCategoryItem,
            shoppingEtc: budgetCategoryItem,
          },
          required: [
            "food",
            "attraction",
            "transport",
            "lodging",
            "shoppingEtc",
          ],
        },
        savingTips: strArray,
      },
      required: [
        "targetBudget",
        "totalEstimatedCost",
        "remainingBudget",
        "perPersonDailyCost",
        "categories",
        "savingTips",
      ],
    },
    foodSpotlights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: str,
          name: str,
          localName: str,
          dishType: str,
          recommendedPlaces: strArray,
          priceRange: str,
          tasteDescription: str,
          eatingTips: str,
          dayIndexRef: num,
        },
        required: [
          "id",
          "name",
          "dishType",
          "recommendedPlaces",
          "priceRange",
          "tasteDescription",
          "eatingTips",
        ],
      },
    },
    routeOptimizationExplanation: str,
    localTravelTips: {
      type: "object",
      additionalProperties: false,
      properties: {
        recommendedPasses: strArray,
        packingEssentials: strArray,
        localEtiquette: strArray,
        weatherAdvice: str,
      },
      required: [
        "recommendedPasses",
        "packingEssentials",
        "localEtiquette",
        "weatherAdvice",
      ],
    },
  },
  required: [
    "tripTitle",
    "tagline",
    "destinationName",
    "country",
    "centerCoordinates",
    "durationSummary",
    "highlights",
    "days",
    "budgetAnalysis",
    "foodSpotlights",
    "routeOptimizationExplanation",
    "localTravelTips",
  ],
} as const;

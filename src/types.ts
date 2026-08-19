export type TravelTheme =
  | 'food' // 식도락 / 미식
  | 'healing' // 힐링 / 휴양
  | 'hotplace' // 핫플 / 사진 / SNS
  | 'culture' // 역사 / 문화 / 랜드마크
  | 'shopping' // 쇼핑
  | 'activity' // 액티비티 / 체험
  | 'budget' // 가성비 / 알뜰
  | 'nightlife' // 나이트라이프 / 야경
  | 'nature' // 자연 / 풍경
  | 'family'; // 가족 / 아이와 함께

export type CompanionType = 'alone' | 'couple' | 'friends' | 'family' | 'parents' | 'children';

export type PaceType = 'relaxed' | 'moderate' | 'packed';

export type TransportType = 'public' | 'walk' | 'rental' | 'taxi';

export interface TravelRequest {
  destination: string;
  durationDays: number;
  durationNights: number;
  startDate?: string;
  budget: number; // in KRW
  currency: 'KRW' | 'JPY' | 'USD' | 'EUR';
  themes: TravelTheme[];
  companions: CompanionType;
  pace: PaceType;
  transportPreference: TransportType;
  specialRequests?: string;
}

export type SpotCategory =
  | 'restaurant'
  | 'cafe'
  | 'attraction'
  | 'shopping'
  | 'lodging'
  | 'transport'
  | 'activity'
  | 'night';

export interface TransportSegment {
  mode: 'walk' | 'subway' | 'bus' | 'taxi' | 'train' | 'ferry' | 'car';
  description: string;
  durationMinutes: number;
  estimatedCost: number; // in KRW
  distance?: string;
  transferTips?: string;
}

export interface PlaceSpot {
  id: string;
  timeSlot: string; // e.g. "09:30 - 11:00"
  timePeriod: 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'evening' | 'night';
  name: string;
  localName?: string;
  category: SpotCategory;
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  highlights: string[];
  recommendedMenu?: string[];
  mustTryItems?: string[];
  estimatedCost: number; // in KRW
  estimatedDuration: string;
  tips: string;
  photoKeyword?: string;
  rating?: number;
  reviewCount?: number;
  openingHours?: string;
  reservationRequired?: boolean;
  nextTransport?: TransportSegment;
}

export interface DayPlan {
  dayNumber: number;
  date?: string;
  themeTitle: string;
  summary: string;
  areaFocus: string; // e.g. "난바 & 도톤보리 & 신사이바시 일대"
  spots: PlaceSpot[];
  dayEstimatedCost: number;
  transitSummary: string;
}

export interface BudgetCategoryItem {
  category: string;
  label: string;
  allocatedAmount: number;
  estimatedAmount: number;
  percentage: number;
  details: string[];
}

export interface BudgetAnalysis {
  targetBudget: number;
  totalEstimatedCost: number;
  remainingBudget: number;
  perPersonDailyCost: number;
  categories: {
    food: BudgetCategoryItem;
    attraction: BudgetCategoryItem;
    transport: BudgetCategoryItem;
    lodging: BudgetCategoryItem;
    shoppingEtc: BudgetCategoryItem;
  };
  savingTips: string[];
}

export interface FoodSpotlight {
  id: string;
  name: string;
  localName?: string;
  dishType: string;
  recommendedPlaces: string[];
  priceRange: string;
  tasteDescription: string;
  eatingTips: string;
  dayIndexRef?: number;
}

export interface TripPlan {
  id: string;
  createdAt: string;
  request: TravelRequest;
  tripTitle: string;
  tagline: string;
  destinationName: string;
  country: string;
  centerCoordinates: {
    lat: number;
    lng: number;
    zoom: number;
  };
  durationSummary: string; // "2박 3일"
  highlights: string[];
  days: DayPlan[];
  budgetAnalysis: BudgetAnalysis;
  foodSpotlights: FoodSpotlight[];
  routeOptimizationExplanation: string;
  localTravelTips: {
    recommendedPasses: string[];
    packingEssentials: string[];
    localEtiquette: string[];
    weatherAdvice: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

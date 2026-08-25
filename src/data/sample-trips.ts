import { TravelRequest } from "@/types";

export interface PresetOption {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  request: TravelRequest;
}

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: "osaka-food",
    title: "일본 오사카 2박 3일",
    subtitle: "식도락 미식 & 도톤보리 정복",
    badge: "인기 1위 🔥",
    image: "https://images.unsplash.com/photo-1590559899731-a3f376405206?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "일본 오사카",
      durationDays: 3,
      durationNights: 2,
      budget: 1000000,
      currency: "KRW",
      themes: ["food", "hotplace"],
      companions: "friends",
      pace: "moderate",
      transportPreference: "public",
      specialRequests: "라멘, 오코노미야키, 타코야키, 와규 야키니쿠, 우메다 스카이빌딩 야경 필수",
    },
  },
  {
    id: "tokyo-trend",
    title: "일본 도쿄 3박 4일",
    subtitle: "감성 카페 & 쇼핑 & 시부야 야경",
    badge: "MZ 추천 ✨",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "일본 도쿄",
      durationDays: 4,
      durationNights: 3,
      budget: 1400000,
      currency: "KRW",
      themes: ["shopping", "hotplace", "food"],
      companions: "couple",
      pace: "moderate",
      transportPreference: "public",
      specialRequests: "시부야 스카이, 신주쿠, 긴자 미식, 나카메구로 감성 카페 투어",
    },
  },
  {
    id: "jeju-healing",
    title: "제주도 2박 3일",
    subtitle: "오션뷰 힐링 & 흑돼지 & 해안 드라이브",
    badge: "국내 힐링 🌿",
    image: "https://images.unsplash.com/photo-1578637387939-43c525550085?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "제주도",
      durationDays: 3,
      durationNights: 2,
      budget: 700000,
      currency: "KRW",
      themes: ["healing", "food", "nature"],
      companions: "couple",
      pace: "relaxed",
      transportPreference: "rental",
      specialRequests: "애월 한담해변 카페, 협재 바다, 흑돼지 구이, 딱새우회, 성산일출봉",
    },
  },
  {
    id: "bangkok-gourmet",
    title: "태국 방콕 3박 4일",
    subtitle: "미슐랭 스트리트 푸드 & 루프탑 & 마사지",
    badge: "가성비 최고 💰",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "태국 방콕",
      durationDays: 4,
      durationNights: 3,
      budget: 1100000,
      currency: "KRW",
      themes: ["food", "nightlife", "healing"],
      companions: "friends",
      pace: "moderate",
      transportPreference: "public",
      specialRequests: "쩟페어 야시장, 팟타이/똠얌꿍 맛집, 왓아룬 뷰 카페, 고급 스파 마사지",
    },
  },
  {
    id: "fukuoka-onsen",
    title: "일본 후쿠오카 2박 3일",
    subtitle: "하카타 라멘 & 유후인 온천 힐링",
    badge: "단기 힐링 ♨️",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "일본 후쿠오카",
      durationDays: 3,
      durationNights: 2,
      budget: 850000,
      currency: "KRW",
      themes: ["food", "healing"],
      companions: "family",
      pace: "relaxed",
      transportPreference: "public",
      specialRequests: "이치란 본점, 모츠나베, 야타이(포장마차) 거리, 유후인 긴린코 호수",
    },
  },
  {
    id: "paris-romantic",
    title: "프랑스 파리 4박 5일",
    subtitle: "에펠탑 뷰 & 루브르 박물관 & 프렌치 비스트로",
    badge: "낭만 유럽 🥐",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80",
    request: {
      destination: "프랑스 파리",
      durationDays: 5,
      durationNights: 4,
      budget: 2500000,
      currency: "KRW",
      themes: ["culture", "food", "hotplace"],
      companions: "couple",
      pace: "moderate",
      transportPreference: "public",
      specialRequests: "에펠탑 피크닉, 몽마르트르 언덕, 오르세 미술관, 미슐랭 비스트로 코스",
    },
  },
];

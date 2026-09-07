import {
  SpotCategory,
  TravelTheme,
  CompanionType,
  PaceType,
  TransportType,
} from "@/types";

export function formatCurrency(
  amount: number,
  currency: "KRW" | "JPY" | "USD" | "EUR" = "KRW",
): string {
  if (currency === "KRW") {
    if (amount >= 10000) {
      const man = Math.floor(amount / 10000);
      const remainder = amount % 10000;
      if (remainder === 0) return `${man.toLocaleString()}만 원`;
      return `${man.toLocaleString()}만 ${remainder.toLocaleString()}원`;
    }
    return `${amount.toLocaleString()}원`;
  }
  if (currency === "JPY") {
    return `¥${amount.toLocaleString()}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString()}`;
  }
  return `€${amount.toLocaleString()}`;
}

export function getTripThemeLabel(themes?: TravelTheme[]): string {
  if (!themes || themes.length === 0) return "식도락 / 미식";
  return (
    themes
      .map((theme) => THEME_CONFIG[theme]?.label)
      .filter(Boolean)
      .join(" · ") || "식도락 / 미식"
  );
}

export const THEME_CONFIG: Record<
  TravelTheme,
  { label: string; icon: string; description: string; color: string }
> = {
  food: {
    label: "식도락 / 미식",
    icon: "🍜",
    description: "현지 최고 맛집, 길거리 음식, 로컬 미식 탐방",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  hotplace: {
    label: "핫플레이스 / SNS",
    icon: "📸",
    description: "인생샷 포토존, 트렌디한 카페와 팝업",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  healing: {
    label: "힐링 / 휴양",
    icon: "🌿",
    description: "여유로운 온천, 공원 산책, 바다 뷰 쉼",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  culture: {
    label: "역사 / 문화",
    icon: "🏯",
    description: "유적지, 랜드마크 사찰/궁전, 박물관",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  shopping: {
    label: "쇼핑 / 패션",
    icon: "🛍️",
    description: "편집숍, 백화점, 드럭스토어, 아케이드",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  activity: {
    label: "액티비티 / 레저",
    icon: "🏄",
    description: "테마파크, 해양 스포츠, 이색 체험",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  budget: {
    label: "가성비 / 알뜰",
    icon: "💰",
    description: "가성비 맛집, 무료 전망대, 할인 패스 활용",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  nightlife: {
    label: "야경 / 나이트라이프",
    icon: "🍸",
    description: "전망대 야경, 이자카야 골목, 루프탑 바",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  nature: {
    label: "자연 / 풍경",
    icon: "⛰️",
    description: "국립공원, 산, 호수, 해변 드라이브",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  family: {
    label: "가족 / 아이와 함께",
    icon: "👨‍👩‍👧",
    description: "편안한 이동 동선, 키즈 친화 관광지",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export const COMPANION_CONFIG: Record<
  CompanionType,
  { label: string; icon: string }
> = {
  alone: { label: "나 홀로 여행", icon: "🎒" },
  couple: { label: "연인 / 커플", icon: "💑" },
  friends: { label: "친구와 함께", icon: "👭" },
  family: { label: "가족 전체", icon: "👨‍👩‍👧‍👦" },
  parents: { label: "부모님 모시고", icon: "👵" },
  children: { label: "아이 동반", icon: "👶" },
};

export const PACE_CONFIG: Record<
  PaceType,
  { label: string; badge: string; desc: string }
> = {
  relaxed: {
    label: "여유롭게 (힐링)",
    badge: "느긋한 쉼",
    desc: "하루 2~3곳 천천히 머물기",
  },
  moderate: {
    label: "적당히 알차게",
    badge: "황금 밸런스",
    desc: "주요 명소와 맛집 균형",
  },
  packed: {
    label: "꽉 찬 일정 (정복)",
    badge: "부지런한 탐험",
    desc: "하나라도 더 보고 즐기기",
  },
};

export const TRANSPORT_CONFIG: Record<
  TransportType,
  { label: string; desc: string }
> = {
  public: { label: "대중교통 (지하철/버스)", desc: "현지 패스 & 철도 중심" },
  walk: { label: "도보 + 대중교통", desc: "골목 산책과 걷기 중심" },
  rental: { label: "렌터카 / 드라이브", desc: "자유로운 교외 이동" },
  taxi: { label: "택시 & 편안한 이동", desc: "체력 아끼는 쾌적 이동" },
};

export const CATEGORY_COLORS: Record<
  SpotCategory,
  { bg: string; text: string; border: string; markerColor: string }
> = {
  restaurant: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    markerColor: "#ea580c",
  },
  cafe: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    markerColor: "#d97706",
  },
  attraction: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    markerColor: "#2563eb",
  },
  shopping: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    markerColor: "#9333ea",
  },
  lodging: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    markerColor: "#0d9488",
  },
  transport: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    markerColor: "#475569",
  },
  activity: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    markerColor: "#059669",
  },
  night: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    markerColor: "#4f46e5",
  },
};

export const DAY_MARKER_COLORS = [
  "#dc2626", // Day 1 Red
  "#2563eb", // Day 2 Blue
  "#059669", // Day 3 Emerald
  "#d97706", // Day 4 Amber
  "#7c3aed", // Day 5 Violet
  "#db2777", // Day 6 Pink
  "#0891b2", // Day 7 Cyan
];

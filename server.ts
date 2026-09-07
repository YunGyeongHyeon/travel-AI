import "dotenv/config";
import express, { type Request, type Response } from "express";
import path from "path";
import {
  describeAiError,
  describeAiSelection,
  getAiProvider,
} from "./server/ai.js";
import {
  placeSpotSchema,
  tripPlanDraftSchema,
} from "./server/trip-plan-schema.js";
import { createServer as createViteServer } from "vite";
import { TravelRequest, TripPlan, PlaceSpot } from "./src/types/index.js";
import {
  isChatMessage,
  isPlaceSpot,
  isTripPlanDraft,
} from "./src/lib/trip-plan.js";
import { requireAuth, type AuthedRequest } from "./server/auth.js";
import { insertTripLog } from "./server/trip-log-store.js";
import { consumeCredit, refundCredit } from "./server/credits.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// AI 제공자는 server/ai.ts가 AI_PROVIDER 환경변수와 키를 보고 고른다.
// 아무 키도 없으면 null이고, 그때는 아래 큐레이션 샘플(데모 모드)로 빠진다.

// Fallback high-quality Osaka 2N3D gourmet sample plan
function createSampleOsakaPlan(request?: Partial<TravelRequest>): TripPlan {
  const req: TravelRequest = {
    destination: "일본 오사카",
    durationDays: 3,
    durationNights: 2,
    budget: request?.budget || 1000000,
    currency: "KRW",
    themes: ["food", "hotplace"],
    companions: "friends",
    pace: "moderate",
    transportPreference: "public",
    specialRequests:
      "오사카 대표 미식(라멘, 오코노미야키, 타코야키, 야키니쿠)과 알찬 동선",
    ...request,
  };

  return {
    id: "sample-osaka-" + Date.now(),
    createdAt: new Date().toISOString(),
    request: req,
    tripTitle: "오사카 미식 대탐방 2박 3일 황금 동선",
    tagline:
      "입이 즐거운 천하의 부엌! 도톤보리부터 우메다까지 낭만과 맛의 정복",
    destinationName: "오사카 (Osaka)",
    country: "일본 (Japan)",
    centerCoordinates: {
      lat: 34.6937,
      lng: 135.5023,
      zoom: 13,
    },
    durationSummary: "2박 3일",
    highlights: [
      "도톤보리 글리코상 & 원조 타코야키/오코노미야키 먹방",
      "구로몬 시장의 신선한 해산물 & 와규 꼬치 탐방",
      "우메다 스카이빌딩 공중정원 전망대 야경",
      "신세카이 츠텐카쿠 레트로 골목 & 바삭한 쿠시카츠",
      "동선 낭비 제로! 미도스지선 중심의 효율적인 이동 경로",
    ],
    days: [
      {
        dayNumber: 1,
        themeTitle: "도톤보리 입성과 난바 레트로 미식의 밤",
        summary:
          "간사이 공항 도착 후 난바에 짐을 풀고, 화려한 도톤보리 운하와 뒷골목 야키니쿠를 즐기는 첫날",
        areaFocus: "난바 & 도톤보리 & 신사이바시 일대",
        dayEstimatedCost: 285000,
        transitSummary: "간사이 공항 라피트 특급 및 난바 일대 도보 이동",
        spots: [
          {
            id: "d1-s1",
            timeSlot: "11:30 - 12:40",
            timePeriod: "morning",
            name: "간사이 국제공항 → 난바역 (난카이 라피트)",
            localName: "関西国際空港 → 難波駅",
            category: "transport",
            categoryName: "교통 / 이동",
            address: "1 Senshukukonaka, Tajiri, Sennan District, Osaka",
            lat: 34.4347,
            lng: 135.2327,
            description:
              "특급 라피트 열차를 타고 38분 만에 쾌적하게 오사카 시내 중심인 난바로 직행합니다.",
            highlights: ["지정석으로 편안한 이동", "레트로 퓨처 디자인 열차"],
            estimatedCost: 14500,
            estimatedDuration: "40분",
            tips: "한국에서 미리 모바일 교환권을 예매하면 약 20% 할인됩니다.",
            rating: 4.8,
            nextTransport: {
              mode: "walk",
              description: "난바역에서 도톤보리 방면으로 도보 이동",
              durationMinutes: 8,
              estimatedCost: 0,
            },
          },
          {
            id: "d1-s2",
            timeSlot: "13:00 - 14:15",
            timePeriod: "lunch",
            name: "미즈노 (오코노미야키 전문점)",
            localName: "美津の (Mizuno)",
            category: "restaurant",
            categoryName: "맛집 / 점심",
            address: "1-4-15 Dotonbori, Chuo Ward, Osaka",
            lat: 34.6687,
            lng: 135.5022,
            description:
              "미슐랭 빕구르망에 빛나는 70년 전통 오코노미야키 명가. 마(야마이모) 100% 반죽의 부드러움이 일품입니다.",
            highlights: [
              "야마이모야키(산마 오코노미야키)",
              "미즈노야키 (해산물 듬뿍)",
            ],
            recommendedMenu: ["야마이모야키 (¥1,700)", "미즈노야키 (¥1,500)"],
            mustTryItems: ["야마이모야키", "생맥주(나마비루)"],
            estimatedCost: 22000,
            estimatedDuration: "1시간 15분",
            tips: "오픈 직후나 식사 피크를 살짝 피해서 방문하면 대기를 줄일 수 있습니다. 철판 앞에서 즉석 조리!",
            rating: 4.7,
            nextTransport: {
              mode: "walk",
              description: "도톤보리 메인 스트리트 산책",
              durationMinutes: 4,
              estimatedCost: 0,
            },
          },
          {
            id: "d1-s3",
            timeSlot: "14:30 - 16:00",
            timePeriod: "afternoon",
            name: "도톤보리 & 글리코상 & 앗치치혼포 타코야키",
            localName: "道頓堀 & あっちち本舗",
            category: "attraction",
            categoryName: "관광 / 길거리 미식",
            address: "7-19 Souemoncho, Chuo Ward, Osaka",
            lat: 34.6691,
            lng: 135.5031,
            description:
              "오사카의 심장 도톤보리 운하 다리 위에서 글리코상 인증샷을 남기고, 돈키호테 옆 불맛 가득한 타코야키를 맛봅니다.",
            highlights: [
              "글리코상 시그니처 포즈 촬영",
              "겉바속촉 큼직한 문어 타코야키",
            ],
            recommendedMenu: ["타코야키 간장+마요맛 8알 (¥600)"],
            estimatedCost: 6000,
            estimatedDuration: "1시간 30분",
            tips: "도톤보리 리버크루즈(오사카 주유패스 무료)를 낮에 미리 예약해두면 밤에 야경 감상 가능!",
            rating: 4.6,
            nextTransport: {
              mode: "walk",
              description: "신사이바시스지 아케이드 도보 이동",
              durationMinutes: 10,
              estimatedCost: 0,
            },
          },
          {
            id: "d1-s4",
            timeSlot: "16:30 - 18:00",
            timePeriod: "afternoon",
            name: "아메리카무라 & 오렌지 스트리트 카페투어",
            localName: "アメリカ村 & オレンジストリート",
            category: "cafe",
            categoryName: "카페 / 쇼핑",
            address: "Minamisenba, Chuo Ward, Osaka",
            lat: 34.6728,
            lng: 135.4972,
            description:
              "오사카 젊은이들의 스트리트 패션 성지와 감각적인 편집숍, 스페셜티 커피를 즐기는 감성 타임.",
            highlights: ["스트리머 커피 컴퍼니 라떼", "빈티지 패션 숍 구경"],
            recommendedMenu: ["리볼버 라떼 (¥650)", "말차 쿠키"],
            estimatedCost: 8000,
            estimatedDuration: "1시간 30분",
            tips: "오렌지 스트리트는 18:00 전후로 매장이 닫기 시작하니 오후에 둘러보는 것이 좋습니다.",
            rating: 4.5,
            nextTransport: {
              mode: "walk",
              description: "호젠지요코초 골목으로 이동",
              durationMinutes: 12,
              estimatedCost: 0,
            },
          },
          {
            id: "d1-s5",
            timeSlot: "18:30 - 20:30",
            timePeriod: "dinner",
            name: "야키니쿠 마츠사카규 야키니쿠 M (호젠지점)",
            localName: "松阪牛焼肉 M 法善寺横丁店",
            category: "restaurant",
            categoryName: "맛집 / 저녁",
            address: "1-1-19 Namba, Chuo Ward, Osaka",
            lat: 34.6678,
            lng: 135.5028,
            description:
              "일본 3대 명품 와규인 마츠사카 소고기를 부위별로 즐길 수 있는 프리미엄 야키니쿠. 입안에서 살살 녹는 마블링!",
            highlights: [
              "마츠사카규 특선 모둠 코스",
              "은은한 분위기의 돌담 골목",
            ],
            recommendedMenu: [
              "마츠사카규 6종 모둠 (¥8,500/1인)",
              "하이볼 & 냉면",
            ],
            mustTryItems: ["살치살", "특상 등심", "우설구이"],
            estimatedCost: 85000,
            estimatedDuration: "2시간",
            tips: "사전 구글맵 또는 타베로그 예약 추천. 식사 후 호젠지 절의 이끼 낀 후도묘오 상에 물을 뿌리며 소원을 빌어보세요.",
            rating: 4.8,
            reservationRequired: true,
            nextTransport: {
              mode: "walk",
              description: "도톤보리 운하 야경 감상",
              durationMinutes: 5,
              estimatedCost: 0,
            },
          },
          {
            id: "d1-s6",
            timeSlot: "21:00 - 22:30",
            timePeriod: "night",
            name: "도톤보리 톤보리 리버워크 & 심야 라멘 (카무쿠라)",
            localName: "どうとんぼり神座 千日前店",
            category: "night",
            categoryName: "야경 / 심야 미식",
            address: "1-7-3 Dotonbori, Chuo Ward, Osaka",
            lat: 34.6685,
            lng: 135.5039,
            description:
              "화려한 네온사인이 물결에 비치는 도톤보리 밤거리를 걷고, 배추의 단맛이 우러난 깔끔한 중독성의 카무쿠라 라멘으로 하루 마무리.",
            highlights: ["배추 가득 시원한 라멘 국물", "도톤보리 네온 야경"],
            recommendedMenu: ["맛있는 라멘(오이시이 라멘) + 온천계란 (¥880)"],
            estimatedCost: 9000,
            estimatedDuration: "1시간 30분",
            tips: "자판기 주문 방식이며 한국어 메뉴 지원. 테이블에 놓인 부추무침을 라멘에 듬뿍 넣어 먹으면 별미입니다.",
            rating: 4.4,
          },
        ],
      },
      {
        dayNumber: 2,
        themeTitle: "오사카성 역사 탐방 & 우메다 스카이뷰 미식 데이",
        summary:
          "아침 구로몬 시장의 신선한 먹거리로 시작해 오사카성의 웅장함, 우메다의 세련된 쇼핑과 미쉐린 라멘, 환상적인 일몰 야경까지",
        areaFocus: "구로몬시장 & 오사카성 & 우메다",
        dayEstimatedCost: 195000,
        transitSummary: "오사카 메트로 사카이스지선 & 다니마치선 & 미도스지선",
        spots: [
          {
            id: "d2-s1",
            timeSlot: "09:00 - 10:30",
            timePeriod: "morning",
            name: "구로몬 시장 (오사카의 부엌 길거리 조식)",
            localName: "黒門市場 (Kuromon Market)",
            category: "restaurant",
            categoryName: "시장 미식 / 조식",
            address: "2-4-1 Nipponbashi, Chuo Ward, Osaka",
            lat: 34.6655,
            lng: 135.5065,
            description:
              "신선한 참치 덮밥, 즉석 가리비 버터구이, 마구로 뱃살 초밥, 멜론 주스 등 활기 넘치는 전통 시장 먹방!",
            highlights: ["즉석 와규 꼬치 구이", "생참치 해체 및 모둠 스시"],
            recommendedMenu: [
              "참치 도로 초밥 (¥1,500)",
              "가리비 치즈구이 (¥800)",
            ],
            estimatedCost: 25000,
            estimatedDuration: "1시간 30분",
            tips: "오전 9시~10시 사이 방문해야 가장 활기차고 재료가 신선합니다.",
            rating: 4.5,
            nextTransport: {
              mode: "subway",
              description: "닛폰바시역 → 다니마치4초메역 (사카이스지선/주오선)",
              durationMinutes: 15,
              estimatedCost: 2400,
            },
          },
          {
            id: "d2-s2",
            timeSlot: "11:00 - 12:45",
            timePeriod: "morning",
            name: "오사카성 천수각 & 고자부네 놀잇배",
            localName: "大阪城天守閣",
            category: "attraction",
            categoryName: "역사 랜드마크",
            address: "1-1 Osakajo, Chuo Ward, Osaka",
            lat: 34.6873,
            lng: 135.5262,
            description:
              "도요토미 히데요시가 축성한 오사카의 상징. 웅장한 돌벽과 해자를 둘러보고 천수각 8층 전망대에서 파노라마 전경을 감상합니다.",
            highlights: [
              "천수각 최상층 시내 전망",
              "금빛 고자부네 놀잇배 체험",
            ],
            estimatedCost: 6000,
            estimatedDuration: "1시간 45분",
            tips: "오사카 주유패스 소지 시 천수각 입장 및 고자부네 배 무료 탑승 가능.",
            rating: 4.6,
            nextTransport: {
              mode: "subway",
              description: "모리노미야역 → 우메다역 (다니마치선/미도스지선)",
              durationMinutes: 20,
              estimatedCost: 2400,
            },
          },
          {
            id: "d2-s3",
            timeSlot: "13:15 - 14:30",
            timePeriod: "lunch",
            name: "스시 사카바 사시스 (우메다 화제의 가성비 스시)",
            localName: "すし酒場 さしす 梅田店",
            category: "restaurant",
            categoryName: "맛집 / 점심",
            address: "1-1-3 Umeda, Kita Ward, Osaka (오사카역전 제3빌딩)",
            lat: 34.7001,
            lng: 135.4981,
            description:
              "참치 뱃살이 넘쳐흐르는 '참치 김말이(도로 텟카마키)'와 새우 7마리 성게알 육회가 시그니처인 줄 서서 먹는 가성비 최강 초밥집.",
            highlights: ["넘쳐흐르는 참치김말이", "새우 육회(에비 유케)"],
            recommendedMenu: [
              "도로 텟카마키 (¥1,078)",
              "모둠 초밥 8종",
              "하이볼",
            ],
            mustTryItems: ["도로 텟카마키", "에비 7마리 유케"],
            estimatedCost: 28000,
            estimatedDuration: "1시간 15분",
            tips: "지하 상가에 위치해 있으며 웨이팅이 있을 수 있지만 회전율이 빠릅니다. 가성비 대만족!",
            rating: 4.7,
            nextTransport: {
              mode: "walk",
              description: "그랜드 프론트 오사카 및 우메다 쇼핑몰 이동",
              durationMinutes: 8,
              estimatedCost: 0,
            },
          },
          {
            id: "d2-s4",
            timeSlot: "15:00 - 17:30",
            timePeriod: "afternoon",
            name: "루쿠아(LUCUA) 오사카 & 그랜드 프론트 감성 쇼핑",
            localName: "ルクア大阪 & グランフロント大阪",
            category: "shopping",
            categoryName: "쇼핑 / 라이프스타일",
            address: "3-1-3 Umeda, Kita Ward, Osaka",
            lat: 34.7024,
            lng: 135.4959,
            description:
              "일본 최신 패션 브랜드와 잡화, 츠타야 서점, 캐릭터 숍(포켓몬 센터 등)이 모여있는 북부 최대 복합 랜드마크.",
            highlights: [
              "츠타야 서점 스타벅스 라운지",
              "기념품 및 드럭스토어 면세 쇼핑",
            ],
            estimatedCost: 40000,
            estimatedDuration: "2시간 30분",
            tips: "5,000엔 이상 구매 시 10% 소비세 면세 혜택 꼭 챙기기 (여권 필수).",
            rating: 4.6,
            nextTransport: {
              mode: "walk",
              description: "우메다 스카이빌딩 방면 도보 이동",
              durationMinutes: 12,
              estimatedCost: 0,
            },
          },
          {
            id: "d2-s5",
            timeSlot: "18:00 - 19:30",
            timePeriod: "dinner",
            name: "우메다 스카이빌딩 공중정원 전망대 & 일몰 야경",
            localName: "梅田スカイビル 空中庭園展望台",
            category: "attraction",
            categoryName: "야경 / 랜드마크",
            address: "1-1-88 Oyodonaka, Kita Ward, Osaka",
            lat: 34.7052,
            lng: 135.4896,
            description:
              "지상 173m 높이에서 360도 개방형 루프탑으로 오사카 시내의 노을과 화려한 야경을 감상하는 대표 명소.",
            highlights: [
              "공중 에스컬레이터 터널",
              "루미 스카이 워크 형광 산책로",
            ],
            estimatedCost: 15000,
            estimatedDuration: "1시간 30분",
            tips: "일몰 30분 전(보통 18시경)에 입장하면 붉은 노을과 불빛 야경을 동시에 즐길 수 있습니다.",
            rating: 4.8,
            nextTransport: {
              mode: "walk",
              description:
                "우메다 지하 키지 오코노미야키 또는 나카자키초로 이동",
              durationMinutes: 10,
              estimatedCost: 0,
            },
          },
          {
            id: "d2-s6",
            timeSlot: "20:00 - 22:00",
            timePeriod: "dinner",
            name: "멘야 하나부사 (미쉐린 가이드 수록 닭육수 라멘)",
            localName: "麺屋 芳",
            category: "restaurant",
            categoryName: "맛집 / 심야",
            address: "Kita Ward, Osaka",
            lat: 34.7065,
            lng: 135.5012,
            description:
              "깊고 진한 닭 육수(토리파이탄) 베이스에 훈연 차슈가 얹어진 국물 라멘과 츠케멘으로 완벽한 밤 식도락.",
            highlights: ["풍미 가득한 토리파이탄 소유라멘", "특제 수비드 차슈"],
            recommendedMenu: [
              "특제 토리파이탄 라멘 (¥1,100)",
              "아지타마고 추가",
            ],
            estimatedCost: 12000,
            estimatedDuration: "1시간 30분",
            tips: "국물이 담백하면서도 깊어 하루의 피로를 풀어줍니다.",
            rating: 4.7,
          },
        ],
      },
      {
        dayNumber: 3,
        themeTitle: "신세카이 쿠시카츠 & 덴덴타운 쇼핑 후 귀국",
        summary:
          "오사카의 옛 정취가 살아있는 츠텐카쿠와 바삭한 쿠시카츠를 즐기고, 마지막 면세 쇼핑 후 공항으로 이동하는 알찬 일정",
        areaFocus: "신세카이 & 텐노지 & 덴덴타운",
        dayEstimatedCost: 135000,
        transitSummary: "미도스지선 / 난카이선 특급 라피트",
        spots: [
          {
            id: "d3-s1",
            timeSlot: "09:30 - 11:30",
            timePeriod: "morning",
            name: "신세카이 & 츠텐카쿠 타워 (빌리켄 행운의 신)",
            localName: "新世界 & 通天閣",
            category: "attraction",
            categoryName: "관광 / 레트로",
            address: "1-18-6 Ebisuhigashi, Naniwa Ward, Osaka",
            lat: 34.6525,
            lng: 135.5063,
            description:
              "1900년대 초 복고풍 레트로 감성이 그대로 보존된 신세카이. 츠텐카쿠 발바닥을 만지면 행운이 온다는 빌리켄 신상을 만나보세요.",
            highlights: [
              "츠텐카쿠 타워 슬라이더(미끄럼틀)",
              "화려한 대형 간판 거리",
            ],
            estimatedCost: 9000,
            estimatedDuration: "2시간",
            tips: "거리의 입체 복어 간판과 간코스시 간판 앞에서 인증샷을 남겨보세요.",
            rating: 4.5,
            nextTransport: {
              mode: "walk",
              description: "신세카이 쿠시카츠 거리 도보 2분",
              durationMinutes: 2,
              estimatedCost: 0,
            },
          },
          {
            id: "d3-s2",
            timeSlot: "11:45 - 13:00",
            timePeriod: "lunch",
            name: "쿠시카츠 다루마 (원조 신세카이 총본점)",
            localName: "元祖串かつ だるま 新世界総本店",
            category: "restaurant",
            categoryName: "맛집 / 점심",
            address: "2-3-9 Ebisuhigashi, Naniwa Ward, Osaka",
            lat: 34.6517,
            lng: 135.5057,
            description:
              "오사카 쿠시카츠의 원조! 얇고 바삭한 튀김옷과 비법 소스, 소고기 꼬치, 아스파라거스, 치즈, 새우튀김의 조화.",
            highlights: [
              "소스 두 번 찍기 금지(이도시메 긴시)의 본고장",
              "모둠 꼬치 세트",
            ],
            recommendedMenu: [
              "신세카이 세트 9종 (¥1,500)",
              "도테야키 (소힘줄 된장조림)",
            ],
            mustTryItems: ["원조 쿠시카츠", "도테야키", "생맥주"],
            estimatedCost: 20000,
            estimatedDuration: "1시간 15분",
            tips: "기본으로 나오는 양배추는 소스에 찍어 입가심하기에 최고입니다.",
            rating: 4.6,
            nextTransport: {
              mode: "walk",
              description: "덴덴타운 & 난바 파크스 방면 도보 이동",
              durationMinutes: 10,
              estimatedCost: 0,
            },
          },
          {
            id: "d3-s3",
            timeSlot: "13:30 - 15:30",
            timePeriod: "afternoon",
            name: "난바 파크스 & 돈키호테 센니치마에점 (마지막 기념품 쇼핑)",
            localName: "なんばパークス & ドン・キホーテ",
            category: "shopping",
            categoryName: "쇼핑 / 기념품",
            address: "2-10-70 Nanbanaka, Naniwa Ward, Osaka",
            lat: 34.6617,
            lng: 135.5019,
            description:
              "도심 속 계단식 정원 난바 파크스 산책과 드럭스토어 과자(자가비, 킷캣 말차맛, 도쿄바나나), 카레, 곤약젤리 쇼핑.",
            highlights: [
              "난바 파크스 옥상 가든 힐링",
              "오사카 한정 특산품 쇼핑",
            ],
            estimatedCost: 50000,
            estimatedDuration: "2시간",
            tips: "미리 짐을 정리해 캐리어에 넣고, 난카이 난바역 코인라커를 활용하면 편리합니다.",
            rating: 4.6,
            nextTransport: {
              mode: "train",
              description: "난카이 난바역에서 간사이 공항행 라피트 탑승",
              durationMinutes: 38,
              estimatedCost: 14500,
            },
          },
          {
            id: "d3-s4",
            timeSlot: "16:00 - 18:00",
            timePeriod: "afternoon",
            name: "간사이 국제공항 이동 & 면세점 기념품 쇼핑",
            localName: "関西国際空港 免税店",
            category: "transport",
            categoryName: "공항 / 출국",
            address: "1 Senshukukonaka, Tajiri, Sennan District, Osaka",
            lat: 34.4347,
            lng: 135.2327,
            description:
              "출국 2~3시간 전 여유롭게 체크인 후 공항 면세점에서 로이스 초콜릿, 시로이 고이비토 등을 쇼핑하고 귀국 비행기에 탑승합니다.",
            highlights: ["로이스 초콜릿 & 도쿄바나나", "안전한 귀국 비행"],
            estimatedCost: 25000,
            estimatedDuration: "2시간",
            tips: "비행기 출발 2시간 30분 전까지 도착을 권장합니다.",
            rating: 4.7,
          },
        ],
      },
    ],
    budgetAnalysis: {
      targetBudget: req.budget,
      totalEstimatedCost: 615000,
      remainingBudget: req.budget - 615000,
      perPersonDailyCost: Math.round(615000 / 3),
      categories: {
        food: {
          category: "food",
          label: "식비 & 미식 탐방",
          allocatedAmount: 300000,
          estimatedAmount: 228000,
          percentage: 37,
          details: [
            "1일차: 미즈노 오코노미야키, 타코야키, 야키니쿠 M 코스, 카무쿠라 라멘 (₩122,000)",
            "2일차: 구로몬 시장 해산물, 사시스 스시, 토리파이탄 라멘 (₩65,000)",
            "3일차: 원조 다루마 쿠시카츠, 카페 & 간식 (₩41,000)",
          ],
        },
        lodging: {
          category: "lodging",
          label: "숙박 (난바 3성급 비즈니스 호텔 2박)",
          allocatedAmount: 300000,
          estimatedAmount: 200000,
          percentage: 32,
          details: [
            "난바/신사이바시 인근 깔끔한 호텔 2박 (1박당 약 ₩100,000 기준)",
          ],
        },
        transport: {
          category: "transport",
          label: "교통비 (공항 라피트 왕복 + 지하철 패스)",
          allocatedAmount: 100000,
          estimatedAmount: 48000,
          percentage: 8,
          details: [
            "간사이공항 ↔ 난바 라피트 왕복 (₩29,000)",
            "오사카 지하철 1일 패스 및 개별 승차 (₩19,000)",
          ],
        },
        attraction: {
          category: "attraction",
          label: "관광 / 입장료",
          allocatedAmount: 100000,
          estimatedAmount: 24000,
          percentage: 4,
          details: [
            "우메다 스카이빌딩 공중정원 (₩15,000)",
            "오사카성 천수각 (₩6,000)",
            "츠텐카쿠 전망대 (₩3,000 할인가)",
          ],
        },
        shoppingEtc: {
          category: "shoppingEtc",
          label: "쇼핑 & 비상금 & 기타",
          allocatedAmount: 200000,
          estimatedAmount: 115000,
          percentage: 19,
          details: [
            "돈키호테 드럭스토어 & 면세점 기념품 (₩90,000)",
            "포켓 Wi-Fi / eSim 및 여행자 보험 (₩25,000)",
          ],
        },
      },
      savingTips: [
        "오사카 주유패스(1일권 약 28,000원)를 활용하면 오사카성 천수각, 우메다 스카이빌딩(16시 이전), 도톤보리 크루즈가 모두 무료로 약 2만 원 절약!",
        "난카이 라피트 왕복권은 한국 온라인 여행사에서 사전 구매 시 현장 구매 대비 20% 저렴합니다.",
        "식당은 런치 타임을 적극 공략하면 디너 대비 30~50% 저렴한 가격에 동일한 퀄리티를 즐길 수 있습니다.",
      ],
    },
    foodSpotlights: [
      {
        id: "f1",
        name: "오코노미야키 & 야키소바",
        localName: "お好み焼き & 焼きそば",
        dishType: "오사카 3대 길거리 요리",
        recommendedPlaces: [
          "미즈노 (도톤보리)",
          "키지 (우메다 스카이빌딩 지하)",
          "치보 (센니치마에)",
        ],
        priceRange: "¥1,200 ~ ¥2,000",
        tasteDescription:
          "진한 특제 소스와 마요네즈, 춤추는 가쓰오부시 아래 부드럽고 촉촉한 양배추 반죽의 환상적인 하모니",
        eatingTips:
          "작은 철판 주걱(헤라)으로 피자처럼 잘라 철판 위에서 따뜻하게 바로 먹는 것이 정석입니다.",
        dayIndexRef: 1,
      },
      {
        id: "f2",
        name: "쿠시카츠 (꼬치 튀김)",
        localName: "串カツ",
        dishType: "신세카이 전통 튀김 꼬치",
        recommendedPlaces: ["쿠시카츠 다루마 본점", "야에카츠", "텐구"],
        priceRange: "꼬치 1개당 ¥130 ~ ¥300",
        tasteDescription:
          "극도로 얇고 바삭바삭한 튀김옷 속에 갇힌 소고기, 연근, 새우의 육즙과 달콤 짭조름한 우스터 소스",
        eatingTips:
          "위생을 위해 소스는 처음에 듬뿍 한 번만 찍어야 합니다. 소스가 모자라면 기본 양배추로 소스를 떠서 얹어 드세요.",
        dayIndexRef: 3,
      },
      {
        id: "f3",
        name: "타코야키 (문어빵)",
        localName: "たこ焼き",
        dishType: "오사카의 소울 푸드",
        recommendedPlaces: ["앗치치혼포 (도톤보리)", "와나카 (난바)", "쿠쿠루"],
        priceRange: "8개들이 ¥600 ~ ¥800",
        tasteDescription:
          "겉은 고소하고 바삭하며 안쪽은 크림처럼 사르르 녹아내리는 육수에 큼직하고 쫄깃한 문어 덩어리",
        eatingTips:
          "갓 구워 나온 타코야키는 안쪽이 매우 뜨거우니 젓가락으로 살짝 구멍을 내어 한 김 식힌 후 파를 듬뿍 얹어 드세요.",
        dayIndexRef: 1,
      },
      {
        id: "f4",
        name: "와규 야키니쿠",
        localName: "黒毛和牛 焼肉",
        dishType: "프리미엄 숯불 소고기",
        recommendedPlaces: ["마츠사카규 야키니쿠 M", "만노 (난바)", "이치"],
        priceRange: "1인 ¥6,000 ~ ¥10,000",
        tasteDescription:
          "눈꽃 마블링이 숯불 위에서 녹아내리며 뿜어내는 극상의 고소함과 부드러운 육질",
        eatingTips:
          "소금이나 와사비만 살짝 찍어 고기 본연의 풍미를 먼저 맛보고, 시원한 하이볼이나 생맥주를 곁들이면 천국입니다.",
        dayIndexRef: 1,
      },
      {
        id: "f5",
        name: "화제의 넘치는 스시 & 사시미",
        localName: "すし & 刺身",
        dishType: "신선한 해산물",
        recommendedPlaces: [
          "스시 사카바 사시스 (우메다)",
          "하루코마 스시 (텐진바시)",
          "스시잔마이",
        ],
        priceRange: "¥2,000 ~ ¥3,500",
        tasteDescription:
          "입안 가득 차는 두툼한 참치 뱃살과 신선한 성게알, 단새우의 녹아내리는 감칠맛",
        eatingTips:
          "사시스의 '도로 텟카마키'는 인증샷 필수 메뉴! 김말이 밖으로 참치가 튀어나온 비주얼이 압권입니다.",
        dayIndexRef: 2,
      },
    ],
    routeOptimizationExplanation:
      "Day 1은 남부 도톤보리/난바 구역에 집중하여 이동 시간을 최소화하고, Day 2는 오사카성과 북부 우메다/스카이빌딩을 미도스지선으로 직통 연결하여 동선 꼬임을 완전히 없앴습니다. 마지막 Day 3는 공항 라피트 환승역인 난바 바로 옆 신세카이를 둘러본 후 공항으로 즉시 이동할 수 있도록 설계된 최적의 순환 코스입니다.",
    localTravelTips: {
      recommendedPasses: [
        "오사카 주유패스 1일권 (Osaka Amazing Pass) - 주요 관광지 40여 곳 무료 및 지하철 무제한",
        "난카이 라피트 특급 왕복권 - 공항 ↔ 난바 최단 38분",
        "ICOCA 또는 스이카(Suica) 교통카드 - 편의점 및 자판기 결제 겸용",
      ],
      packingEssentials: [
        "110V 돼지코 어댑터 (일본은 110V 2구 콘센트 사용)",
        "동전 지갑 (일본은 500엔, 100엔 등 동전 사용 빈도가 높음)",
        "보조 배터리 & 구글맵 앱 (도보 길찾기 필수)",
        "편안한 운동화 (하루 15,000보 이상 도보)",
      ],
      localEtiquette: [
        "오사카 지하철 에스컬레이터는 '오른쪽'에 서고 '왼쪽'을 비워둡니다 (도쿄와 반대).",
        "쿠시카츠 소스는 위생상 '두 번 찍기 절대 금지'입니다.",
        "식당 내 흡연 가능 구역인지 확인하거나 금연 표시를 확인하세요.",
        "길거리에서 걸어 다니며 음식을 먹는 것(보행 취식)보다는 가게 앞 지정 장소에서 먹는 것이 예의입니다.",
      ],
      weatherAdvice:
        "사계절 여행하기 좋으며, 봄(3~5월) 벚꽃과 가을(10~11월) 단풍철이 가장 쾌적합니다. 여름은 한국보다 습하므로 휴대용 선풍기와 얇은 겉옷을 준비하세요.",
    },
  };
}

/**
 * 만들어낸 일정을 여행 로그에 남기고 응답한다.
 *
 * 응답 전에 저장하므로, 사용자가 결과를 받는 순간 이미 기록도 끝나 있다.
 * 저장에 실패하면 log만 null로 내려보낸다 — 일정 자체는 유효하니 화면에는 띄워야 한다.
 */
async function respondWithPlan(
  req: Request,
  res: Response,
  travelReq: TravelRequest,
  plan: TripPlan,
  creditsRemaining: number | null,
) {
  const auth = (req as AuthedRequest).auth;
  const log = auth
    ? await insertTripLog(auth.token, auth.userId, travelReq, plan)
    : null;

  res.json({ plan, log, creditsRemaining });
}

/**
 * API 키가 없을 때만 쓰는 데모 응답.
 *
 * AI가 만든 게 아니므로 로그에 남기지 않는다. 남기면 나중에 목록에서
 * 진짜 생성물과 구분할 방법이 없다.
 */
function respondWithDemoPlan(
  res: Response,
  travelReq: TravelRequest,
  plan: TripPlan,
) {
  res.json({ plan, log: null, isDemo: true });
}

// Generate Itinerary Endpoint
app.post("/api/generate-itinerary", requireAuth, async (req, res) => {
  // catch에서도 봐야 하므로 try 밖에 둔다. 차감했는데 실패하면 돌려줘야 한다.
  let creditConsumed = false;

  try {
    const travelReq: TravelRequest = req.body;

    if (!travelReq || !travelReq.destination) {
      return res
        .status(400)
        .json({ error: "여행 목적지(destination)를 입력해주세요." });
    }
    const ai = getAiProvider();

    // 키가 아예 없으면 데모 모드. 화면은 돌아가되 로그에는 남기지 않는다.
    if (!ai) {
      console.log("No AI provider configured, returning curated sample (demo mode)");
      const demoPlan = createSampleOsakaPlan(travelReq);
      demoPlan.request = travelReq;
      demoPlan.destinationName = travelReq.destination;
      demoPlan.tripTitle = `${travelReq.destination} ${travelReq.durationNights}박 ${travelReq.durationDays}일 맞춤 여행 일정`;
      return respondWithDemoPlan(res, travelReq, demoPlan);
    }

    // AI를 부르기 전에 차감한다. 부르고 나서 차감하면 응답 도중 사용자가
    // 창을 닫았을 때 원가만 나가고 과금은 못 한다.
    const auth = (req as AuthedRequest).auth!;
    const credit = await consumeCredit(auth.userId);

    if (!credit.ok && credit.reason === "insufficient") {
      return res.status(402).json({
        error:
          "크레딧이 모두 소진되었습니다. 일정 1건 생성에 1크레딧이 필요합니다.",
        creditsRemaining: 0,
      });
    }
    // unavailable(크레딧 DB 장애)은 통과시킨다. 과금은 못 하지만
    // 크레딧 시스템 하나 때문에 서비스 전체가 멈추는 편이 더 나쁘다.
    creditConsumed = credit.ok;
    const creditsRemaining = credit.ok ? credit.remaining : null;

    const systemInstruction = `당신은 전 세계 여행 동선 최적화 전문가이자 최고의 현지 미식(식도락) 큐레이터입니다.
사용자가 입력한 목적지, 일정(N박 N일), 총 예산, 선호 테마, 동행자, 이동 스타일 등을 바탕으로 실제 여행자가 100% 만족할 수 있는 구체적이고 정교한 여행 일정(JSON 형식)을 생성합니다.

반드시 지켜야 할 핵심 원칙:
1. **지리적 동선 최적화**: 한 날에는 인접한 구역끼리만 묶어 불필요한 이동과 동선 꼬임을 완전히 제거하세요. 각 장소마다 실제에 가까운 위도(lat), 경도(lng) 좌표를 정확히 제공하세요.
2. **테마 반영**: 사용자가 '식도락(food)'을 선택했다면 각 끼니(아침, 점심, 저녁, 심야 야식)마다 현지 최고 인기 맛집, 추천 메뉴(가격 포함), 웨이팅 팁, 먹는 법을 생생하게 구성하세요. 다른 테마(힐링, 쇼핑, 문화 등)도 충실히 반영하세요.
3. **시간대별 구체성**: 09:00, 11:30, 13:00 등 현실적인 시간 분배와 체류 시간, 그리고 다음 장소로 가는 이동 수단(도보, 지하철 노선명, 버스 번호, 예상 소요 시간, 교통비)을 nextTransport에 명시하세요.
4. **예산 분석(Budget Analysis)**: 총 예산 대비 식비, 숙박비, 교통비, 입장료, 쇼핑/기타의 비율과 예상 금액을 계산하고, 절약 꿀팁을 제공하세요.
5. **언어**: 한국어로 자연스럽고 신뢰감 있게 작성하되, 식당 및 명소 이름은 현지어/영어(localName)를 함께 적어주세요.`;

    const prompt = `다음 조건에 맞추어 완벽한 여행 일정을 JSON 형식으로 생성해줘:
- 여행 목적지: ${travelReq.destination}
- 여행 기간: ${travelReq.durationNights}박 ${travelReq.durationDays}일 (${travelReq.durationDays}일차 일정 모두 포함)
- 총 예산: 약 ${travelReq.budget ? travelReq.budget.toLocaleString() : "1,000,000"}원 (통화: ${travelReq.currency || "KRW"})
- 선호 테마: ${travelReq.themes ? travelReq.themes.join(", ") : "식도락(food), 핫플레이스(hotplace)"}
- 동행자: ${travelReq.companions || "friends"}
- 여행 페이스: ${travelReq.pace || "moderate"} (여유 vs 알참)
- 이동 수단 선호: ${travelReq.transportPreference || "public"} (대중교통/도보 등)
- 특별 요청 사항: ${travelReq.specialRequests || "없음"}

응답은 반드시 아래 TypeScript 인터페이스 구조에 부합하는 JSON 문자열이어야 합니다.
{
  "tripTitle": "string (매력적인 일정 메인 타이틀)",
  "tagline": "string (한 줄 감성 슬로건)",
  "destinationName": "string (도시명)",
  "country": "string (국가명)",
  "centerCoordinates": { "lat": number, "lng": number, "zoom": number },
  "durationSummary": "${travelReq.durationNights}박 ${travelReq.durationDays}일",
  "highlights": ["string (핵심 포인트 4~5개)"],
  "days": [
    {
      "dayNumber": 1,
      "themeTitle": "string (1일차 테마)",
      "summary": "string (1일차 요약)",
      "areaFocus": "string (주요 활동 구역)",
      "dayEstimatedCost": number (1일차 총 예상 비용 원화),
      "transitSummary": "string (1일차 주요 이동 방식)",
      "spots": [
        {
          "id": "d1-s1",
          "timeSlot": "09:30 - 11:00",
          "timePeriod": "morning" | "lunch" | "afternoon" | "dinner" | "evening" | "night",
          "name": "string (한국어 명칭)",
          "localName": "string (현지어 명칭)",
          "category": "restaurant" | "cafe" | "attraction" | "shopping" | "lodging" | "transport" | "activity" | "night",
          "categoryName": "string (예: 맛집 / 점심, 카페, 관광명소 등)",
          "address": "string",
          "lat": number,
          "lng": number,
          "description": "string (상세 소개)",
          "highlights": ["string"],
          "recommendedMenu": ["string (추천 메뉴와 가격)"],
          "mustTryItems": ["string"],
          "estimatedCost": number (원화 환산 예상 금액),
          "estimatedDuration": "string (예: 1시간 30분)",
          "tips": "string (웨이팅, 예약, 방문 꿀팁)",
          "rating": number (4.0 ~ 4.9),
          "reservationRequired": boolean,
          "nextTransport": {
            "mode": "walk" | "subway" | "bus" | "taxi" | "train" | "car",
            "description": "string (예: 지하철 미도스지선 3정거장)",
            "durationMinutes": number,
            "estimatedCost": number,
            "transferTips": "string"
          }
        }
      ]
    }
  ],
  "budgetAnalysis": {
    "targetBudget": number,
    "totalEstimatedCost": number,
    "remainingBudget": number,
    "perPersonDailyCost": number,
    "categories": {
      "food": { "category": "food", "label": "식비 & 맛집", "allocatedAmount": number, "estimatedAmount": number, "percentage": number, "details": ["string"] },
      "lodging": { "category": "lodging", "label": "숙박", "allocatedAmount": number, "estimatedAmount": number, "percentage": number, "details": ["string"] },
      "transport": { "category": "transport", "label": "교통비", "allocatedAmount": number, "estimatedAmount": number, "percentage": number, "details": ["string"] },
      "attraction": { "category": "attraction", "label": "입장료/관광", "allocatedAmount": number, "estimatedAmount": number, "percentage": number, "details": ["string"] },
      "shoppingEtc": { "category": "shoppingEtc", "label": "쇼핑 & 기타", "allocatedAmount": number, "estimatedAmount": number, "percentage": number, "details": ["string"] }
    },
    "savingTips": ["string"]
  },
  "foodSpotlights": [
    {
      "id": "f1",
      "name": "string (대표 음식명)",
      "localName": "string",
      "dishType": "string",
      "recommendedPlaces": ["string (추천 식당 목록)"],
      "priceRange": "string",
      "tasteDescription": "string",
      "eatingTips": "string",
      "dayIndexRef": 1
    }
  ],
  "routeOptimizationExplanation": "string (동선이 왜 효율적인지 지리적 설명)",
  "localTravelTips": {
    "recommendedPasses": ["string (추천 교통 패스 및 티켓)"],
    "packingEssentials": ["string (준비물)"],
    "localEtiquette": ["string (현지 에티켓 및 주의사항)"],
    "weatherAdvice": "string (날씨 및 옷차림 조언)"
  }
}`;

    // 3일치 일정 JSON은 출력이 길다. 스트리밍으로 받아 HTTP 타임아웃을 피한다.
    const parsedPlan = await ai.generateJson({
      system: systemInstruction,
      prompt,
      schema: tripPlanDraftSchema as unknown as Record<string, unknown>,
      effort: "high",
      maxTokens: 64000,
    });

    // Claude는 구조화 출력이 모양을 보장하지만 Gemini는 아니다. 한 번 더 확인한다.
    if (!isTripPlanDraft(parsedPlan)) {
      throw new Error("AI가 일정 형식에 맞지 않는 응답을 반환했습니다.");
    }

    const fullPlan: TripPlan = {
      // 화면 렌더링용 id. 실제 식별자는 trip_logs가 발급하는 uuid다.
      id: "trip-" + Date.now(),
      createdAt: new Date().toISOString(),
      request: travelReq,
      ...parsedPlan,
    };

    await respondWithPlan(req, res, travelReq, fullPlan, creditsRemaining);
  } catch (error: unknown) {
    // 예전에는 여기서 오사카 샘플을 돌려줬다. 그러면 크레딧 부족이든 과부하든
    // 전부 "성공"처럼 보이고, 가짜 일정이 로그에 쌓인다. 실패는 실패라고 알린다.
    console.error("Error generating itinerary:", error);

    // 결과를 못 줬으면 크레딧도 받지 않는다.
    // Gemini 503이나 JSON 깨짐은 실제로 일어나는 일이라 이게 없으면
    // 사용자는 일정 없이 크레딧만 잃는다.
    const auth = (req as AuthedRequest).auth;
    if (creditConsumed && auth) {
      await refundCredit(auth.userId);
    }

    res.status(502).json({
      error: describeAiError(
        error,
        "여행 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    });
  }
});

// Regenerate single spot endpoint
app.post("/api/regenerate-spot", requireAuth, async (req, res) => {
  try {
    const { destination, dayNumber, currentSpot, userPreference } = req.body as {
      destination?: string;
      dayNumber?: number;
      currentSpot?: PlaceSpot;
      userPreference?: string;
    };

    if (!currentSpot) {
      return res.status(400).json({ error: "currentSpot is required" });
    }

    const ai = getAiProvider();
    if (!ai) {
      return res.json({
        ...currentSpot,
        id: "spot-" + Date.now(),
        name: `[추천 대안] ${currentSpot.name} 인근 명소`,
        description: `사용자 맞춤 요청(${userPreference || "가성비/분위기"})에 맞춘 대안 장소입니다.`,
      });
    }

    const prompt = `여행지: ${destination}
일정: ${dayNumber}일차
기존 장소: ${JSON.stringify(currentSpot)}
사용자 변경 요청: ${userPreference || "다른 훌륭한 맛집 또는 볼거리로 대체해줘"}

기존 장소를 대체할 수 있는 동선상 완벽한 새로운 PlaceSpot JSON 객체를 단 하나만 반환해주세요. 위도, 경도 좌표와 추천 메뉴, 가격, 팁을 포함해야 합니다.`;

    // 장소 하나만 바꾸면 되므로 effort를 낮춰 응답을 빠르게 받는다.
    const parsedSpot = await ai.generateJson({
      system:
        "당신은 여행 전문가입니다. 요청에 부합하는 단일 PlaceSpot JSON 객체만 반환하세요.",
      prompt,
      schema: placeSpotSchema as unknown as Record<string, unknown>,
      effort: "medium",
      maxTokens: 8000,
    });

    if (!isPlaceSpot(parsedSpot)) {
      throw new Error("Claude API returned an invalid spot shape.");
    }
    const newSpot: PlaceSpot = {
      ...parsedSpot,
      id: "spot-" + Date.now(),
    };
    res.json(newSpot);
  } catch (err: unknown) {
    console.error("Error regenerating spot:", err);
    res.status(500).json({
      error: describeAiError(err, "Failed to regenerate spot"),
    });
  }
});

// Trip Assistant AI Chat endpoint
app.post("/api/trip-chat", requireAuth, async (req, res) => {
  try {
    const { tripContext, message, chatHistory } = req.body as {
      tripContext?: TripPlan;
      message?: string;
      chatHistory?: unknown;
    };

    const history = Array.isArray(chatHistory)
      ? chatHistory.filter(isChatMessage)
      : [];

    const ai = getAiProvider();
    if (!ai) {
      return res.json({
        reply: `[안내] 문의주신 "${message}"에 대한 답변입니다: ${tripContext?.destinationName || "해당 여행지"}에서는 대중교통 패스 이용과 피크 시간대를 피한 식사 방문을 추천드립니다. 추가 문의사항이 있으시면 언제든 물어보세요!`,
      });
    }

    const historyPrompt = history
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const prompt = `현재 생성된 여행 일정 요약:
- 여행지: ${tripContext?.destinationName} (${tripContext?.durationSummary})
- 타이틀: ${tripContext?.tripTitle}
- 하이라이트: ${tripContext?.highlights?.join(", ")}
- 일자별 요약: ${tripContext?.days?.map((day) => `Day ${day.dayNumber}: ${day.themeTitle} (${day.summary})`).join(" | ")}

이전 대화 기록:
${historyPrompt}

사용자 질문: ${message}

위 일정과 여행지 정보를 바탕으로 친절하고 구체적이며 유용한 현지 가이드로서 한국어로 간결하게 답변해주세요.`;

    // 대화형 Q&A는 짧고 빨라야 하므로 effort를 낮춘다.
    const reply = await ai.generateText({
      system:
        "당신은 10년 경력의 현지 여행 가이드이자 친절한 컨시어지 AI입니다. 여행자의 일정과 질문에 맞추어 실용적인 팁과 정확한 정보를 안내하세요.",
      prompt,
      effort: "low",
      maxTokens: 4000,
    });

    res.json({ reply });
  } catch (err: unknown) {
    console.error("Error in trip chat:", err);
    res.status(500).json({
      error: describeAiError(err, "Failed to generate chat response"),
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `AI Travel Route Planner Server running on http://0.0.0.0:${PORT}`,
    );
    console.log(describeAiSelection());
  });
}

startServer();

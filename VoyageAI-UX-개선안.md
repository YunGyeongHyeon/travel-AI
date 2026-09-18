# VoyageAI / BENTO PLANNER UX 개선안

**대상 사용자:** 윤경현  
**제품:** VoyageAI (BENTO PLANNER)  
**목적:** 소프트 블로그 프로모 전, 엔지니어링이 바로 구현할 수 있는 UI/카피·컴포넌트 스펙  
**범위:** 지도 API 키 *설정*이 아니라, **키 없음/로딩/오류** 시 사용자에게 보이는 UI  
**브랜드:** Purple primary (`#6B4EFF`) + Orange accents (`#FF8A00`), soft bento cards, 한국어 UI  

**작성일:** 2026-09-18 (KST)

---

## 목차

1. [Map placeholder/error UI](#1-map-placeholdererror-ui)
2. [AI itinerary generation loading/failure](#2-ai-itinerary-generation-loadingfailure)
3. [AI concierge streaming](#3-ai-concierge-streaming)
4. [Mobile home FAB](#4-mobile-home-fab)
5. [Login](#5-login)
6. [Empty favorites + credits](#6-empty-favorites--credits)
7. [Result scan layer](#7-result-scan-layer)
- [대비·계층 노트](#대비계층-노트-purpleorange-유지)
- [구현 우선순위 P0–P2](#구현-우선순위-p0p2)
- [카피·컴포넌트 체크리스트](#카피컴포넌트-체크리스트)
- [목업 파일 경로](#목업-파일-경로)

---

## 1) Map placeholder/error UI

### Before (문제)
- 개요 지도에 대각선 **「API KEY REQUIRED」** 워터마크가 반복 노출되어 기술적·불친절한 인상.
- 로딩/키 없음/실패 상태 구분이 없고, 재시도 CTA가 없음.
- **참조 스크린샷:** `before-overview-map.png`

### After (UI/카피 제안)
- 워터마크 **완전 제거**. 세 가지 명시적 상태:
  1. **Loading** — 지도 영역 skeleton + 중앙 칩 「지도를 불러오는 중」
  2. **Unavailable (키/타일 준비 불가)** — 친화 메시지 「지도를 잠시 준비 중이에요」 + **번호 목록 폴백**
  3. **Error** — 「지도를 불러오지 못했어요」 + **다시 시도** + 「번호 목록으로 보기」
- 지도가 없어도 Day 마커는 **①②③… 번호 리스트**로 동선 유지.
- **목업:** `after-map-states.png` (16:9, 3상태 병렬)

### Component specs

| State | Visual | Spacing | CTA |
|-------|--------|---------|-----|
| `map.loading` | 타일 영역 shimmer skeleton, 중앙 pill 칩, Day legend 유지 | 카드 radius 20px, 내부 padding 20px | CTA 없음 (자동) |
| `map.unavailable` | 아이콘 원형(지도) + 타이틀/설명 + fallback list | 리스트 item 세로 gap 8px, num badge 22×22 | 선택: 「상세 일정 보기」 |
| `map.error` | 경고 아이콘 + 타이틀/설명 | CTA 상단 margin 8px | Primary: **다시 시도** / Ghost: **번호 목록으로 보기** |

**Fallback list item:** `[번호 badge] 장소명` + `시간 · Day N`  
지도 복구 시 동일 번호로 핀 매핑.

### Suggested Korean copy (붙여넣기용)

```
maps.loading.chip=지도를 불러오는 중
maps.unavailable.title=지도를 잠시 준비 중이에요
maps.unavailable.body=지도 타일을 바로 보여드리기 어려워 아래 번호 순서로 동선을 확인하세요.
maps.error.title=지도를 불러오지 못했어요
maps.error.body=네트워크 또는 지도 서비스 문제로 타일을 표시할 수 없습니다.
maps.error.retry=다시 시도
maps.error.fallback=번호 목록으로 보기
maps.fallback.listTitle=오늘의 동선 (번호 순)
```

---

## 2) AI itinerary generation loading/failure

### Before (문제)
- 생성 중 진행 단계가 불명확하거나 단일 스피너만 존재할 수 있음.
- 실패 시 빈 화면/기술 메시지 → 이탈.

### After (UI/카피 제안)
- **Stepped progress modal/panel** (4단계):
  1. 여행지 조사 중  
  2. 동선 최적화 중  
  3. 예산·맛집 맞추는 중  
  4. 마무리  
- Progress bar (purple→orange gradient).  
- 하단 크레딧 칩: 「예상 소모 n 크레딧 · 잔여 m」  
- Failure: 액션 가능 메시지 + CTA **다시 시도 / 조건 수정 / 닫기** (blank 금지)  
- **목업:** `after-generation-loading.png` (4:3, 로딩 + 실패 사이드 노트)

### Component specs

| State | UI | CTA labels |
|-------|-----|------------|
| `gen.loading` | 4 step list (done ✓ / active pulse / pending dim), progress 0–100% | 선택: 「취소」 |
| `gen.success` | 자동 결과 화면 전환 | — |
| `gen.failure` | 에러 타이틀 + 1–2줄 원인(일반화) | **다시 시도** / **조건 수정** / **닫기** |

Spacing: panel width ~480–520px, radius 24px, step row padding 12×14, gap 14px.

### Suggested Korean copy

```
gen.title=AI가 일정을 만들고 있어요
gen.subtitle={destination} · {nights}박 {days}일 · {themes} · 예산 {budget}
gen.step1=여행지 조사 중
gen.step1.done=현지 스팟·영업시간·리뷰를 모았어요
gen.step2=동선 최적화 중
gen.step2.done=지리적 최적 경로로 날짜별 배치 완료
gen.step3=예산·맛집 맞추는 중
gen.step3.active=테마 맛집과 예산을 맞추고 있어요…
gen.step4=마무리
gen.step4.hint=요약 카드와 지도를 준비합니다
gen.eta=보통 20~40초 걸려요
gen.credits=예상 소모 {n} 크레딧 · 잔여 {m}
gen.fail.title=일정을 만들지 못했어요
gen.fail.body=일시적인 오류예요. 조건을 조금 바꾸거나 다시 시도해 주세요.
gen.fail.retry=다시 시도
gen.fail.edit=조건 수정
gen.fail.close=닫기
```

---

## 3) AI concierge streaming

### Before (문제)
- 스트리밍 중 원시 마크다운(`###`, `**`, `---`)이 그대로 보임.
- **참조:** `before-ai-concierge.png`

### After (UI/카피 제안)
- **Never show raw markdown mid-stream.**
- 옵션 A: 스트림을 **평문 단락**으로 표시 후 완료 시 한 번에 마크다운 렌더  
- 옵션 B (권장): **Progressive markdown render** — 완성된 블록만 렌더, 미완성 토큰은 버퍼  
- 대기 중: bubble 하단에 **skeleton lines** (2–3줄)  
- 완료 bubble: 헤더·리스트·볼드 정상 렌더  
- **목업:** `after-ai-streaming.png` (4:3)

### Component specs

| Phase | Behavior |
|-------|----------|
| `stream.waiting` | 아바타 + skeleton 3 lines, 「응답 작성 중」 chip |
| `stream.active` | 완성 블록만 DOM 반영; incomplete `###`/`**` 버퍼링 |
| `stream.done` | full markdown; skeleton 제거; timestamp |

Bubble: radius 16px, AI white / User `#2D2468`, max-width 85%.

### Suggested Korean copy

```
concierge.header=AI 현지 여행 가이드
concierge.subheader={city} 맞춤형 컨시어지
concierge.streaming=응답 작성 중
concierge.streaming.safe=응답 작성 중 · 마크다운 안전 렌더
concierge.error=답변을 가져오지 못했어요. 다시 물어봐 주세요.
concierge.retry=다시 생성
```

**엔지니어 메모:** 스트림 파서에서 heading/list/fence가 *닫히기 전*에는 plain text fallback 또는 버퍼. 사용자에게 `###`/`---`/`**` 문자열이 보이면 버그.

---

## 4) Mobile home FAB

### Before (문제)
- FAB 「AI 여행 비서에게 질문하기」가 목적지 pills와 **겹침** → 탭 불가.
- **참조:** `before-mobile-home.png`

### After (UI/카피 제안)
- `safe-area-inset-bottom` 반영.
- 스크롤 콘텐츠 `padding-bottom: 88–100px`.
- FAB을 **home indicator 위**에 고정 (`bottom: calc(34px + safe-area)` 권장).
- 선택: 스크롤 시 라벨 축소 → 아이콘-only (예: `✨`).
- **목업:** `after-mobile-home.png` (9:16)

### Component specs

| Token | Value |
|-------|-------|
| FAB height | 48–52px |
| FAB right | 16px |
| FAB bottom | `max(16px, safe-area) + homeIndicator(~34px)` → 실질 ~34–48px from bottom edge of content safe |
| Content `padding-bottom` | 88–100px |
| FAB bg | `#6B4EFF`, shadow `0 8px 24px rgba(107,78,255,0.4)` |
| Shrink on scroll | label hide, keep icon, width animate 200ms |

### Suggested Korean copy

```
fab.ask.full=✨ AI 여행 비서에게 질문하기
fab.ask.short=✨ AI 여행 비서
fab.ask.iconOnly=✨
```

---

## 5) Login

### Before (문제)
- 비밀번호 **eye toggle 없음**.
- 「비밀번호 찾기」 링크 없음.
- 가치 제안이 환영 문구에만 의존.
- **참조:** `before-login.png`

### After (UI/카피 제안)
- 비밀번호 필드 우측 **👁 eye toggle** (표시/숨김).
- 「비밀번호 찾기」 링크 (스텁 OK, 신뢰·전환용).
- 헤드라인 근처 value prop 강화:  
  **「여행 후기를 일정으로 바꿔주는 AI 플래너」**  
  환영 톤(「다시 오신 걸 환영합니다」) 유지.
- **목업:** `after-login.png` (4:3)

### Component specs

| Element | Spec |
|---------|------|
| Eye button | 32×32, bg `#F3F0FF`, icon purple, `aria-label="비밀번호 표시"` / `"비밀번호 숨기기"` |
| Forgot link | 12px, `#6B4EFF`, 비밀번호 필드 아래 우측 |
| Value line | 14px, `#6B4EFF`, weight 700, headline 바로 아래 |
| Primary CTA | 「로그인」 full-width purple |

### Suggested Korean copy

```
login.badge=로그인하면 생성한 일정이 로그로 남습니다
login.headline=다시 오신 걸 환영합니다
login.value=여행 후기를 일정으로 바꿔주는 AI 플래너
login.sub=일정을 만들고 언제든 다시 꺼내볼 수 있습니다.
login.email=이메일
login.email.ph=you@example.com
login.password=비밀번호
login.password.ph=6자 이상
login.password.show=비밀번호 표시
login.password.hide=비밀번호 숨기기
login.forgot=비밀번호 찾기
login.submit=로그인
login.signup.prompt=아직 계정이 없으신가요?
login.signup=회원가입
```

---

## 6) Empty favorites + credits

### Before (문제)
- 즐겨찾기 빈 상태: 안내만 있고 CTA가 「닫기」뿐 → 다음 행동 불명확.
- 크레딧 의미가 헤더 숫자만으로 전달되지 않음.
- **참조:** `before-favorites-empty.png`

### After (UI/카피 제안)
- Favorites empty **Primary CTA: 「일정 만들기」** → 홈/플래너.
- Secondary: 「닫기」 유지 가능.
- Credits: tooltip/popover  
  **「크레딧은 AI 일정 생성에 쓰여요」**  
- 생성 직전: **「예상 소모 n 크레딧 · 잔여 m」** 표시 (섹션 2와 동일 패턴).

### Component specs

| Component | States |
|-----------|--------|
| `FavoritesEmpty` | icon + title + body + Primary `일정 만들기` + Ghost `닫기` |
| `CreditsBadge` | default number / hover·tap → popover |
| `CreditsEstimate` | pre-generate chip near CTA |

Empty modal: 기존 「내 여행 로그」 구조 유지, 즐겨찾기 탭 활성 시 empty 교체.

### Suggested Korean copy

```
fav.empty.title=즐겨찾기한 일정이 없습니다.
fav.empty.body=마음에 드는 일정의 별표를 눌러보세요!
fav.empty.cta=일정 만들기
fav.empty.close=닫기
credits.tooltip=크레딧은 AI 일정 생성에 쓰여요
credits.estimate=예상 소모 {n} 크레딧 · 잔여 {m}
credits.insufficient=크레딧이 부족해요. 일정을 만들려면 {need} 크레딧이 필요해요.
```

---

## 7) Result scan layer

### Before (문제)
- 개요 화면이 지도·타임라인·예산 등으로 밀도가 높아, **첫 3초 스캔**이 어려움.

### After (UI/카피 제안)
- dense overview **위**에 **「오늘 핵심 동선」** 카드:
  - Top 3 stops (번호 + 장소명 + 짧은 시간)
  - **총 이동 시간** chip (기존 퍼플 요약과 연계)
- 기존 상세(지도·Day timeline·예산 등)는 **아래에 유지**.

### Component specs

| Element | Spec |
|---------|------|
| Card | bento white, radius 16–20, padding 16–20, margin-bottom 12–16 |
| Title | 「오늘 핵심 동선」 + optional Day chip |
| Stops | 3 rows max; overflow 「+N 더보기」 → Day timeline scroll |
| Move chip | purple or orange outline: 「총 이동 {duration}」 |
| Placement | Title/action row 아래, map grid **위** 또는 map과 나란히 상단 스팬 |

### Suggested Korean copy

```
scan.title=오늘 핵심 동선
scan.moveChip=총 이동 {duration}
scan.stopMeta={time} · {area}
scan.more=+{n} 더보기
scan.empty=오늘 확정된 스팟이 아직 없어요
```

---

## 대비·계층 노트 (Purple/Orange 유지)

| 역할 | 색 | 용도 |
|------|-----|------|
| Primary | `#6B4EFF` (purple) | CTA, 로고, 활성 step, 번호 badge, FAB |
| Accent | `#FF8A00` / `#FFD0A0` | 강조 chip, 진행 그라데이션 끝, 경고성 아닌 하이라이트, credits estimate warm chip |
| Text primary | `#2D2468` / `#1a1a2e` | 헤드라인·본문 |
| Text secondary | `#6b7280` | 설명 |
| Surface | `#FFFFFF` on `#E8ECF4` | bento cards |
| Danger soft | `#FFF1F0` + 문구는 중립적 | map/gen error 배경만, CTA는 여전히 purple |

**계층:** Headline(800) > Value/Section(700 purple) > Body(400–500 gray) > Meta(11–12px `#9ca3af`).  
에러도 **빨간 풀스크린 금지** — soft card + purple retry로 브랜드 톤 유지.

---

## 구현 우선순위 P0–P2

### P0 (프로모 전 필수)
1. **지도 상태 UI** — API KEY 워터마크 제거, loading/unavailable/error+retry, 번호 폴백  
2. **AI 생성 로딩·실패** — 4단계 진행 + 실패 CTA 3종 (blank 금지)  
3. **AI 컨시어지 스트림** — raw markdown 노출 차단 + skeleton  
4. **모바일 FAB** — overlap 제거 (padding-bottom + safe-area)

### P1 (전환·신뢰)
5. **Login** — eye toggle, 비밀번호 찾기, value prop 한 줄  
6. **Favorites empty CTA** — 「일정 만들기」  
7. **Credits tooltip + 생성 전 예상 소모 표기**

### P2 (스캔성·polish)
8. **Result scan layer** — 「오늘 핵심 동선」 top3 + 이동시간 chip  
9. FAB 스크롤 시 라벨 축소  
10. 지도 unavailable과 error의 마이크로카피 A/B

---

## 카피·컴포넌트 체크리스트

### 컴포넌트
- [ ] `MapCanvas` states: `loading` | `unavailable` | `error` | `ready`
- [ ] `MapFallbackList` (numbered)
- [ ] `GenerateProgressModal` (4 steps + bar + credits chip)
- [ ] `GenerateErrorPanel` (retry / edit / close)
- [ ] `ConciergeBubble` progressive markdown + skeleton
- [ ] `MobileFAB` safe-area aware
- [ ] `PasswordField` + eye toggle
- [ ] `ForgotPasswordLink` (stub OK)
- [ ] `FavoritesEmpty` + CTA `일정 만들기`
- [ ] `CreditsTooltip` / `CreditsEstimateChip`
- [ ] `TodayCoreRouteCard` (scan layer)

### 카피 키 (최소)
- [ ] `maps.*` (loading / unavailable / error / retry / fallback)
- [ ] `gen.step1–4` + `gen.fail.*`
- [ ] `concierge.streaming` / error
- [ ] `fab.ask.*`
- [ ] `login.value` / `login.forgot` / password show·hide
- [ ] `fav.empty.cta`
- [ ] `credits.tooltip` / `credits.estimate`
- [ ] `scan.title` / `scan.moveChip`

### QA
- [ ] 지도에 「API KEY REQUIRED」 문자열 **0건**
- [ ] 스트림 중 `###` `**` `---` 사용자 가시 **0건**
- [ ] 모바일에서 FAB과 destination pills 히트영역 겹침 **0**
- [ ] 생성 실패 시 빈 화면 **0** (항상 3 CTA 중 최소 재시도)
- [ ] 한국어 UI 톤: 친절·행동 유도, 기술 용어 최소화

---

## 목업 파일 경로

| 파일 | 설명 | 비율 |
|------|------|------|
| `/workspace/travel-ai-design/after-map-states.png` | 지도 loading / unavailable / error+retry 3열 | 16:9 |
| `/workspace/travel-ai-design/after-generation-loading.png` | 4단계 생성 로딩 + 실패 CTA 노트 | 4:3 |
| `/workspace/travel-ai-design/after-ai-streaming.png` | 컨시어지 안전 스트림 + skeleton | 4:3 |
| `/workspace/travel-ai-design/after-mobile-home.png` | FAB 비중첩 모바일 홈 | 9:16 |
| `/workspace/travel-ai-design/after-login.png` | eye toggle · 비밀번호 찾기 · value prop | 4:3 |

**가이드 문서:** `/workspace/travel-ai-design/VoyageAI-UX-개선안.md`

**Before 참조 (기존):**
- `before-login.png`, `before-home.png`, `before-overview-map.png`
- `before-ai-concierge.png`, `before-mobile-home.png`, `before-favorites-empty.png`

**목업 소스 (재생성용 HTML):** `/workspace/travel-ai-design/mockup-src/`

### 생성 방식 메모
- 환경에 **GenerateImage 동적 도구가 비활성**(`isGenerateImageEnabled=false`, MCP 카탈로그 비어 있음)이어서, before 스크린샷 스타일(퍼플/오렌지·벤토·한국어)에 맞춘 **HTML 목업 → Playwright/Chrome 스크린샷**으로 after PNG 5종을 제작함.
- 스타일 매칭을 위해 before 샷을 시각 레퍼런스로 사용함.

---

*VoyageAI / BENTO PLANNER · Design package for engineering handoff · 2026-09-18 KST*

# VoyageAI — AI 여행 일정 & 맛집 동선 플래너

여행 조건(목적지·기간·예산·테마)을 입력하면 Claude가 지리적 동선을 최적화한
일정을 만들어 주고, 생성한 일정은 자동으로 여행 로그에 보관됩니다.

## 구조

```
브라우저 ──POST /api/* (Supabase JWT)──> Express (server.ts)
                                          ├─ JWKS로 토큰 검증
                                          ├─ Claude API 호출
                                          └─ trip_logs 저장 (응답 전에)
브라우저 ──supabase-js (RLS)────────────> Supabase (로그 목록/즐겨찾기/삭제)
```

AI 호출은 **서버에서만** 합니다. API 키가 브라우저 번들에 들어가지 않도록
`ANTHROPIC_API_KEY`에는 `VITE_` 접두사를 붙이지 마세요.

## 준비물

- Node.js
- [Anthropic API 키](https://console.anthropic.com/)
- Supabase 프로젝트

## 로컬 실행

1. 의존성 설치

   ```bash
   npm install
   ```

2. 프로젝트 루트에 `.env` 작성

   ```
   # 둘 중 하나만 있어도 됩니다. 둘 다 있으면 무료인 Gemini를 먼저 씁니다.
   GEMINI_API_KEY=...
   ANTHROPIC_API_KEY=sk-ant-...
   # AI_PROVIDER=gemini   # gemini | claude — 명시하면 이쪽이 우선합니다

   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_JWKS_URL=https://<project>.supabase.co/auth/v1/.well-known/jwks.json

   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   `VITE_` 두 개만 브라우저로 나갑니다. 나머지는 서버 전용입니다.

3. Supabase SQL Editor에서 [`supabase/schema.sql`](supabase/schema.sql) 실행
   (`trip_logs` 테이블 + RLS 정책)

4. 개발 서버 실행

   ```bash
   npm run dev
   ```

`ANTHROPIC_API_KEY`가 없으면 AI를 호출하지 않고 큐레이션된 샘플 일정을
돌려주므로, 키 없이도 화면은 확인할 수 있습니다.

## Vercel 배포

로컬(`npm run dev` / `npm start`)은 그대로 Express가 프론트와 API를 같이 띄웁니다.
Vercel에서는 Vite 정적 파일과 `/api/*` 서버리스 함수가 같은 핸들러를 사용합니다.

프로젝트 루트를 Import한 뒤, 아래 환경변수를 Vercel Project Settings에 넣으세요.
로컬 `.env`와 이름이 같아야 합니다.

```
GEMINI_API_KEY
ANTHROPIC_API_KEY
AI_PROVIDER

SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_JWKS_URL

VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

`VITE_` 두 개는 빌드 시 프론트에 들어갑니다. 나머지는 서버리스 함수 전용입니다.
일정 생성은 시간이 걸릴 수 있어 API 타임아웃을 60초로 두었습니다. Hobby 플랜에서
배포가 거절되면 Pro로 올리거나 `vercel.json`의 `maxDuration`을 낮추면 됩니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Vite 미들웨어 + Express) |
| `npm run build` | 프론트 번들 + 서버 번들 |
| `npm start` | 프로덕션 실행 |
| `npm test` | 테스트 |
| `npm run lint` | 타입 체크 |
| `npm run check:schema` | 구조화 출력 스키마가 Anthropic 제약을 지키는지 검사 |

## AI 제공자 전환

Gemini와 Claude를 둘 다 지원하며 `AI_PROVIDER` 환경변수로 갈아끼웁니다.
지정하지 않으면 키가 있는 쪽을, 둘 다 있으면 **무료 티어가 있는 Gemini를** 씁니다.
아무 키도 없으면 데모 모드(견본 일정, 로그 저장 안 함)로 동작합니다.

기동 시 어느 쪽을 쓰는지 로그에 찍힙니다:

```
AI provider: gemini (gemini-3.6-flash) — 키 기준 자동 선택
```

| | Gemini ([server/gemini.ts](server/gemini.ts)) | Claude ([server/claude.ts](server/claude.ts)) |
|---|---|---|
| 모델 | `gemini-3.6-flash` | `claude-opus-5` |
| 비용 | 무료 티어 있음 | 선불 크레딧, 호출마다 과금 |
| JSON 보장 | JSON 모드만 (모양은 미보장) | 구조화 출력으로 스키마 강제 |
| 품질 조절 | `temperature` | `output_config.effort` |
| 재시도 | [server/retry.ts](server/retry.ts) 3회 (2s→4s→8s) | SDK 내장 4회 |

Gemini는 무료 티어 특성상 503(high demand)이 잦고 JSON이 중간에 끊기는 일이
있어, 두 경우 모두 재시도 대상입니다. Claude는 SDK가 자체 재시도를 하므로
바깥에서 겹쳐 걸지 않습니다.

호출 지점은 세 곳입니다.

| 엔드포인트 | 출력 | effort |
|---|---|---|
| `/api/generate-itinerary` | 일정 JSON | high |
| `/api/regenerate-spot` | 장소 1건 JSON | medium |
| `/api/trip-chat` | 자유 텍스트 | low |

Claude로 돌릴 때는 [구조화 출력 스키마](server/trip-plan-schema.ts)가 응답 모양을
보장합니다. 스키마를 고쳤다면 `npm run check:schema`로 먼저 확인하세요.

## 실패 처리

세 가지 상태를 구분합니다.

| 상황 | 동작 |
|---|---|
| 키 없음 | 견본 일정 표시 + 안내. **로그에 저장하지 않음** |
| 호출 실패 | 에러 메시지 + 다시 시도 버튼. 로그에 저장하지 않음 |
| 정상 | 일정 표시 + 로그 자동 저장 |

실패를 견본 일정으로 덮으면 사용자가 실패한 줄 모르고, 가짜 일정이 로그에
쌓입니다. 그래서 실패는 실패라고 알립니다.

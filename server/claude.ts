import Anthropic from "@anthropic-ai/sdk";
import { getErrorMessage } from "../src/lib/errors.js";
import type { AiCallInput, AiJsonInput, AiProvider } from "./ai-provider.js";

/**
 * Claude 어댑터.
 *
 * Gemini와 다른 점:
 *   - systemInstruction        → system (최상위 파라미터)
 *   - responseMimeType: json   → output_config.format (JSON Schema로 모양 보장)
 *   - temperature              → 없음. Opus 5에서는 보내면 400이다.
 *                                생성 다양성은 thinking + effort가 대신한다.
 *   - generateContent          → messages.stream() + finalMessage()
 */

const MODEL = "claude-opus-5";

/**
 * 429(한도)·5xx(과부하)·연결 오류에 대한 재시도 횟수.
 *
 * SDK가 지수 백오프까지 알아서 해주므로 server/retry.ts를 겹쳐 쓰면 안 된다.
 * 그러면 호출 수가 (바깥 횟수 × SDK 횟수)로 곱해진다. SDK 기본값은 2회다.
 */
const MAX_RETRIES = 4;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client = new Anthropic({ maxRetries: MAX_RETRIES });
  return client;
}

/** 응답에서 본문 텍스트만 뽑는다. thinking 블록이 앞에 올 수 있어 첫 블록을 그냥 쓰면 안 된다. */
function readText(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter(
      (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("")
    .trim();
}

function assertNotRefused(message: Anthropic.Beta.BetaMessage) {
  if (message.stop_reason === "refusal") {
    throw new Error(
      `Claude가 요청을 거절했습니다: ${message.stop_details?.explanation ?? "사유 미상"}`,
    );
  }
}

async function runStream(
  input: AiCallInput & { schema?: Record<string, unknown> },
): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const stream = anthropic.beta.messages.stream({
    model: MODEL,
    max_tokens: input.maxTokens ?? 32000,
    system: input.system,
    // Opus 5는 thinking이 기본 on이지만, 명시해 두는 편이 읽기 좋다.
    thinking: { type: "adaptive" },
    output_config: {
      effort: input.effort ?? "high",
      ...(input.schema
        ? { format: { type: "json_schema" as const, schema: input.schema } }
        : {}),
    },
    // 안전 분류기가 요청을 거절하면 서버가 알아서 다른 모델로 다시 태운다.
    // 여행 일정에서 거절이 날 일은 사실상 없으므로, 걸리적거리면 아래 두 줄만 지우면 된다.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: input.prompt }],
  });

  const message = await stream.finalMessage();
  assertNotRefused(message);

  const text = readText(message);
  if (!text) {
    throw new Error("Claude API가 빈 응답을 반환했습니다.");
  }
  return text;
}

/** APIError의 응답 본문에서 사람이 읽을 문장만 꺼낸다: { error: { message } } */
function readApiMessage(error: unknown): string | null {
  const body = (error as { error?: { error?: { message?: unknown } } })?.error;
  const message = body?.error?.message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

export const claudeProvider: AiProvider = {
  name: "claude",
  model: MODEL,

  isReady() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  /** 구조화 출력이 스키마를 강제하므로 파싱 실패를 걱정할 필요가 없다. */
  async generateJson(input: AiJsonInput): Promise<unknown> {
    const text = await runStream(input);
    return JSON.parse(text) as unknown;
  },

  async generateText(input: AiCallInput): Promise<string> {
    return runStream(input);
  },

  describeError(error: unknown, fallback: string): string {
    if (error instanceof Anthropic.RateLimitError) {
      return `요청 한도에 걸렸습니다 (${MAX_RETRIES}회 재시도 후에도 실패). 잠시 후 다시 시도해 주세요.`;
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return "AI 인증에 실패했습니다. ANTHROPIC_API_KEY를 확인해 주세요.";
    }
    if (error instanceof Anthropic.BadRequestError) {
      // 크레딧 부족이 대표적. 사유는 유용하지만 error.message는 응답 본문 JSON을
      // 통째로 담고 있어 그대로 띄우면 읽을 수가 없다. 안쪽 문장만 꺼낸다.
      return `AI 요청이 거부되었습니다: ${readApiMessage(error) ?? error.message}`;
    }
    if (
      error instanceof Anthropic.APIError &&
      error.status &&
      error.status >= 500
    ) {
      return `AI 서버가 불안정합니다 (${MAX_RETRIES}회 재시도 후에도 실패). 잠시 후 다시 시도해 주세요.`;
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return "AI 서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.";
    }
    return getErrorMessage(error, fallback);
  },
};

import { GoogleGenAI } from "@google/genai";
import { getErrorMessage } from "../src/lib/errors.js";
import { parseJsonUnknown } from "../src/lib/trip-plan.js";
import type {
  AiCallInput,
  AiJsonInput,
  AiProvider,
  Effort,
} from "./ai-provider.js";
import { isTransientError, withRetry } from "./retry.js";

const MODEL = "gemini-3.6-flash";

/** 무료 티어 503과 JSON 깨짐 대응. SDK가 자체 재시도를 하지 않아 여기서 감싼다. */
const RETRIES = 3;

/**
 * 첫 재시도까지 기다리는 시간. 이후 2배씩 늘어나므로 총 2s + 4s + 8s = 14초를 버틴다.
 *
 * 1초로 시작했더니 7초 만에 3회를 다 써버려서 "high demand" 구간을 넘기지 못했다.
 * 일정 생성 자체가 30초 이상 걸리는 작업이라, 이 정도 대기는 체감상 감수할 만하다.
 */
const RETRY_BASE_DELAY_MS = 2000;

/**
 * Gemini에는 effort가 없다. 대신 temperature로 옮긴다.
 * 낮은 effort = 덜 흔들리는 응답(챗봇), 높은 effort = 다양성 필요(일정 생성).
 */
const TEMPERATURE_BY_EFFORT: Record<Effort, number> = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
  xhigh: 0.8,
  max: 0.9,
};

/** 모델이 JSON을 만들다 만 경우. 재생성하면 대개 해결된다. */
class MalformedJsonError extends Error {
  constructor(cause: unknown) {
    super(`Gemini가 깨진 JSON을 반환했습니다: ${getErrorMessage(cause, "파싱 실패")}`);
    this.name = "MalformedJsonError";
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  client = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
  return client;
}

/** 재시도 없이 한 번만 호출한다. 재시도는 바깥에서 감싼다. */
async function callOnce(input: AiCallInput & { json: boolean }): Promise<string> {
  const ai = getClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: input.prompt,
    config: {
      systemInstruction: input.system,
      temperature: TEMPERATURE_BY_EFFORT[input.effort ?? "high"],
      ...(input.json ? { responseMimeType: "application/json" } : {}),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini API가 빈 응답을 반환했습니다.");
  }
  return text;
}

/**
 * 재시도 대상:
 *   - 429/5xx/네트워크 (과부하, 무료 티어 한도)
 *   - 깨진 JSON (생성이 비결정적이라 다시 뽑으면 대개 성공한다)
 * 재시도해도 소용없는 것: 400, 인증 실패, 잘못된 모델명
 */
function isWorthRetrying(error: unknown): boolean {
  return error instanceof MalformedJsonError || isTransientError(error);
}

function runWithRetry<T>(run: () => Promise<T>): Promise<T> {
  return withRetry(run, {
    retries: RETRIES,
    baseDelayMs: RETRY_BASE_DELAY_MS,
    isRetryable: isWorthRetrying,
    onRetry: (attempt, delayMs, error) => {
      console.warn(
        `[gemini] 재시도 ${attempt}/${RETRIES} (${delayMs}ms 후): ${getErrorMessage(error, "unknown")}`,
      );
    },
  });
}

export const geminiProvider: AiProvider = {
  name: "gemini",
  model: MODEL,

  isReady() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  /**
   * schema는 받지만 Gemini에는 넘기지 않는다.
   * Gemini의 responseSchema는 OpenAPI 방언이라 Claude용 JSON Schema를
   * 그대로 못 쓴다. JSON 모드만 켜므로 "JSON 비슷한 것"까지만 보장되고,
   * 실제로 배열이 끊긴 채 오는 일이 있다. 그래서 파싱 실패도 재시도 대상이다.
   */
  async generateJson(input: AiJsonInput): Promise<unknown> {
    return runWithRetry(async () => {
      const text = await callOnce({ ...input, json: true });
      try {
        return parseJsonUnknown(text);
      } catch (error) {
        throw new MalformedJsonError(error);
      }
    });
  },

  async generateText(input: AiCallInput): Promise<string> {
    return runWithRetry(() => callOnce({ ...input, json: false }));
  },

  describeError(error: unknown, fallback: string): string {
    if (error instanceof MalformedJsonError) {
      return `Gemini가 일정을 끝까지 만들지 못했습니다 (${RETRIES}회 재시도 후에도 실패). 조건을 조금 줄여서 다시 시도해 보세요.`;
    }

    const message = getErrorMessage(error, fallback);

    if (/\b429\b|quota|rate limit/i.test(message)) {
      return `Gemini 무료 티어 한도에 걸렸습니다 (${RETRIES}회 재시도 후에도 실패). 잠시 후 다시 시도해 주세요.`;
    }
    if (/\b503\b|overloaded|unavailable/i.test(message)) {
      return `Gemini 서버가 혼잡합니다 (${RETRIES}회 재시도 후에도 실패). 잠시 후 다시 시도해 주세요.`;
    }
    if (/API key|API_KEY_INVALID|401|403/i.test(message)) {
      return "AI 인증에 실패했습니다. GEMINI_API_KEY를 확인해 주세요.";
    }
    return message;
  },
};

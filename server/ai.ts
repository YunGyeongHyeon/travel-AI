import { getErrorMessage } from "../src/lib/errors.js";
import {
  resolveProviderName,
  type AiProvider,
  type AiProviderName,
} from "./ai-provider.js";
import { claudeProvider } from "./claude.js";
import { geminiProvider } from "./gemini.js";

const PROVIDERS: Record<AiProviderName, AiProvider> = {
  gemini: geminiProvider,
  claude: claudeProvider,
};

// undefined = 아직 안 정함, null = 쓸 수 있는 제공자 없음(데모 모드)
let resolved: AiProvider | null | undefined;

/**
 * 이번 프로세스가 쓸 AI 제공자. null이면 데모 모드로 빠진다.
 *
 * AI_PROVIDER로 명시했는데 그쪽 키가 없으면 다른 제공자로 몰래 넘어가지 않는다.
 * 조용히 바뀌면 어느 모델이 답한 건지 알 수 없게 된다.
 */
export function getAiProvider(): AiProvider | null {
  if (resolved !== undefined) return resolved;

  const name = resolveProviderName(process.env);
  if (!name) {
    resolved = null;
    return resolved;
  }

  const provider = PROVIDERS[name];
  if (!provider.isReady()) {
    console.warn(
      `AI_PROVIDER=${name} 이지만 해당 API 키가 없습니다. 데모 모드로 동작합니다.`,
    );
    resolved = null;
    return resolved;
  }

  resolved = provider;
  return resolved;
}

/**
 * 현재 제공자의 에러 해석기를 태운다.
 * catch 블록에서는 provider 변수가 스코프 밖인 경우가 많아 이 헬퍼를 쓴다.
 */
export function describeAiError(error: unknown, fallback: string): string {
  const provider = getAiProvider();
  return provider
    ? provider.describeError(error, fallback)
    : getErrorMessage(error, fallback);
}

/** 서버 기동 로그용 한 줄. */
export function describeAiSelection(): string {
  const provider = getAiProvider();
  if (!provider) {
    return "AI provider: 없음 (데모 모드 — 견본 일정만 반환, 로그에 저장하지 않음)";
  }
  const explicit = process.env.AI_PROVIDER ? "AI_PROVIDER 지정" : "키 기준 자동 선택";
  return `AI provider: ${provider.name} (${provider.model}) — ${explicit}`;
}

/** 테스트에서 환경변수를 바꿔가며 검증할 때 쓴다. */
export function resetAiProviderCache() {
  resolved = undefined;
}

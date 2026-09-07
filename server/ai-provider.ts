/**
 * AI 제공자 공통 인터페이스.
 *
 * Gemini는 무료 티어가 있어 평소 개발용으로 좋고, Claude는 유료지만
 * 구조화 출력으로 응답 모양이 보장된다. 둘 다 두고 환경변수로 갈아끼운다.
 *
 * 고르는 순서:
 *   1. AI_PROVIDER 환경변수 (gemini | claude)
 *   2. 없으면 키가 있는 쪽 (GEMINI_API_KEY 우선 — 무료라서)
 *   3. 둘 다 없으면 null → 데모 모드(견본 일정)
 */

export type AiProviderName = "gemini" | "claude";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export type AiCallInput = {
  system: string;
  prompt: string;
  /**
   * 품질/비용 힌트. 제공자마다 다르게 매핑된다.
   * Claude는 output_config.effort로, Gemini는 temperature로 옮긴다.
   */
  effort?: Effort;
  maxTokens?: number;
};

export type AiJsonInput = AiCallInput & {
  /** JSON Schema. Claude는 출력 강제에 쓰고, Gemini는 JSON 모드만 켠다. */
  schema: Record<string, unknown>;
};

export interface AiProvider {
  readonly name: AiProviderName;
  readonly model: string;
  /** 키가 설정되어 있는지. false면 호출부가 데모 모드로 빠진다. */
  isReady(): boolean;
  generateJson(input: AiJsonInput): Promise<unknown>;
  generateText(input: AiCallInput): Promise<string>;
  /** 사용자에게 보여줄 한국어 에러 문구로 바꾼다. */
  describeError(error: unknown, fallback: string): string;
}

/**
 * 어느 제공자를 쓸지 결정한다. 환경변수만 보는 순수 함수라 테스트하기 쉽다.
 * 알 수 없는 AI_PROVIDER 값은 무시하고 키 기준으로 넘어간다.
 */
export function resolveProviderName(
  env: Record<string, string | undefined>,
): AiProviderName | null {
  const requested = env.AI_PROVIDER?.trim().toLowerCase();

  if (requested === "gemini" || requested === "claude") {
    return requested;
  }
  if (requested) {
    console.warn(
      `알 수 없는 AI_PROVIDER 값입니다: "${requested}". 키를 보고 자동 선택합니다.`,
    );
  }

  // 무료 티어가 있는 Gemini를 먼저 본다.
  if (env.GEMINI_API_KEY) return "gemini";
  if (env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

/**
 * 지수 백오프 재시도.
 *
 * Gemini 무료 티어는 과부하 시 503을 자주 뱉는다. 한 번 실패했다고 바로
 * 포기하면 체감 실패율이 실제보다 훨씬 높아진다.
 *
 * Anthropic SDK는 자체 재시도를 갖고 있으므로 여기를 쓰지 않는다.
 * 둘 다 걸면 호출 수가 (바깥 × SDK)로 곱해진다.
 */

export type RetryOptions = {
  /** 최초 시도 외 추가 시도 횟수 */
  retries: number;
  /** 첫 대기 시간(ms). 시도마다 2배씩 늘어난다. */
  baseDelayMs?: number;
  isRetryable: (error: unknown) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  run: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const base = options.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      const isLast = attempt === options.retries;
      if (isLast || !options.isRetryable(error)) {
        throw error;
      }

      // 여러 클라이언트가 동시에 재시도하며 몰리지 않도록 지터를 섞는다.
      const delay = base * 2 ** attempt + Math.floor(Math.random() * 250);
      options.onRetry?.(attempt + 1, delay, error);
      await sleep(delay);
    }
  }

  throw lastError;
}

/** 과부하·한도·일시적 네트워크 오류인지. 400/401/403 같은 건 재시도해도 소용없다. */
export function isTransientError(error: unknown): boolean {
  const status = readStatus(error);
  if (status !== null) {
    return status === 429 || status === 408 || status >= 500;
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  return /\b(429|500|502|503|504)\b|overloaded|unavailable|temporarily|timeout|ETIMEDOUT|ECONNRESET|EAI_AGAIN/i.test(
    message,
  );
}

function readStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { status?: unknown; code?: unknown };
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.code === "number") return candidate.code;
  return null;
}

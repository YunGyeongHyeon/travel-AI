export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  // Supabase의 PostgrestError는 Error 인스턴스가 아니라 message를 가진 평범한 객체다.
  // 이걸 걸러내지 않으면 RLS 거부 같은 진짜 원인이 전부 fallback에 묻힌다.
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

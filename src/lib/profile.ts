import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";

/**
 * 개인정보 수정.
 *
 * 이 앱이 실제로 받는 개인정보는 회원가입 폼이 받는 세 가지가 전부다 —
 * 이름·이메일·비밀번호. 이름만 user_metadata에 있고 나머지는 auth.users의
 * 컬럼이라 별도 profiles 테이블이 없다. 그래서 전부 auth.updateUser로 처리한다.
 *
 * 수정에 성공하면 Supabase가 USER_UPDATED 이벤트를 쏘고,
 * auth-context의 onAuthStateChange가 user를 갱신한다.
 * 그래서 여기서 화면 상태를 직접 건드리지 않는다.
 */

/** user_metadata.name. 없으면 이메일 앞부분으로 대신한다. */
export function getProfileName(user: User | null): string {
  if (!user) return "";
  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "";
}

export async function updateProfileName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("이름을 입력해 주세요.");
  }

  const { error } = await getSupabase().auth.updateUser({
    data: { name: trimmed },
  });

  if (error) {
    throw new Error(getErrorMessage(error, "이름을 저장하지 못했습니다."));
  }
}

/**
 * 이메일 변경.
 *
 * 프로젝트에서 이메일 확인이 켜져 있으면 바로 바뀌지 않고 확인 메일이 나간다.
 * 이때 Supabase는 새 주소를 user.new_email에 담아 돌려준다.
 * 둘을 구분해서 알려주지 않으면 "바꿨는데 왜 그대로냐"는 오해가 생긴다.
 */
export async function updateEmail(
  email: string,
): Promise<{ needsConfirm: boolean }> {
  const trimmed = email.trim();
  if (!trimmed) {
    throw new Error("이메일을 입력해 주세요.");
  }

  const { data, error } = await getSupabase().auth.updateUser({
    email: trimmed,
  });

  if (error) {
    throw new Error(getErrorMessage(error, "이메일을 변경하지 못했습니다."));
  }

  return { needsConfirm: Boolean(data.user?.new_email) };
}

export const MIN_PASSWORD_LENGTH = 6;

export async function updatePassword(password: string): Promise<void> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  }

  const { error } = await getSupabase().auth.updateUser({ password });

  if (error) {
    throw new Error(getErrorMessage(error, "비밀번호를 변경하지 못했습니다."));
  }
}

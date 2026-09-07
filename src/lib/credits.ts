import { getSupabase } from "@/lib/supabase";

/**
 * 크레딧 잔액 조회.
 *
 * 읽기만 한다. 차감·환불은 서버가 service_role로만 하므로 여기에 없다.
 * 브라우저에서 잔액을 바꿀 수 있으면 크레딧 자체가 무의미해진다.
 *
 * 아직 supabase/credits.sql을 실행하지 않았으면 null을 돌려준다.
 * 그래야 크레딧을 안 붙인 상태에서도 화면이 그대로 돌아간다.
 */
export async function fetchCreditBalance(): Promise<number | null> {
  const { data, error } = await getSupabase()
    .from("user_credits")
    .select("balance")
    .maybeSingle();

  if (error) {
    // 테이블이 없는 경우(PGRST205)까지 에러로 띄우면 도입 전에 화면이 시끄럽다.
    console.warn("크레딧 잔액을 불러오지 못했습니다.", error.message);
    return null;
  }

  return data ? Number(data.balance) : null;
}

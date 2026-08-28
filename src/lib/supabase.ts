import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "VITE_SUPABASE_URL 또는 VITE_SUPABASE_PUBLISHABLE_KEY가 설정되지 않았습니다.",
    );
  }

  client = createClient(supabaseUrl, supabasePublishableKey);
  return client;
}

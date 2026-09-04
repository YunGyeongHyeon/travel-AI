import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";

type AuthContextValue = {
  user: User | null;
  /** 최초 세션 복원이 끝났는지. 이게 false인 동안은 로그인 여부를 판단하면 안 된다. */
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setIsReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsReady(true);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(
        getErrorMessage(error, "로그인에 실패했습니다. 다시 시도해 주세요."),
      );
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) {
        throw new Error(
          getErrorMessage(error, "회원가입에 실패했습니다. 다시 시도해 주세요."),
        );
      }
      // 이메일 확인이 켜져 있으면 세션 없이 유저만 생성된다.
      return { needsEmailConfirm: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      throw new Error(getErrorMessage(error, "로그아웃에 실패했습니다."));
    }
  }, []);

  const value = useMemo(
    () => ({ user, isReady, signIn, signUp, signOut }),
    [user, isReady, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}

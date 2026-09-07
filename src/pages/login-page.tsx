import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/auth-context";
import { getErrorMessage } from "@/lib/errors";
import { AlertBanner } from "@/components/alert-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup";

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate(redirectTo, { replace: true });
        return;
      }

      const { needsEmailConfirm } = await signUp(email, password, name);
      if (needsEmailConfirm) {
        setNotice(
          "인증 메일을 보냈습니다. 메일함에서 확인 후 로그인해 주세요.",
        );
        setMode("login");
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "요청을 처리하지 못했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
          <Sparkles className="size-3.5 text-amber-600" />
          <span>로그인하면 생성한 일정이 로그로 남습니다</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isLogin ? "다시 오신 걸 환영합니다" : "여행 로그 시작하기"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          {isLogin
            ? "일정을 만들고 언제든 다시 꺼내볼 수 있습니다."
            : "계정을 만들면 생성한 일정이 자동으로 보관됩니다."}
        </p>
      </div>

      {error && <AlertBanner message={error} onDismiss={() => setError(null)} />}
      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-md p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4"
      >
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="홍길동"
              autoComplete="name"
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6자 이상"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-auto rounded-full px-4 py-2.5 text-xs font-bold"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogIn className="w-3.5 h-3.5" />
          )}
          <span>{isLogin ? "로그인" : "회원가입"}</span>
        </Button>

        <p className="text-center text-[11px] text-slate-500">
          {isLogin ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </p>
      </form>
    </div>
  );
}

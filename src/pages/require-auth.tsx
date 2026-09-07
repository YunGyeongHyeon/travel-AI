import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth-context";

export function RequireAuth() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  // 세션 복원이 끝나기 전에 판단하면 새로고침할 때마다 로그인 화면이 번쩍인다.
  if (!isReady) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-40" />
        <p>로그인 상태를 확인하는 중입니다...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}

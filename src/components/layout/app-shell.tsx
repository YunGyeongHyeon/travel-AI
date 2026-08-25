import type { ReactNode } from "react";
import { Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  header: ReactNode;
  children: ReactNode;
  chatAction?: ReactNode;
};

export function AppShell({ header, children, chatAction }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {header}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {children}
      </main>
      {chatAction}
      <footer className="border-t border-slate-200/80 bg-white py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-amber-500" />
            <span className="font-bold text-slate-700">
              AI 여행 일정 & 맛집 동선 플래너
            </span>
          </div>
          <p>AI 기반 실시간 지도 연동 및 지리적 최적 동선 알고리즘 적용</p>
        </div>
      </footer>
    </div>
  );
}

type FloatingChatButtonProps = {
  onClick: () => void;
};

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 h-auto rounded-full px-4 py-3.5 text-xs sm:text-sm font-extrabold shadow-2xl hover:scale-105"
    >
      <span className="size-2.5 rounded-full bg-emerald-400 animate-ping" />
      <Sparkles className="size-4 text-amber-400" />
      AI 여행 비서에게 질문하기
    </Button>
  );
}

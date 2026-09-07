import type { ReactNode } from "react";
import { Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  header: ReactNode;
  children: ReactNode;
  chatAction?: ReactNode;
  /** 일정 생성 중처럼 화면 전체를 잠가야 할 때. */
  blockingMessage?: string | null;
};

export function AppShell({
  header,
  children,
  chatAction,
  blockingMessage,
}: AppShellProps) {
  const isBlocked = Boolean(blockingMessage);

  return (
    <>
      {/*
        inert는 클릭뿐 아니라 포커스·탭 이동·스크린리더 접근까지 막는다.
        오버레이만 덮으면 Tab으로 뒤쪽 버튼에 닿아 조작이 된다.
      */}
      <div inert={isBlocked} aria-busy={isBlocked}>
        <AppShellContent header={header} chatAction={chatAction}>
          {children}
        </AppShellContent>
      </div>

      {isBlocked && <BlockingOverlay message={blockingMessage!} />}
    </>
  );
}

/**
 * 화면 전체를 덮는 진행 표시.
 * 모달(z-50)보다 위에 둔다 — 생성 중에는 모달도 만지면 안 된다.
 */
function BlockingOverlay({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-indigo-50">
          <div className="size-7 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">{message}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          동선과 맛집을 함께 계산하느라 1분 남짓 걸릴 수 있습니다.
          <br />
          창을 닫지 말고 잠시만 기다려 주세요.
        </p>
      </div>
    </div>
  );
}

function AppShellContent({
  header,
  children,
  chatAction,
}: Omit<AppShellProps, "blockingMessage">) {
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

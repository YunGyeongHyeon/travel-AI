import { useEffect, useState, type ReactNode } from "react";
import { Check, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  header: ReactNode;
  children: ReactNode;
  chatAction?: ReactNode;
  /** 일정 생성 중처럼 화면 전체를 잠가야 할 때. */
  blockingMessage?: string | null;
  /** 생성 중 표시할 부제 (목적지 · N박 M일 등) */
  blockingSubtitle?: string | null;
  /** 예상 소모 / 잔여 크레딧 */
  creditsEstimate?: { cost: number; remaining: number | null } | null;
  /** 생성 실패 패널 (blank 금지) */
  generateError?: {
    title?: string;
    body?: string;
    onRetry?: () => void;
    onEdit?: () => void;
    onClose?: () => void;
  } | null;
};

const GEN_STEPS = [
  { label: "여행지 조사 중", done: "현지 스팟·영업시간·리뷰를 모았어요" },
  { label: "동선 최적화 중", done: "지리적 최적 경로로 날짜별 배치 완료" },
  { label: "예산·맛집 맞추는 중", active: "테마 맛집과 예산을 맞추고 있어요…" },
  { label: "마무리", hint: "요약 카드와 지도를 준비합니다" },
];

export function AppShell({
  header,
  children,
  chatAction,
  blockingMessage,
  blockingSubtitle,
  creditsEstimate,
  generateError,
}: AppShellProps) {
  const isBlocked = Boolean(blockingMessage);

  return (
    <>
      <div inert={isBlocked || Boolean(generateError)} aria-busy={isBlocked}>
        <AppShellContent header={header} chatAction={chatAction}>
          {children}
        </AppShellContent>
      </div>

      {isBlocked && (
        <GenerateProgressOverlay
          title={blockingMessage!}
          subtitle={blockingSubtitle}
          creditsEstimate={creditsEstimate}
        />
      )}

      {!isBlocked && generateError && (
        <GenerateErrorOverlay error={generateError} />
      )}
    </>
  );
}

function GenerateProgressOverlay({
  title,
  subtitle,
  creditsEstimate,
}: {
  title: string;
  subtitle?: string | null;
  creditsEstimate?: { cost: number; remaining: number | null } | null;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers = [
      window.setTimeout(() => setStep(1), 3500),
      window.setTimeout(() => setStep(2), 9000),
      window.setTimeout(() => setStep(3), 16000),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [title]);

  const progress = Math.min(95, 12 + step * 28);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-[520px] rounded-[24px] bg-white p-6 sm:p-7 shadow-2xl">
        <p className="text-center text-sm font-black text-slate-900">{title}</p>
        {subtitle && (
          <p className="mt-1 text-center text-[11px] text-slate-500">{subtitle}</p>
        )}
        <p className="mt-1 text-center text-[11px] text-slate-400">
          보통 20~40초 걸려요
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6B4EFF, #FF8A00)",
            }}
          />
        </div>

        <ol className="mt-5 space-y-3.5">
          {GEN_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li
                key={s.label}
                className={`flex items-start gap-3 rounded-2xl px-3.5 py-3 ${
                  active ? "bg-violet-50" : done ? "bg-slate-50" : "opacity-50"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    done
                      ? "bg-[#6B4EFF] text-white"
                      : active
                        ? "bg-white text-[#6B4EFF] ring-2 ring-[#6B4EFF] animate-pulse"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-xs font-bold ${
                      active ? "text-[#6B4EFF]" : "text-slate-800"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {done
                      ? s.done
                      : active
                        ? s.active || s.hint || "진행 중…"
                        : s.hint || "대기"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {creditsEstimate && (
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center rounded-full border border-orange-200 bg-[#FFF7ED] px-3 py-1.5 text-[11px] font-bold text-[#C2410C]">
              예상 소모 {creditsEstimate.cost} 크레딧
              {creditsEstimate.remaining !== null &&
                creditsEstimate.remaining !== undefined &&
                ` · 잔여 ${creditsEstimate.remaining}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function GenerateErrorOverlay({
  error,
}: {
  error: NonNullable<AppShellProps["generateError"]>;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-[480px] rounded-[24px] bg-white p-7 text-center shadow-2xl">
        <p className="text-sm font-black text-slate-900">
          {error.title ?? "일정을 만들지 못했어요"}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {error.body ??
            "일시적인 오류예요. 조건을 조금 바꾸거나 다시 시도해 주세요."}
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          {error.onRetry && (
            <Button
              type="button"
              className="rounded-full bg-[#6B4EFF] hover:bg-[#5a3ee6]"
              onClick={error.onRetry}
            >
              다시 시도
            </Button>
          )}
          {error.onEdit && (
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={error.onEdit}
            >
              조건 수정
            </Button>
          )}
          {error.onClose && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={error.onClose}
            >
              닫기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AppShellContent({
  header,
  children,
  chatAction,
}: Omit<
  AppShellProps,
  "blockingMessage" | "blockingSubtitle" | "creditsEstimate" | "generateError"
>) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {header}
      {/* FAB overlap 방지: 모바일에서 하단 여백 88–100px */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-[92px] sm:pb-8">
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
      className="fixed right-4 z-40 h-auto min-h-12 rounded-full px-4 py-3 text-xs sm:text-sm font-extrabold shadow-[0_8px_24px_rgba(107,78,255,0.4)] hover:scale-105 bg-[#6B4EFF] hover:bg-[#5a3ee6] bottom-[max(1rem,calc(env(safe-area-inset-bottom,0px)+2rem))]"
    >
      <span className="size-2.5 rounded-full bg-emerald-400 animate-ping" />
      <Sparkles className="size-4 text-amber-300" />
      <span className="sm:hidden">✨ AI 여행 비서</span>
      <span className="hidden sm:inline">✨ AI 여행 비서에게 질문하기</span>
    </Button>
  );
}

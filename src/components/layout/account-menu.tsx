import { Link } from "react-router-dom";
import { ChevronDown, Coins, LogOut, Plus, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  email: string;
  name?: string | null;
  /** null이면 크레딧을 도입하지 않은 상태라 크레딧 영역을 통째로 감춘다. */
  credits: number | null;
  onSignOut: () => void;
  onTopUp?: () => void;
}

export function AccountMenu({
  email,
  name,
  credits,
  onSignOut,
  onTopUp,
}: AccountMenuProps) {
  const displayName = name?.trim() || email.split("@")[0];
  const initial = (displayName[0] ?? "?").toUpperCase();
  const hasCredits = credits !== null && credits !== undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={email}
        aria-label="계정 메뉴"
        className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 text-xs font-bold text-slate-600 shadow-xs transition-colors outline-none hover:border-indigo-200 hover:bg-slate-50 focus-visible:border-indigo-400 focus-visible:ring-3 focus-visible:ring-indigo-100 data-[state=open]:border-indigo-200 data-[state=open]:bg-slate-50"
      >
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate xl:inline 2xl:max-w-[12rem]">
          {email}
        </span>
        {hasCredits && (
          <span
            title="크레딧은 AI 일정 생성에 쓰여요"
            className="hidden sm:inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200"
          >
            <Coins className="size-3" />
            {credits}
          </span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="min-w-0">
          <p className="truncate text-xs font-black text-slate-900">
            {displayName}
          </p>
          <p className="truncate text-[11px] font-medium text-slate-500">
            {email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/account">
            <UserCog className="text-indigo-600" />
            개인정보 관리
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onSelect={onSignOut}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>

        {hasCredits && (
          <>
            <DropdownMenuSeparator />

            <div
              title="크레딧은 AI 일정 생성에 쓰여요"
              className={`mx-0.5 flex flex-col gap-1 rounded-xl border px-2.5 py-2 ${
                credits === 0
                  ? "border-rose-200 bg-rose-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex items-center gap-1.5 text-[11px] font-bold ${
                    credits === 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  <Coins className="size-3.5 shrink-0" />
                  남은 크레딧
                </span>
                <span
                  className={`text-sm font-black ${
                    credits === 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {credits}
                  <span className="ml-0.5 text-[11px] font-bold">개</span>
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500">
                크레딧은 AI 일정 생성에 쓰여요
              </p>
            </div>

            <DropdownMenuItem
              disabled={!onTopUp}
              onSelect={onTopUp}
              title={
                onTopUp
                  ? "크레딧을 충전합니다"
                  : "결제 기능은 아직 준비 중입니다"
              }
              className="mt-1 justify-between"
            >
              <span className="flex items-center gap-2">
                <Plus className="text-indigo-600" />
                크레딧 충전
              </span>
              {!onTopUp && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                  준비 중
                </span>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

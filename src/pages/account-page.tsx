import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Coins,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Receipt,
  UserCog,
} from "lucide-react";
import type { CreditTransaction } from "@/types";
import { useAuth } from "@/hooks/auth-context";
import { useTripPlannerContext } from "@/hooks/trip-planner-context";
import {
  describeCreditReason,
  fetchCreditTransactions,
  formatTransactionTime,
  summarizeCredits,
} from "@/lib/credit-history";
import {
  MIN_PASSWORD_LENGTH,
  getProfileName,
  updateEmail,
  updatePassword,
  updateProfileName,
} from "@/lib/profile";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type FieldStatus = { type: "success" | "error"; message: string } | null;

function StatusMessage({ status }: { status: FieldStatus }) {
  if (!status) return null;

  const isError = status.type === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`text-[11px] font-semibold ${
        isError ? "text-rose-600" : "text-emerald-600"
      }`}
    >
      {status.message}
    </p>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof UserCog;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[32px] border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <Icon className="size-4 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** 이름은 user_metadata에만 있어 즉시 반영된다. */
function NameForm({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FieldStatus>(null);

  // 다른 탭에서 바꿨거나 세션이 늦게 복원되면 currentName이 뒤늦게 들어온다.
  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const isUnchanged = name.trim() === currentName.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);
    try {
      await updateProfileName(name);
      setStatus({ type: "success", message: "이름을 저장했습니다." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "이름을 저장하지 못했습니다."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="account-name">이름</Label>
      <div className="flex items-center gap-2">
        <Input
          id="account-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="홍길동"
          autoComplete="name"
          required
        />
        <Button
          type="submit"
          disabled={isSaving || isUnchanged || !name.trim()}
          className="h-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-bold"
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          저장
        </Button>
      </div>
      <StatusMessage status={status} />
    </form>
  );
}

/** 이메일은 프로젝트 설정에 따라 확인 메일을 거칠 수도, 즉시 바뀔 수도 있다. */
function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FieldStatus>(null);

  useEffect(() => {
    setEmail(currentEmail);
  }, [currentEmail]);

  const isUnchanged = email.trim().toLowerCase() === currentEmail.toLowerCase();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setIsSaving(true);
    try {
      const { needsConfirm } = await updateEmail(email);
      setStatus({
        type: "success",
        message: needsConfirm
          ? "새 주소로 확인 메일을 보냈습니다. 확인 전까지는 기존 이메일로 로그인해 주세요."
          : "이메일을 변경했습니다. 다음 로그인부터 새 주소를 사용하세요.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "이메일을 변경하지 못했습니다."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Label htmlFor="account-email">이메일</Label>
      <div className="flex items-center gap-2">
        <Input
          id="account-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={isSaving || isUnchanged || !email.trim()}
          className="h-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-bold"
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          변경
        </Button>
      </div>
      <StatusMessage status={status} />
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<FieldStatus>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    // 서버에 보내기 전에 막는다. 오타로 바꾼 비밀번호는 되돌릴 방법이 없다.
    if (password !== confirm) {
      setStatus({ type: "error", message: "두 비밀번호가 서로 다릅니다." });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setStatus({ type: "success", message: "비밀번호를 변경했습니다." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "비밀번호를 변경하지 못했습니다."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="account-password">새 비밀번호</Label>
        <Input
          id="account-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="account-password-confirm">새 비밀번호 확인</Label>
        <Input
          id="account-password-confirm"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="한 번 더 입력"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusMessage status={status} />
        <Button
          type="submit"
          variant="secondary"
          disabled={isSaving || !password || !confirm}
          className="h-auto ml-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-bold"
        >
          {isSaving && <Loader2 className="size-3.5 animate-spin" />}
          비밀번호 변경
        </Button>
      </div>
    </form>
  );
}

function TransactionRow({ transaction }: { transaction: CreditTransaction }) {
  const { label, hint, tone } = describeCreditReason(transaction);
  const isEarn = tone === "earn";

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-800">{label}</p>
        <p className="truncate text-[11px] text-slate-400">
          {formatTransactionTime(transaction.createdAt)}
          {hint && ` • ${hint}`}
        </p>
      </div>
      <span
        className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${
          isEarn
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {isEarn ? "+" : "−"}
        {Math.abs(transaction.amount)}
      </span>
    </li>
  );
}

/**
 * 잔액 + 충전 + 원장.
 *
 * 잔액은 user_credits에서, 내역은 credit_transactions에서 온다.
 * 원장을 합산해 잔액을 만들지 않는 이유는 100건만 내려받기 때문이다 —
 * 잘린 목록으로 계산하면 잔액이 틀린다.
 */
function CreditPanel({
  credits,
  onTopUp,
}: {
  credits: number | null;
  onTopUp?: () => void;
}) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTransactions(await fetchCreditTransactions());
    } catch (err) {
      setError(getErrorMessage(err, "크레딧 사용 내역을 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { earned, spent } = summarizeCredits(transactions);

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-[32px] border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <Coins className="size-3.5" />
              남은 크레딧
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {credits ?? "—"}
              <span className="ml-1 text-sm font-bold text-slate-400">개</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-emerald-600">
              적립 +{earned}
            </p>
            <p className="text-[11px] font-bold text-slate-500">사용 −{spent}</p>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          여행 일정을 한 번 생성할 때마다 크레딧 1개를 사용합니다. AI가 응답하지
          못하면 자동으로 되돌려 드립니다.
        </p>

        <Button
          onClick={onTopUp}
          disabled={!onTopUp}
          title={onTopUp ? "크레딧을 충전합니다" : "결제 기능은 아직 준비 중입니다"}
          className="w-full h-auto rounded-full px-4 py-3 text-xs font-bold"
        >
          <Plus className="size-3.5" />
          크레딧 충전
          {!onTopUp && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
              준비 중
            </span>
          )}
        </Button>
      </section>

      <SectionCard
        icon={Receipt}
        title="크레딧 사용 내역"
        description="충전·사용·환불이 일어난 순서대로 남습니다."
      >
        {isLoading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            <Loader2 className="mx-auto mb-2 size-6 animate-spin opacity-40" />
            내역을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="space-y-3 py-6 text-center">
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {error}
            </p>
            <Button
              variant="secondary"
              onClick={() => void load()}
              className="h-auto rounded-full px-4 py-2 text-xs font-bold"
            >
              다시 시도
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            아직 크레딧 사용 내역이 없습니다.
          </p>
        ) : (
          <ScrollArea className="max-h-[26rem]">
            <ul className="space-y-2 pr-3">
              {transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </SectionCard>
    </div>
  );
}

export function AccountPage() {
  const { user } = useAuth();
  const { credits, refreshCredits } = useTripPlannerContext();

  // 다른 화면에서 일정을 만들고 넘어왔을 수 있다. 들어올 때 한 번 맞춘다.
  useEffect(() => {
    void refreshCredits();
  }, [refreshCredits]);

  const email = user?.email ?? "";
  const name = getProfileName(user);
  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            마이페이지
          </h2>
          <p className="text-xs text-slate-500">
            {email}
            {joinedAt && ` • ${joinedAt} 가입`}
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="h-auto shrink-0 rounded-full px-4 py-2.5 text-xs font-bold"
        >
          <Link to="/">
            <ArrowLeft className="size-3.5" />
            여행 계획으로
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <SectionCard
            icon={UserCog}
            title="기본 정보"
            description="일정과 로그에 함께 표시되는 이름입니다."
          >
            <NameForm currentName={name} />
          </SectionCard>

          <SectionCard
            icon={Mail}
            title="이메일"
            description="로그인에 사용하는 주소입니다."
          >
            <EmailForm currentEmail={email} />
          </SectionCard>

          <SectionCard
            icon={KeyRound}
            title="비밀번호"
            description="변경 후에도 지금 로그인은 그대로 유지됩니다."
          >
            <PasswordForm />
          </SectionCard>
        </div>

        <div className="lg:col-span-5">
          <CreditPanel credits={credits} />
        </div>
      </div>
    </div>
  );
}

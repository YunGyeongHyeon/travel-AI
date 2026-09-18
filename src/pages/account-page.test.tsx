import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AccountPage } from "@/pages/account-page";

const client = vi.hoisted(() => ({
  from: vi.fn(),
  auth: { updateUser: vi.fn() },
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => client,
}));

const authState = vi.hoisted(() => ({
  user: {
    id: "user-1",
    email: "traveler@example.com",
    created_at: "2026-08-01T00:00:00.000Z",
    user_metadata: { name: "김여행" },
  } as Record<string, unknown> | null,
}));

vi.mock("@/hooks/auth-context", () => ({
  useAuth: () => ({ user: authState.user, isReady: true }),
}));

const plannerState = vi.hoisted(() => ({
  credits: 8 as number | null,
  refreshCredits: vi.fn(),
}));

vi.mock("@/hooks/trip-planner-context", () => ({
  useTripPlannerContext: () => plannerState,
}));

function mockTransactions(rows: Record<string, unknown>[]) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  client.from.mockReturnValue({ select });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  plannerState.credits = 8;
  client.auth.updateUser.mockResolvedValue({ data: { user: {} }, error: null });
  mockTransactions([]);
});

describe("AccountPage", () => {
  it("지금 받고 있는 개인정보를 그대로 채워 보여준다", async () => {
    renderPage();

    expect(await screen.findByLabelText("이름")).toHaveValue("김여행");
    expect(screen.getByLabelText("이메일")).toHaveValue("traveler@example.com");
    expect(screen.getByLabelText("새 비밀번호")).toHaveValue("");
  });

  it("잔액과 크레딧 사용 내역을 함께 보여준다", async () => {
    mockTransactions([
      {
        id: "tx-1",
        amount: 3,
        reason: "signup",
        trip_log_id: null,
        payment_id: null,
        created_at: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "tx-2",
        amount: -1,
        reason: "generate",
        trip_log_id: null,
        payment_id: null,
        created_at: "2026-09-04T08:15:22.128Z",
      },
    ]);

    renderPage();

    expect(await screen.findByText("가입 축하 크레딧")).toBeInTheDocument();
    expect(screen.getByText("여행 일정 생성")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("−1")).toBeInTheDocument();
    expect(screen.getByText("적립 +3")).toBeInTheDocument();
    expect(screen.getByText("사용 −1")).toBeInTheDocument();
  });

  it("내역이 없으면 빈 상태를 알려준다", async () => {
    renderPage();

    expect(
      await screen.findByText("아직 크레딧 사용 내역이 없습니다."),
    ).toBeInTheDocument();
  });

  it("조회에 실패하면 다시 시도할 수 있게 남긴다", async () => {
    const limit = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "권한이 없습니다" } });
    client.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit }) }),
    });

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("권한이 없습니다");
    expect(
      screen.getByRole("button", { name: "다시 시도" }),
    ).toBeInTheDocument();
  });

  it("결제를 붙이기 전이라 충전 버튼은 눌리지 않는다", async () => {
    renderPage();

    const topUp = await screen.findByRole("button", { name: /크레딧 충전/ });
    expect(topUp).toBeDisabled();
    expect(within(topUp).getByText("준비 중")).toBeInTheDocument();
  });

  it("이름을 저장하면 user_metadata를 갱신한다", async () => {
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByLabelText("이름");
    await user.clear(nameInput);
    await user.type(nameInput, "윤경현");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(client.auth.updateUser).toHaveBeenCalledWith({
        data: { name: "윤경현" },
      });
    });
    expect(await screen.findByText("이름을 저장했습니다.")).toBeInTheDocument();
  });

  it("바뀐 게 없으면 저장 버튼을 잠가 둔다", async () => {
    renderPage();

    await screen.findByLabelText("이름");
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("확인 메일이 필요한 이메일 변경은 그 사실을 알려준다", async () => {
    const user = userEvent.setup();
    client.auth.updateUser.mockResolvedValue({
      data: { user: { new_email: "next@example.com" } },
      error: null,
    });
    renderPage();

    const emailInput = await screen.findByLabelText("이메일");
    await user.clear(emailInput);
    await user.type(emailInput, "next@example.com");
    await user.click(screen.getByRole("button", { name: "변경" }));

    expect(
      await screen.findByText(/새 주소로 확인 메일을 보냈습니다/),
    ).toBeInTheDocument();
  });

  it("비밀번호 확인이 다르면 서버를 부르지 않는다", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText("새 비밀번호"), "secret123");
    await user.type(screen.getByLabelText("새 비밀번호 확인"), "secret124");
    await user.click(screen.getByRole("button", { name: "비밀번호 변경" }));

    expect(
      await screen.findByText("두 비밀번호가 서로 다릅니다."),
    ).toBeInTheDocument();
    expect(client.auth.updateUser).not.toHaveBeenCalled();
  });
});

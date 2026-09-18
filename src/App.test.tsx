import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createMockTrip } from "@/test/fixtures";

vi.mock("@/components/trip/interactive-map", () => ({
  InteractiveMap: () => <div data-testid="interactive-map" />,
}));

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  isReady: true,
}));

vi.mock("@/hooks/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    ...authState,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@/lib/credits", () => ({
  fetchCreditBalance: vi.fn().mockResolvedValue(3),
}));

vi.mock("@/lib/trip-logs", () => ({
  fetchTripLogs: vi.fn().mockResolvedValue([]),
  fetchTripLog: vi.fn(),
  setTripLogFavorite: vi.fn(),
  deleteTripLog: vi.fn(),
  updateTripLogPlan: vi.fn(),
  migrateLegacyTrips: vi.fn().mockResolvedValue(0),
}));

function signIn() {
  authState.user = { id: "user-1", email: "traveler@example.com" };
  authState.isReady = true;
}

beforeEach(() => {
  authState.user = null;
  authState.isReady = true;
});

describe("App routes", () => {
  it("로그인하지 않으면 메인 대신 로그인 화면을 보여준다", async () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "다시 오신 걸 환영합니다" }),
      ).toBeInTheDocument();
    });
  });

  it("세션을 확인하는 동안에는 로그인 화면으로 튕기지 않는다", async () => {
    authState.isReady = false;
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(
      screen.getByText("로그인 상태를 확인하는 중입니다..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "다시 오신 걸 환영합니다" }),
    ).not.toBeInTheDocument();
  });

  it("로그인하면 메인(/)에 여행 조건 입력 화면을 보여준다", async () => {
    signIn();
    window.history.pushState({}, "", "/");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "나만의 완벽한 여행 일정을 만들어보세요",
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("slider", { name: "희망 여행 경비" }),
    ).toBeInTheDocument();
  });

  it("일정이 없으면 /plan에서 메인으로 보낸다", async () => {
    signIn();
    window.history.pushState({}, "", "/plan");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "나만의 완벽한 여행 일정을 만들어보세요",
        }),
      ).toBeInTheDocument();
    });
  });

  it("세션에 남은 현재 일정이 있으면 /plan에서 전체 계획을 보여준다", async () => {
    signIn();
    sessionStorage.setItem(
      "ai_travel_current_trip",
      JSON.stringify({ logId: "log-1", plan: createMockTrip() }),
    );
    window.history.pushState({}, "", "/plan");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Day 1 Timeline")).toBeInTheDocument();
    });
    expect(screen.getByText("Budget Tracker")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상세 일정" })).toBeInTheDocument();
  });

  it("로그인하면 상단에 여행 로그 버튼과 계정 메뉴가 보인다", async () => {
    signIn();
    window.history.pushState({}, "", "/");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /여행 로그/ }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("traveler@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 메뉴" })).toBeInTheDocument();
  });

  it("로그아웃과 크레딧은 헤더에 늘어놓지 않고 계정 메뉴 안에 둔다", async () => {
    signIn();
    window.history.pushState({}, "", "/");
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "계정 메뉴" }),
      ).toBeInTheDocument();
    });

    // 메뉴를 열기 전에는 헤더에 노출되지 않는다.
    expect(screen.queryByRole("menuitem", { name: "로그아웃" })).toBeNull();
    expect(
      screen.queryByTitle("남은 크레딧 3개 — 일정 1건 생성에 1개 필요"),
    ).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));

    expect(
      await screen.findByRole("menuitem", { name: "개인정보 관리" }),
    ).toHaveAttribute("href", "/account");
    expect(
      screen.getByRole("menuitem", { name: "로그아웃" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("남은 크레딧 3개 — 일정 1건 생성에 1개 필요"),
    ).toBeInTheDocument();
  });
});

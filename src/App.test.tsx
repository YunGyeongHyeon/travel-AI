import { render, screen } from "@testing-library/react";
import App from "@/App";
import { createMockTrip } from "@/test/fixtures";

vi.mock("@/components/trip/interactive-map", () => ({
  InteractiveMap: () => <div data-testid="interactive-map" />,
}));

describe("App routes", () => {
  it("메인(/)에 여행 조건 입력 화면을 보여준다", () => {
    window.history.pushState({}, "", "/");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "나만의 완벽한 여행 일정을 만들어보세요",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "희망 여행 경비" }),
    ).toBeInTheDocument();
  });

  it("일정이 없으면 /plan에서 메인으로 보낸다", () => {
    window.history.pushState({}, "", "/plan");
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "나만의 완벽한 여행 일정을 만들어보세요",
      }),
    ).toBeInTheDocument();
  });

  it("저장된 현재 일정이 있으면 /plan에서 전체 계획을 보여준다", () => {
    sessionStorage.setItem(
      "ai_travel_current_trip",
      JSON.stringify(createMockTrip()),
    );
    window.history.pushState({}, "", "/plan");
    render(<App />);

    expect(screen.getByText("Day 1 Timeline")).toBeInTheDocument();
    expect(screen.getByText("Budget Tracker")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "상세 일정" }),
    ).toBeInTheDocument();
  });
});

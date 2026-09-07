import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripInputForm } from "./trip-input-form";

describe("TripInputForm", () => {
  it("목적지를 고르지 않으면 제출하지 않는다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TripInputForm isLoading={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /최적 일정 생성하기/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("목적지와 기간을 고르면 TravelRequest를 제출한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TripInputForm isLoading={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "일본 오사카" }));
    await user.click(screen.getByRole("button", { name: "1박 2일" }));
    await user.click(screen.getByRole("button", { name: /최적 일정 생성하기/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "일본 오사카",
        durationNights: 1,
        durationDays: 2,
        currency: "KRW",
        themes: ["food", "hotplace"],
        companions: "friends",
        pace: "moderate",
        transportPreference: "public",
      }),
    );
  });

  // 회귀 방지: 프리셋 클릭이 곧바로 생성으로 이어지면 크레딧이 빠져나간다.
  it("프리셋을 클릭해도 제출하지 않는다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TripInputForm isLoading={false} onSubmit={onSubmit} />);

    await user.click(
      screen.getByRole("button", { name: /일본 오사카 2박 3일/ }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("프리셋을 클릭하면 조건만 채워지고, 그 뒤 제출하면 그 조건으로 나간다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TripInputForm isLoading={false} onSubmit={onSubmit} />);

    await user.click(
      screen.getByRole("button", { name: /제주도 2박 3일/ }),
    );

    // 폼이 채워졌는지: 제출 버튼 라벨이 프리셋 조건을 반영한다
    expect(
      screen.getByRole("button", { name: /제주도 2박 3일 최적 일정 생성하기/ }),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /최적 일정 생성하기/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "제주도",
        durationNights: 2,
        durationDays: 3,
      }),
    );
  });

  it("로딩 중이면 제출 버튼이 비활성화된다", () => {
    render(<TripInputForm isLoading onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("button", {
        name: /AI가 Bento 최적 동선과 맛집을 설계하고 있습니다/,
      }),
    ).toBeDisabled();
  });
});

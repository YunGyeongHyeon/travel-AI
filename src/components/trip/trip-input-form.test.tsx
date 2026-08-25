import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripInputForm } from "./trip-input-form";
import { PRESET_OPTIONS } from "@/data/sample-trips";

describe("TripInputForm", () => {
  it("목적지를 고르지 않으면 제출하지 않는다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TripInputForm
        isLoading={false}
        onSubmit={onSubmit}
        onSelectPreset={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /최적 일정 생성하기/ }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("목적지와 기간을 고르면 TravelRequest를 제출한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <TripInputForm
        isLoading={false}
        onSubmit={onSubmit}
        onSelectPreset={vi.fn()}
      />,
    );

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

  it("프리셋을 클릭하면 onSelectPreset에 해당 프리셋을 넘긴다", async () => {
    const user = userEvent.setup();
    const onSelectPreset = vi.fn();
    render(
      <TripInputForm
        isLoading={false}
        onSubmit={vi.fn()}
        onSelectPreset={onSelectPreset}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /일본 오사카 2박 3일/ }),
    );

    expect(onSelectPreset).toHaveBeenCalledWith(PRESET_OPTIONS[0]);
  });

  it("로딩 중이면 제출 버튼이 비활성화된다", () => {
    render(
      <TripInputForm
        isLoading
        onSubmit={vi.fn()}
        onSelectPreset={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /AI가 Bento 최적 동선과 맛집을 설계하고 있습니다/,
      }),
    ).toBeDisabled();
  });
});

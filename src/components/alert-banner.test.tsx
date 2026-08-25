import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertBanner } from "@/components/alert-banner";

describe("AlertBanner", () => {
  it("에러 메시지를 alert로 보여준다", () => {
    render(<AlertBanner message="일정을 만들지 못했습니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "일정을 만들지 못했습니다.",
    );
  });

  it("다시 시도 버튼을 누르면 onRetry를 호출한다", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<AlertBanner message="실패했습니다." onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /다시 시도/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("닫기 버튼을 누르면 onDismiss를 호출한다", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<AlertBanner message="실패했습니다." onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("핸들러가 없으면 액션 버튼을 렌더링하지 않는다", () => {
    render(<AlertBanner message="실패했습니다." />);

    expect(
      screen.queryByRole("button", { name: /다시 시도/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "닫기" })).not.toBeInTheDocument();
  });
});

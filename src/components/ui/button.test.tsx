import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("자식 텍스트를 렌더링한다", () => {
    render(<Button>일정 생성</Button>);
    expect(
      screen.getByRole("button", { name: "일정 생성" }),
    ).toBeInTheDocument();
  });

  it("폼 안에서 실수로 submit 되지 않도록 기본 type은 button이다", () => {
    render(<Button>확인</Button>);
    expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("disabled면 클릭해도 핸들러가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        생성 중
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "생성 중" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

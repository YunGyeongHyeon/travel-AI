import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

describe("Dialog", () => {
  it("닫혀 있으면 다이얼로그를 렌더링하지 않는다", () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>저장된 일정</DialogTitle>
          내용
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("열려 있으면 제목과 내용을 보여준다", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>저장된 일정</DialogTitle>
          오사카 일정
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("저장된 일정")).toBeInTheDocument();
    expect(screen.getByText("오사카 일정")).toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 onOpenChange(false)를 호출한다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>저장된 일정</DialogTitle>
          내용
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

import { cn } from "./utils";

describe("cn", () => {
  it("클래스 이름들을 공백으로 이어 붙인다", () => {
    expect(cn("px-4", "text-sm", "font-bold")).toBe("px-4 text-sm font-bold");
  });

  it("false, null, undefined는 제외한다", () => {
    expect(cn("block", false && "hidden", null, undefined, "mt-2")).toBe(
      "block mt-2",
    );
  });

  it("충돌하는 Tailwind 클래스는 마지막 값을 남긴다", () => {
    expect(cn("block", "flex")).toBe("flex");
  });
});

import { formatCurrency, getTripThemeLabel } from "./formatters";

describe("formatCurrency", () => {
  it("1만 원 미만은 원 단위로 표시한다", () => {
    expect(formatCurrency(5_000, "KRW")).toBe(`${(5_000).toLocaleString()}원`);
  });

  it("1만 원 단위는 '만 원'으로 표시한다", () => {
    expect(formatCurrency(10_000, "KRW")).toBe("1만 원");
    expect(formatCurrency(120_000, "KRW")).toBe("12만 원");
  });

  it("만 원 단위와 나머지를 함께 표시한다", () => {
    expect(formatCurrency(15_000, "KRW")).toBe(
      `1만 ${(5_000).toLocaleString()}원`,
    );
  });

  it("엔, 달러, 유로 기호를 붙인다", () => {
    expect(formatCurrency(3_500, "JPY")).toBe(`¥${(3_500).toLocaleString()}`);
    expect(formatCurrency(120, "USD")).toBe(`$${(120).toLocaleString()}`);
    expect(formatCurrency(80, "EUR")).toBe(`€${(80).toLocaleString()}`);
  });

  it("통화를 생략하면 원(KRW)으로 처리한다", () => {
    expect(formatCurrency(10_000)).toBe("1만 원");
  });
});

describe("getTripThemeLabel", () => {
  it("테마가 없으면 기본값 식도락을 반환한다", () => {
    expect(getTripThemeLabel()).toBe("식도락 / 미식");
    expect(getTripThemeLabel([])).toBe("식도락 / 미식");
  });

  it("선택한 테마 이름을 · 로 이어 붙인다", () => {
    expect(getTripThemeLabel(["food"])).toBe("식도락 / 미식");
    expect(getTripThemeLabel(["food", "healing"])).toBe(
      "식도락 / 미식 · 힐링 / 휴양",
    );
  });
});

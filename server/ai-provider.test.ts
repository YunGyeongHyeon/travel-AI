import { resolveProviderName } from "./ai-provider";

describe("resolveProviderName", () => {
  it("AI_PROVIDER를 지정하면 키와 무관하게 그쪽을 쓴다", () => {
    expect(
      resolveProviderName({ AI_PROVIDER: "claude", GEMINI_API_KEY: "g" }),
    ).toBe("claude");
    expect(
      resolveProviderName({ AI_PROVIDER: "gemini", ANTHROPIC_API_KEY: "a" }),
    ).toBe("gemini");
  });

  it("대소문자와 공백은 무시한다", () => {
    expect(resolveProviderName({ AI_PROVIDER: "  Claude " })).toBe("claude");
    expect(resolveProviderName({ AI_PROVIDER: "GEMINI" })).toBe("gemini");
  });

  it("지정이 없으면 무료 티어가 있는 Gemini를 먼저 고른다", () => {
    expect(
      resolveProviderName({ GEMINI_API_KEY: "g", ANTHROPIC_API_KEY: "a" }),
    ).toBe("gemini");
  });

  it("Gemini 키가 없으면 Claude로 넘어간다", () => {
    expect(resolveProviderName({ ANTHROPIC_API_KEY: "a" })).toBe("claude");
  });

  it("키가 하나도 없으면 null (데모 모드)", () => {
    expect(resolveProviderName({})).toBeNull();
  });

  it("알 수 없는 값은 경고만 하고 키 기준으로 넘어간다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      resolveProviderName({ AI_PROVIDER: "openai", GEMINI_API_KEY: "g" }),
    ).toBe("gemini");
    expect(warn).toHaveBeenCalledOnce();

    // 대체할 키도 없으면 데모 모드
    expect(resolveProviderName({ AI_PROVIDER: "openai" })).toBeNull();
  });

  it("빈 문자열 AI_PROVIDER는 지정하지 않은 것으로 본다", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      resolveProviderName({ AI_PROVIDER: "", ANTHROPIC_API_KEY: "a" }),
    ).toBe("claude");
    expect(warn).not.toHaveBeenCalled();
  });
});

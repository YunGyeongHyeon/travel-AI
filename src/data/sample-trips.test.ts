import { PRESET_OPTIONS } from "./sample-trips";

describe("PRESET_OPTIONS", () => {
  it("프리셋이 비어 있지 않다", () => {
    expect(PRESET_OPTIONS.length).toBeGreaterThan(0);
  });

  it("각 프리셋에 일정 생성에 필요한 요청 값이 들어 있다", () => {
    for (const preset of PRESET_OPTIONS) {
      expect(preset.id).toBeTruthy();
      expect(preset.title).toBeTruthy();
      expect(preset.request.destination).toBeTruthy();
      expect(preset.request.durationDays).toBe(preset.request.durationNights + 1);
      expect(preset.request.budget).toBeGreaterThan(0);
      expect(preset.request.themes.length).toBeGreaterThan(0);
    }
  });

  it("프리셋 id가 서로 겹치지 않는다", () => {
    const ids = PRESET_OPTIONS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

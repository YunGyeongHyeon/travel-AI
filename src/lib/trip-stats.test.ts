import { formatMinutes, getTripTransportStats } from "@/lib/trip-stats";
import { createMockSpot, createMockTrip } from "@/test/fixtures";
import type { PlaceSpot, TransportSegment } from "@/types";

function spotWithLeg(
  id: string,
  leg?: Partial<TransportSegment>,
): PlaceSpot {
  return createMockSpot({
    id,
    nextTransport: leg
      ? {
          mode: "bus",
          description: "이동",
          durationMinutes: 10,
          estimatedCost: 1150,
          ...leg,
        }
      : undefined,
  });
}

function tripWithSpots(spots: PlaceSpot[][]) {
  return createMockTrip({
    days: spots.map((daySpots, idx) => ({
      dayNumber: idx + 1,
      themeTitle: `Day ${idx + 1}`,
      summary: "",
      areaFocus: "",
      spots: daySpots,
      dayEstimatedCost: 0,
      transitSummary: "",
    })),
  });
}

describe("getTripTransportStats", () => {
  it("여러 날의 이동 구간을 모두 합산한다", () => {
    const trip = tripWithSpots([
      [
        spotWithLeg("d1-s1", { durationMinutes: 45, estimatedCost: 1150 }),
        spotWithLeg("d1-s2", { durationMinutes: 30, estimatedCost: 1150 }),
      ],
      [spotWithLeg("d2-s1", { durationMinutes: 60, estimatedCost: 12000 })],
    ]);

    expect(getTripTransportStats(trip)).toEqual({
      legCount: 3,
      totalMinutes: 135,
      totalCost: 14300,
      walkLegs: 0,
    });
  });

  it("마지막 장소처럼 nextTransport가 없는 스팟은 세지 않는다", () => {
    const trip = tripWithSpots([
      [spotWithLeg("d1-s1", { durationMinutes: 20 }), spotWithLeg("d1-s2")],
    ]);

    const stats = getTripTransportStats(trip);
    expect(stats.legCount).toBe(1);
    expect(stats.totalMinutes).toBe(20);
  });

  it("도보 구간을 따로 센다", () => {
    const trip = tripWithSpots([
      [
        spotWithLeg("d1-s1", { mode: "walk", estimatedCost: 0 }),
        spotWithLeg("d1-s2", { mode: "walk", estimatedCost: 0 }),
        spotWithLeg("d1-s3", { mode: "subway" }),
      ],
    ]);

    const stats = getTripTransportStats(trip);
    expect(stats.legCount).toBe(3);
    expect(stats.walkLegs).toBe(2);
  });

  // AI 응답이라 값이 비어 오는 경우가 실제로 있다. 합계가 NaN이 되면 화면이 깨진다.
  it("시간·비용이 비어 있어도 NaN을 만들지 않는다", () => {
    const trip = tripWithSpots([
      [
        spotWithLeg("d1-s1", {
          durationMinutes: undefined as unknown as number,
          estimatedCost: undefined as unknown as number,
        }),
        spotWithLeg("d1-s2", { durationMinutes: 15, estimatedCost: 1000 }),
      ],
    ]);

    const stats = getTripTransportStats(trip);
    expect(stats.totalMinutes).toBe(15);
    expect(stats.totalCost).toBe(1000);
    expect(Number.isNaN(stats.totalMinutes)).toBe(false);
  });

  it("이동 정보가 하나도 없으면 전부 0", () => {
    const trip = tripWithSpots([[spotWithLeg("d1-s1")]]);

    expect(getTripTransportStats(trip)).toEqual({
      legCount: 0,
      totalMinutes: 0,
      totalCost: 0,
      walkLegs: 0,
    });
  });
});

describe("formatMinutes", () => {
  it.each([
    [0, "0분"],
    [45, "45분"],
    [60, "1시간"],
    [120, "2시간"],
    [135, "2시간 15분"],
    [375, "6시간 15분"],
  ])("%i분 → %s", (input, expected) => {
    expect(formatMinutes(input)).toBe(expected);
  });

  it("음수나 잘못된 값은 0분으로 본다", () => {
    expect(formatMinutes(-30)).toBe("0분");
    expect(formatMinutes(NaN)).toBe("0분");
  });
});

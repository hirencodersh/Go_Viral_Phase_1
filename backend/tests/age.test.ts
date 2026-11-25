import { calculateAge } from "../src/utils/age";

describe("Age calculation", () => {
  const today = new Date("2026-11-25T12:00:00.000Z");

  it("allows a person who turns 18 today", () => {
    expect(calculateAge("2008-11-25", today)).toBe(18);
  });

  it("keeps a person under 18 until their birthday", () => {
    expect(calculateAge("2008-11-26", today)).toBe(17);
  });
});

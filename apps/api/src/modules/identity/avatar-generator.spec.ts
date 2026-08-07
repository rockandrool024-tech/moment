import { generateAvatarPng } from "./avatar-generator";

describe("generateAvatarPng", () => {
  it("is byte-for-byte deterministic for the same seed", () => {
    const seed = "user-1:2026-08-07T12:00:00.000Z";
    expect(generateAvatarPng(seed).equals(generateAvatarPng(seed))).toBe(true);
  });

  it("produces different output for different seeds", () => {
    const a = generateAvatarPng("user-1:2026-08-07T12:00:00.000Z");
    const b = generateAvatarPng("user-1:2026-08-08T09:30:00.000Z");
    expect(a.equals(b)).toBe(false);
  });

  it("starts with a valid PNG signature", () => {
    const png = generateAvatarPng("user-1:seed");
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });
});

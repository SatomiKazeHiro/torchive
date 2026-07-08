import { describe, expect, it } from "vitest";
import { shortHash } from "../shortHash";

describe("shortHash", () => {
  it("returns an 8-char base32 string by default", () => {
    const hash = shortHash("anything");
    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-hjkmnp-tv-z]+$/);
  });

  it("respects custom length", () => {
    expect(shortHash("x", 4)).toHaveLength(4);
    expect(shortHash("x", 12)).toHaveLength(12);
  });

  it("is deterministic for the same input", () => {
    expect(shortHash("ep1.mp4")).toBe(shortHash("ep1.mp4"));
  });

  it("differs across inputs (smoke test)", () => {
    const a = shortHash("ep1.mp4");
    const b = shortHash("ep2.mp4");
    const c = shortHash("第01话.mp4");
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it("matches FNV-1a snapshot for known inputs (URL state regression)", () => {
    // 这些值用于 /play?asset=<hash> 路由;回归断言防止 hash 算法悄悄改。
    expect(shortHash("ep1.mp4")).toBe("00r462bt");
    expect(shortHash("ep2.mp4")).toBe("03mzx81v");
    expect(shortHash("第01话.mp4")).toBe("03qmkve6");
    expect(shortHash("001.jpg")).toBe("01c5bd39");
  });
});

import { describe, expect, it } from "vitest";
import { generateCoverUrl } from "../cover";

const baseWork: Work = {
  domain: "anime",
  category: "seasonal",
  work: "demo",
  hash_id: "h1",
  path: "/x",
  create_time: "",
  exist: 1,
  state: 1,
  detail: {
    hash_id: "h1",
    domain: "anime",
    category: "seasonal",
    name: "demo",
    cover: "cover.jpg",
    title: "Demo",
    intro: "",
    amount: 0,
    size: 0,
    has_section: 0,
    is_orphan: 0,
    create_time: "",
    update_time: "",
    entities_json: "",
  },
};

describe("generateCoverUrl", () => {
  it("appends work subdir when is_orphan is falsy", () => {
    expect(generateCoverUrl(baseWork)).toBe(
      "/ts-api/resources/anime/seasonal/demo/cover.jpg",
    );
  });

  it("skips work subdir when is_orphan is 1", () => {
    expect(generateCoverUrl({ ...baseWork, detail: { ...baseWork.detail, is_orphan: 1 } })).toBe(
      "/ts-api/resources/anime/seasonal/cover.jpg",
    );
  });

  it("returns empty string when cover is missing", () => {
    const work = { ...baseWork, detail: { ...baseWork.detail, cover: "" } };
    expect(generateCoverUrl(work)).toBe("");
  });

  it("returns defaultCover option when cover is missing", () => {
    const work = { ...baseWork, detail: { ...baseWork.detail, cover: "" } };
    expect(generateCoverUrl(work, { defaultCover: "/fallback.png" })).toBe(
      "/fallback.png",
    );
  });
});

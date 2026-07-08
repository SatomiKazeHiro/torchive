import { describe, expect, it } from "vitest";
import { mapWorkToBrief } from "../brief";

const baseWork: Work = {
  domain: "manga",
  category: "shonen",
  work: "Demo Title",
  hash_id: "abc123",
  path: "/x",
  create_time: "",
  exist: 1,
  state: 1,
  detail: {
    hash_id: "abc123",
    domain: "manga",
    category: "shonen",
    name: "Demo Title",
    cover: "cover.jpg",
    title: "Demo Title",
    intro: "An intro line.",
    amount: 0,
    size: 0,
    has_section: 0,
    is_orphan: 0,
    create_time: "",
    update_time: "",
    entities_json: "",
  },
};

describe("mapWorkToBrief", () => {
  it("returns the brief shape with expected fields", () => {
    const brief = mapWorkToBrief(baseWork);
    expect(brief).toMatchObject({
      label: "Demo Title",
      cover: "/ts-api/resources/manga/shonen/Demo Title/cover.jpg",
      link: "/manga/shonen/abc123",
      description: "An intro line.",
    });
  });

  it("uses the route mapper path (no /index/ prefix)", () => {
    expect(mapWorkToBrief(baseWork).link.startsWith("/index/")).toBe(false);
  });

  it("falls back to empty description when detail.intro is empty", () => {
    const brief = mapWorkToBrief({
      ...baseWork,
      detail: { ...baseWork.detail, intro: "" },
    });
    expect(brief.description).toBe("");
  });

  it("uses work field as label (not detail.title)", () => {
    const brief = mapWorkToBrief({
      ...baseWork,
      work: "raw-folder-name",
      detail: { ...baseWork.detail, title: "Pretty Title" },
    });
    expect(brief.label).toBe("raw-folder-name");
  });
});

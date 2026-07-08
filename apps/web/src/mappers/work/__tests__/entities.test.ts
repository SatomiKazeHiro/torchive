import { describe, expect, it } from "vitest";
import { parseEntitiesJson, transformEntities } from "../entities";

const baseWork: Work = {
  domain: "manga",
  category: "shonen",
  work: "demo",
  hash_id: "h1",
  path: "/x",
  create_time: "",
  exist: 1,
  state: 1,
  detail: {
    hash_id: "h1",
    domain: "manga",
    category: "shonen",
    name: "demo",
    cover: "",
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

describe("parseEntitiesJson", () => {
  it("returns empty shape when input is undefined", () => {
    expect(parseEntitiesJson(undefined)).toEqual({
      assets: [],
      section: [],
      orphanAssets: [],
    });
  });

  it("returns empty shape when input is malformed JSON", () => {
    expect(parseEntitiesJson("{not json")).toEqual({
      assets: [],
      section: [],
      orphanAssets: [],
    });
  });

  it("parses valid JSON into EntitiesJson", () => {
    const input = JSON.stringify({
      assets: ["a.jpg"],
      section: [{ name: "ch1", files: ["1.jpg"] }],
      orphanAssets: ["o.jpg"],
    });
    expect(parseEntitiesJson(input)).toEqual({
      assets: ["a.jpg"],
      section: [{ name: "ch1", files: ["1.jpg"] }],
      orphanAssets: ["o.jpg"],
    });
  });
});

describe("transformEntities", () => {
  const workWithEntities: Work = {
    ...baseWork,
    detail: {
      ...baseWork.detail,
      entities_json: JSON.stringify({
        assets: ["01.jpg", "02.jpg"],
        section: [
          { name: "第10话", files: ["10.jpg"] },
          { name: "第2话", files: ["2.jpg"] },
          { name: "第1话", files: ["1.jpg"] },
        ],
        orphanAssets: ["bonus.jpg"],
      }),
    },
  };

  it("links assets under basePath (work subdir)", () => {
    const out = transformEntities(workWithEntities);
    expect(out.assets).toEqual([
      "/ts-api/resources/manga/shonen/demo/01.jpg",
      "/ts-api/resources/manga/shonen/demo/02.jpg",
    ]);
  });

  it("links orphanAssets under categoryPath (no work subdir)", () => {
    const out = transformEntities(workWithEntities);
    expect(out.orphanAssets).toEqual([
      "/ts-api/resources/manga/shonen/bonus.jpg",
    ]);
  });

  it("sorts sections by natural compare (第1话, 第2话, 第10话)", () => {
    const out = transformEntities(workWithEntities);
    expect(out.section.map((s) => s.name)).toEqual([
      "第1话",
      "第2话",
      "第10话",
    ]);
  });

  it("prefixes section files with categoryPath/work/sectionName", () => {
    const out = transformEntities(workWithEntities);
    expect(out.section[0].files).toEqual([
      "/ts-api/resources/manga/shonen/demo/第1话/1.jpg",
    ]);
  });

  it("returns empty shape when entities_json is missing", () => {
    const out = transformEntities(baseWork);
    expect(out).toEqual({ assets: [], section: [], orphanAssets: [] });
  });
});

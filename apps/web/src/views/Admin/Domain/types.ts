export type DomainPageTemplate = "list" | "grid-card" | "";

export interface DomainFormData {
  domain: string;
  name: string;
  page_template: DomainPageTemplate | "";
  state: number;
}

export const DOMAIN_PAGE_TEMPLATES: { value: "list" | "grid-card" | ""; label: string }[] = [
  { value: "grid-card", label: "网格卡片 (默认)" },
  { value: "list", label: "列表" },
];

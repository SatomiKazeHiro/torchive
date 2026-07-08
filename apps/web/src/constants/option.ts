// 页面模板选项（包含空字符串用于清除选择）
export const PAGE_TEMPLATE_OPTIONS: { value: NormalPageTemplate | ""; label: string }[] = [
  { value: "grid-card", label: "网格卡片" },
  { value: "list", label: "列表" },
];

// 作品页面模板选项（包含空字符串用于清除选择）
export const WORK_PAGE_TEMPLATE_OPTIONS: { value: WorkPageTemplate | ""; label: string }[] = [
  { value: "mixture", label: "混合" },
  { value: "video", label: "视频" },
  { value: "manga", label: "漫画" },
  { value: "album", label: "相册" },
  { value: "music", label: "音乐" },
  { value: "ebook", label: "电子书" },
];

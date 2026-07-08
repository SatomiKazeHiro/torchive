// 筛选状态
export interface FilterState {
  domain: string;
  category: string;
  state: string;
  keyword: string;
}

// 编辑表单数据
export interface MediaFormData {
  hash_id: string;
  domain: string;
  category: string;
  work: string;
  state: number;
  title: string;
  intro: string;
}

// 弹窗模式
export type ModalMode = "create" | "edit";

// 状态选项
export const STATE_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "1", label: "已发布" },
  { value: "0", label: "草稿" },
];

// 编辑弹窗状态选项
export const EDIT_STATE_OPTIONS = [
  { value: "1", label: "已发布" },
  { value: "0", label: "草稿" },
];

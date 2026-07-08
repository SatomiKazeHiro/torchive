// 分类表单数据
export interface CategoryFormData {
  hash_id: string;
  domain: string;
  category: string;
  name: string;
  page_template: NormalPageTemplate | "";
  work_page_template: WorkPageTemplate | "";
  state: number;
}

// 带资源数统计的分类
export interface CategoryWithCount extends Category {
  count?: number;
}

// 弹窗模式
export type ModalMode = "create" | "edit";

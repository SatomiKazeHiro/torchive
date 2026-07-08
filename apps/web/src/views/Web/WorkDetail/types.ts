import { WORK_PAGE_TEMPLATE_OPTIONS } from "@/constants/option";

// 获取模板标签
export function getWorkPageTemplateLabel(template: WorkPageTemplate | ""): string {
  const option = WORK_PAGE_TEMPLATE_OPTIONS.find((opt) => opt.value === template);
  return option?.label || "混合";
}

// 默认模板
export const DEFAULT_WORK_PAGE_TEMPLATE: WorkPageTemplate = "mixture";

// 模板组件通用 Props 接口
export interface WorkTemplateProps {
  /** 作品数据 */
  work: Work;
  /** 当前域名 */
  domain: string;
  /** 当前分类 */
  category: string;
  /** 域名显示名称（从服务器获取） */
  domainName: string;
}

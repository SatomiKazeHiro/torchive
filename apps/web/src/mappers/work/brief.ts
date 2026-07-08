import { generateCoverUrl } from "./cover";

export interface WorkBrief {
  label: string;
  cover: string;
  link: string;
  description?: string;
}

export function mapWorkToBrief(workItem: Work): WorkBrief {
  const { domain, category, work, hash_id, detail } = workItem;
  return {
    label: work,
    cover: generateCoverUrl(workItem),
    link: `/${domain}/${category}/${hash_id}`,
    description: detail.intro,
  };
}
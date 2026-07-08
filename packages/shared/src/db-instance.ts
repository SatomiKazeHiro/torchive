export interface DomainStats {
  workCount: number;
  totalAmount: number;
  totalSize: number;
}

export interface Domain {
  domain: string;
  name: string;
  page_template: string;
  exist: number;
  state: number;
  stats?: DomainStats;
}

export interface CategoryStats {
  workCount: number;
  totalAmount: number;
  totalSize: number;
}

export interface Category {
  hash_id: string;
  domain: string;
  category: string;
  name: string;
  page_template: string;
  work_page_template: string;
  state: number;
  exist: number;
  stats?: CategoryStats;
}

export interface EntitiesJson {
  assets: string[];
  section: { name: string; files: string[] }[];
  orphanAssets: string[];
}

export interface WorkDetail {
  hash_id: string;
  domain: string;
  category: string;
  name: string;
  cover: string;
  title: string;
  intro: string;
  amount: number;
  size: number;
  has_section: number;
  is_orphan: number;
  create_time: string;
  update_time: string;
  entities_json: string;
}

export interface Work {
  domain: string;
  category: string;
  create_time: string | Date;
  exist: number;
  hash_id: string;
  path: string;
  work: string;
  state: number;
  detail: WorkDetail;
}

export interface User {
  uid: string;
  login_name: string;
  password?: string;
  user_name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  create_time?: string | Date;
  update_time?: string | Date;
}

export interface UserFavorite {
  id: number;
  uid: string;
  work_hash_id: string;
  create_time?: string | Date;
}

export interface UserHistory {
  id: number;
  uid: string;
  work_hash_id: string;
  params?: string;
  create_time?: string | Date;
  update_time?: string | Date;
}

export interface UserWatchLater {
  id: number;
  uid: string;
  work_hash_id: string;
  create_time?: string | Date;
}

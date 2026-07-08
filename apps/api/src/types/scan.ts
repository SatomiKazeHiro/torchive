import { CreateDomainDto } from '@/domain/dto/create-domain.dto';
import { CreateCategoryDto } from '@/category/dto/create-category.dto';
import { CreateWorkDto } from '@/work/dto/create-work.dto';
import { CreateDetailDto } from '@/detail/dto/create-detail.dto';

export interface ScanInfo {
  domains: CreateDomainDto[];
  categories: CreateCategoryDto[];
  works: CreateWorkDto[];
  details: CreateDetailDto[];
}

export interface EntitiesJson {
  orphanAssets: string[];
  assets: string[];
  section: { [key: string]: string | string[] }[];
}

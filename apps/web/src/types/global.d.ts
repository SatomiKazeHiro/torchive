import type {
  Domain as DomainType,
  Category as CategoryType,
  Work as WorkType,
  WorkDetail as WorkDetailType,
  User as UserType,
  UserFavorite as UserFavoriteType,
  UserHistory as UserHistoryType,
  UserWatchLater as UserWatchLaterType,
} from "./db-instance";
import {
  WorkPageTemplate as WorkPageTemplateType,
  NormalPageTemplate as NormalPageTemplateType,
} from "./enum";

declare global {
  type Domain = DomainType;
  type Category = CategoryType;
  type Work = WorkType;
  type WorkDetail = WorkDetailType;
  type User = UserType;
  type UserFavorite = UserFavoriteType;
  type UserHistory = UserHistoryType;
  type UserWatchLater = UserWatchLaterType;
  type WorkPageTemplate = WorkPageTemplateType;
  type NormalPageTemplate = NormalPageTemplateType;
}

export {};

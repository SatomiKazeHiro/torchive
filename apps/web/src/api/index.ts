/**
 * API 聚合导出。所有 /ts-api/* 调用集中在此入口。
 *
 * 按域拆分：
 * - shared          公共 http 实例 + 响应包装类型
 * - works           作品（Work）CRUD 与分页查询
 * - domains         域（Domain）CRUD 与统计
 * - categories      分类（Category）CRUD 与统计
 * - details         作品详情（WorkDetail）查询
 * - users           用户注册/登录/资料/头像
 * - user-favorites  用户收藏
 * - user-histories  观看历史
 * - user-watch-laters 稍后再看
 */

export * from "./shared";
export * from "./works";
export * from "./domains";
export * from "./categories";
export * from "./details";
export * from "./users";
export * from "./user-favorites";
export * from "./user-histories";
export * from "./user-watch-laters";
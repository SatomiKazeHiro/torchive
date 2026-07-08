import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { BiChevronUp, BiChevronDown, BiSortAlt2 } from "react-icons/bi";
import Pagination from "@/components/Pagination";
import OverflowableBox from "@/components/OverflowableBox";

/** 排序方向类型 */
export type SortOrder = "ascend" | "descend" | null;

/** 获取对象属性值的类型辅助 */
type DeepValue<T, K extends keyof T | string> = K extends keyof T
  ? T[K]
  : unknown;

/**
 * 表格列配置接口
 * @template T - 数据行类型
 * @template K - 数据索引字段类型（默认为 keyof T）
 */
export interface ColumnType<T = unknown, K extends keyof T | string = keyof T | string> {
  /** 列标题，可以是字符串或 React 节点 */
  title: React.ReactNode;
  /** 对应数据字段名 */
  dataIndex?: K;
  /** 列唯一标识，不传则使用 dataIndex */
  key?: string;
  /**
   * 自定义渲染函数
   * @param value - 单元格数据值
   * @param record - 当前行数据
   * @param index - 当前行索引
   */
  render?: (value: DeepValue<T, K>, record: T, index: number) => React.ReactNode;
  /** 列宽度，支持数字（像素）或字符串（如 "10%"） */
  width?: string | number;
  /** 内容对齐方式 */
  align?: "left" | "center" | "right";
  /** 是否启用排序 */
  sorter?: boolean;
  /** 固定列位置 */
  fixed?: "left" | "right";
  /** 自定义 CSS 类名 */
  className?: string;
  /** 是否启用文本省略（超出宽度显示省略号） */
  ellipsis?: boolean;
}

/**
 * 表格组件属性接口
 * @template T - 数据行类型
 */
export interface TableProps<T = unknown> {
  /** 列配置数组 */
  columns: ColumnType<T>[];
  /** 数据源数组 */
  dataSource: T[];
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示表头 */
  showHeader?: boolean;
  /** 表格尺寸 */
  size?: "sm" | "md" | "lg";
  /** 行点击回调函数 */
  onRowClick?: (record: T, index: number) => void;
  /** 自定义行类名生成函数 */
  rowClassName?: (record: T, index: number) => string;
  /** 当前排序字段 */
  sortField?: string;
  /** 当前排序方向 */
  sortOrder?: SortOrder;
  /** 排序变化回调函数 */
  onSortChange?: (field: string, order: SortOrder) => void;
  /** 自定义 CSS 类名 */
  className?: string;
  /** 空数据时显示的文本或节点 */
  emptyText?: React.ReactNode;
  /** 行唯一标识字段名或生成函数 */
  rowKey?: keyof T | ((record: T) => string);
  /** 分页配置 */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange?: (page: number) => void;
  };
  /** 是否启用斑马纹 */
  striped?: boolean;
  /** 是否启用悬停效果 */
  hoverable?: boolean;
}

/** 尺寸样式映射表 */
const sizeMap = {
  sm: { th: "px-3 py-2 text-xs", td: "px-3 py-2 text-xs" },
  md: { th: "px-4 py-3 text-sm", td: "px-4 py-3 text-sm" },
  lg: { th: "px-6 py-4 text-base", td: "px-6 py-4 text-base" },
} as const;

/**
 * 表格组件
 *
 * 基于 @tanstack/react-table 封装的高性能表格组件，支持：
 * - 自定义列渲染
 * - 排序
 * - 分页
 * - 固定列
 * - 斑马纹
 * - 行点击事件
 *
 * @template T - 数据行类型
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { title: '姓名', dataIndex: 'name' },
 *     { title: '年龄', dataIndex: 'age', sorter: true },
 *   ]}
 *   dataSource={[{ name: '张三', age: 18 }]}
 * />
 * ```
 */
export function Table<T = unknown>({
  columns: userColumns,
  dataSource,
  loading = false,
  bordered = false,
  showHeader = true,
  size = "md",
  onRowClick,
  rowClassName,
  sortField,
  sortOrder,
  onSortChange,
  className = "",
  emptyText = "暂无数据",
  rowKey = "id" as keyof T,
  pagination,
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  /**
   * 将用户配置的 ColumnType 转换为 react-table 的 ColumnDef
   * 使用 useMemo 缓存，避免每次渲染都重新计算
   */
  const columns = useMemo<ColumnDef<T, unknown>[]>(() => {
    return userColumns.map((col) => ({
      accessorKey: col.dataIndex as string,
      id: col.key || (col.dataIndex as string),
      header: () => col.title,
      cell: (info) => {
        const value = info.getValue();
        const content = col.render
          ? col.render(value as never, info.row.original, info.row.index)
          : value as string | undefined;

        return <OverflowableBox enabled={col.ellipsis}>{content}</OverflowableBox>;
      },
      enableSorting: !!col.sorter,
      // 透传原始配置到 meta，供渲染时访问
      meta: { ...col } as ColumnType<T>,
    }));
  }, [userColumns]);

  /**
   * 将外部排序状态转换为 react-table 的 SortingState
   */
  const sortingState = useMemo<SortingState>(() => {
    if (sortField && sortOrder) {
      return [{ id: sortField, desc: sortOrder === "descend" }];
    }
    return [];
  }, [sortField, sortOrder]);

  /**
   * 获取行唯一标识
   * @param row - 行数据
   * @param index - 行索引（作为备用标识）
 */
  const getRowId = (row: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }
    // 确保返回 string 类型
    const key = (row as Record<string, unknown>)[rowKey as string];
    return key !== undefined && key !== null ? String(key) : String(index);
  };

  /**
   * 初始化 react-table 实例
   */
  const table = useReactTable({
    data: dataSource,
    columns,
    state: { sorting: sortingState },
    manualPagination: true,
    /**
     * 处理排序变化
     * 将 react-table 的排序状态转换为组件的 SortOrder 类型
     */
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sortingState) : updater;
      const sort = next[0];
      onSortChange?.(sort?.id || "", sort ? (sort.desc ? "descend" : "ascend") : null);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  /**
   * 获取固定列的 CSS 类名
   * @param col - 列配置（可选）
   * @returns 对应的 sticky 样式类名
   */
  const getStickyClass = (col?: ColumnType<T>): string => {
    if (!col?.fixed) return "";
    const base = "sticky z-[1] bg-inherit";
    if (col.fixed === "left") {
      return `${base} left-0 shadow-[1px_0_0_0_rgba(0,0,0,0.06)]`;
    }
    if (col.fixed === "right") {
      return `${base} right-0 shadow-[-1px_0_0_0_rgba(0,0,0,0.06)]`;
    }
    return "";
  };

  /**
   * 获取表头单元格的对齐样式
   * @param align - 对齐方式
   */
  const getHeaderAlignClass = (align?: "left" | "center" | "right"): string => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "";
  };

  /**
   * 获取 flex 容器对齐样式
   * @param align - 对齐方式
   */
  const getFlexAlignClass = (align?: "left" | "center" | "right"): string => {
    if (align === "center") return "justify-center";
    if (align === "right") return "justify-end";
    return "";
  };

  /**
   * 获取数据单元格的对齐样式
   * @param align - 对齐方式
   */
  const getCellAlignClass = (align?: "left" | "center" | "right"): string => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "";
  };

  /**
   * 生成行的 CSS 类名
   * @param record - 行数据
   * @param index - 行索引
   * @param hasClickHandler - 是否有点击处理函数
   */
  const getRowClassName = (
    record: T,
    index: number,
    hasClickHandler: boolean
  ): string => {
    const classes: string[] = ["group", "transition-colors", "border-b", "border-edge-subtle"];

    if (hoverable) {
      classes.push("hover:bg-subtle");
    }

    if (striped && index % 2 === 1) {
      classes.push("bg-subtle/50");
    } else {
      classes.push("bg-card");
    }

    if (hasClickHandler) {
      classes.push("cursor-pointer");
    }

    const customClass = rowClassName?.(record, index);
    if (customClass) {
      classes.push(customClass);
    }

    return classes.join(" ");
  };

  // 当前尺寸样式
  const currentSizeStyle = sizeMap[size];

  // 容器边框样式
  const containerBorderClass = bordered
    ? "rounded-md ring-1 ring-edge"
    : "border border-edge rounded-md";

  return (
    <div className={`flex w-full flex-col ${className}`}>
      <div className={`relative overflow-hidden bg-card ${containerBorderClass}`}>
        <div className="overflow-x-auto">
          {/* table-fixed 是截断生效的关键 */}
          <table className="w-full table-fixed border-collapse text-left">
            {showHeader && (
              <thead className="border-b border-edge bg-subtle/80">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      // 从 meta 获取原始列配置
                      const col = header.column.columnDef.meta as ColumnType<T> | undefined;
                      const canSort = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();

                      return (
                        <th
                          key={header.id}
                          style={{ width: col?.width }}
                          className={`${currentSizeStyle.th} font-medium text-secondary transition-colors ${canSort ? "cursor-pointer select-none hover:bg-subtle" : ""} ${getStickyClass(col)} ${getHeaderAlignClass(col?.align)}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div
                            className={`flex items-center gap-1 ${getFlexAlignClass(col?.align)}`}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort && (
                              <span className="text-faint">
                                {sortDirection === "asc" && (
                                  <BiChevronUp className="text-primary" />
                                )}
                                {sortDirection === "desc" && (
                                  <BiChevronDown className="text-primary" />
                                )}
                                {!sortDirection && (
                                  <BiSortAlt2 className="opacity-0 group-hover:opacity-100" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
            )}
            <tbody className="divide-y divide-edge-subtle">
              {loading ? (
                // 加载状态行
                <tr>
                  <td colSpan={userColumns.length} className="py-20 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                // 空数据状态行
                <tr>
                  <td colSpan={userColumns.length} className="py-20 text-center text-faint">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                // 数据行
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original, row.index)}
                    className={getRowClassName(row.original, row.index, !!onRowClick)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      // 从 meta 获取原始列配置
                      const col = cell.column.columnDef.meta as ColumnType<T> | undefined;
                      return (
                        <td
                          key={cell.id}
                          className={`${currentSizeStyle.td} overflow-hidden ${getStickyClass(col)} ${getCellAlignClass(col?.align)}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* 分页区域 */}
      {pagination && (
        <div className="mt-4 flex justify-end">
          <Pagination {...pagination} size={size === "lg" ? "md" : "sm"} />
        </div>
      )}
    </div>
  );
}

export default Table;

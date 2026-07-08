import { useMemo } from "react";
import { debounce } from "es-toolkit";
import toast from "react-hot-toast";
import { BiEditAlt } from "react-icons/bi";
import { Switch, Button, Tooltip, type ColumnType } from "@/components";
import { formatSize } from "@/utils/format";
import type { CategoryWithCount } from "../types";
import { adminStyles } from "../../styles";

interface UseCategoryColumnsOptions {
  domains: Domain[];
  onEdit: (category: CategoryWithCount) => void;
  onToggleState: (category: CategoryWithCount) => Promise<void>;
}

export function useCategoryColumns({
  domains,
  onEdit,
  onToggleState,
}: UseCategoryColumnsOptions): ColumnType<CategoryWithCount>[] {
  const handleToggleState = debounce(
    async (category: CategoryWithCount) => {
      const newState = category.state === 1 ? 0 : 1;
      const actionText = newState === 1 ? "启用" : "禁用";
      const toastId = toast.loading(`${actionText}中...`);

      try {
        await onToggleState(category);
        toast.success(`分类已${actionText}`, { id: toastId });
      } catch (err) {
        console.error("更新状态失败:", err);
        toast.error(`${actionText}失败`, { id: toastId });
      }
    },
    300,
    { edges: ["leading"] },
  );

  const getDomainName = (domain: string) => {
    return domains.find((d) => d.domain === domain)?.name || domain;
  };

  return useMemo(
    () => [
      {
        title: "分类名称",
        dataIndex: "name",
        key: "name",
        render: (_, category) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-rich-black dark:text-zinc-100">
              {category.name}
            </span>
            <span className="mt-0.5 font-mono text-xs text-midtone-gray dark:text-zinc-400">
              {category.hash_id}
            </span>
          </div>
        ),
      },
      {
        title: "所属主题",
        dataIndex: "domain",
        key: "domain",
        width: 140,
        render: (value) => {
          const domainValue = value as string;
          const domainName = getDomainName(domainValue);

          return (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-rich-black dark:text-zinc-100">
                {domainName}
              </div>
              <div
                className="mt-0.5 truncate font-mono text-[11px] leading-[1.43] text-midtone-gray dark:text-zinc-500"
                title={domainValue}
              >
                {domainValue}
              </div>
            </div>
          );
        },
      },
      {
        title: "标识",
        dataIndex: "category",
        key: "category",
        width: 100,
        render: (value) => (
          <span className="font-mono text-xs text-midtone-gray dark:text-zinc-400">
            {value as string}
          </span>
        ),
      },
      {
        title: "页面模板",
        dataIndex: "page_template",
        key: "page_template",
        width: 90,
        render: (value) => (
          <span className="text-xs text-midtone-gray dark:text-zinc-400">
            {(value as string) === "list" ? "列表" : "网格卡片"}
          </span>
        ),
      },
      {
        title: "资源数",
        key: "stats",
        width: 80,
        render: (_, category) => (
          <span className="text-sm text-midtone-gray dark:text-zinc-400">
            {category.stats?.workCount || 0}
          </span>
        ),
      },
      {
        title: "文件数",
        key: "totalAmount",
        width: 80,
        render: (_, category) => (
          <span className="text-sm text-midtone-gray dark:text-zinc-400">
            {category.stats?.totalAmount || 0}
          </span>
        ),
      },
      {
        title: "占用空间",
        key: "totalSize",
        width: 160,
        render: (_, category) => (
          <span className="font-mono text-sm text-midtone-gray dark:text-zinc-400">
            {formatSize(category.stats?.totalSize)}
          </span>
        ),
      },
      {
        title: "状态",
        dataIndex: "state",
        key: "state",
        width: 100,
        render: (_, record) => (
          <Switch
            checked={record.state === 1}
            onChange={() => handleToggleState(record)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size="sm"
          />
        ),
      },
      {
        title: "操作",
        key: "action",
        width: 80,
        render: (_, record) => (
          <div className="flex items-center gap-1">
            <Tooltip content="编辑分类">
              <Button
                variant="ghost"
                size="sm"
                shape="circle"
                className={adminStyles.iconButton}
                onClick={() => onEdit(record)}
              >
                <BiEditAlt className="text-base" />
              </Button>
            </Tooltip>
          </div>
        ),
      },
    ],
    // getDomainName 是组件内稳定函数，无需列入 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domains, onEdit, handleToggleState],
  );
}

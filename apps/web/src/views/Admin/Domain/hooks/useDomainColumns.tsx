import { useMemo } from "react";
import { debounce } from "es-toolkit";
import toast from "react-hot-toast";
import { BiEditAlt } from "react-icons/bi";
import { Switch, Button, Tooltip, type ColumnType } from "@/components";
import { formatSize } from "@/utils/format";
import type { Domain } from "@/types/db-instance";
import { adminStyles } from "../../styles";

interface UseDomainColumnsOptions {
  onEdit: (domain: Domain) => void;
  onToggleState: (domain: Domain, newState: number) => Promise<void>;
}

export function useDomainColumns({
  onEdit,
  onToggleState,
}: UseDomainColumnsOptions): ColumnType<Domain>[] {
  const handleToggleState = debounce(
    async (domain: Domain, checked: boolean) => {
      const newState = checked ? 1 : 0;
      const actionText = checked ? "启用" : "禁用";
      const toastId = toast.loading(`${actionText}中...`);

      try {
        await onToggleState(domain, newState);
        toast.success(`主题已${actionText}`, { id: toastId });
      } catch (err) {
        console.error("更新状态失败:", err);
        toast.error(`${actionText}失败`, { id: toastId });
      }
    },
    300,
    { edges: ["leading"] },
  );

  return useMemo(
    () => [
      {
        title: "主题名称",
        dataIndex: "name",
        key: "name",
        render: (_, domain) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-rich-black dark:text-zinc-100">
              {domain.name}
            </span>
            <span className="mt-0.5 font-mono text-xs text-midtone-gray dark:text-zinc-400">
              ID: {domain.domain}
            </span>
          </div>
        ),
      },
      {
        title: "页面模板",
        dataIndex: "page_template",
        key: "page_template",
        width: 140,
        render: (value) => {
          const templateValue = (value as string) || "default";
          const templateName = templateValue === "list" ? "列表布局" : "网格卡片";

          return (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-rich-black dark:text-zinc-100">
                {templateName}
              </div>
              <div
                className="mt-0.5 truncate font-mono text-[11px] leading-[1.43] text-midtone-gray dark:text-zinc-500"
                title={templateValue}
              >
                {templateValue}
              </div>
            </div>
          );
        },
      },
      {
        title: "资源数",
        key: "stats",
        width: 80,
        render: (_, domain) => (
          <span className="text-sm text-midtone-gray dark:text-zinc-400">
            {domain.stats?.workCount || 0}
          </span>
        ),
      },
      {
        title: "文件数",
        key: "totalAmount",
        width: 80,
        render: (_, domain) => (
          <span className="text-sm text-midtone-gray dark:text-zinc-400">
            {domain.stats?.totalAmount || 0}
          </span>
        ),
      },
      {
        title: "占用空间",
        key: "totalSize",
        width: 100,
        render: (_, domain) => (
          <span className="font-mono text-sm text-midtone-gray dark:text-zinc-400">
            {formatSize(domain.stats?.totalSize)}
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
            onChange={(checked) => handleToggleState(record, checked)}
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
            <Tooltip content="编辑主题">
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
    [onEdit, handleToggleState],
  );
}

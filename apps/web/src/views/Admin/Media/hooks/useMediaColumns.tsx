import { useMemo } from "react";
import { debounce } from "es-toolkit";
import toast from "react-hot-toast";
import { BiEditAlt, BiImage } from "react-icons/bi";
import { Button, Switch, type ColumnType, Tooltip } from "@/components";
import { updateWork } from "@/api/web";
import { generateCoverUrl } from "@/mappers/work";
import { formatSize } from "@/utils/format";
import { adminStyles } from "../../styles";

interface UseMediaColumnsOptions {
  getDomainName: (domain: string) => string;
  getCategoryName: (category: string) => string;
  onEdit: (work: Work) => void;
  onRefresh: () => void;
}

// 格式化文件数量
function formatAmount(count: number): string {
  if (count === 0) return "-";
  return `${count} 个`;
}

export function useMediaColumns({
  getDomainName,
  getCategoryName,
  onEdit,
  onRefresh,
}: UseMediaColumnsOptions): ColumnType<Work>[] {
  // 切换状态
  const handleToggleState = debounce(
    async (work: Work) => {
      const newState = work.state === 1 ? 0 : 1;
      const actionText = newState === 1 ? "发布" : "下架";
      const toastId = toast.loading(`${actionText}中...`);

      try {
        await updateWork(work.hash_id, { state: newState });
        toast.success(`已${actionText}`, { id: toastId });
        onRefresh();
      } catch (err) {
        console.error("更新状态失败:", err);
        toast.error(`${actionText}失败`, { id: toastId });
      }
    },
    300,
    { edges: ["leading"] },
  );

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return useMemo(
    () => [
      {
        title: "媒体内容",
        key: "title",
        width: 280,
        render: (_, work) => (
          <div className="group flex items-center gap-3">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px] border border-subtle-ash bg-ghost-gray dark:border-zinc-700 dark:bg-zinc-800">
              {generateCoverUrl(work) ? (
                <img
                  src={generateCoverUrl(work)}
                  alt={work.detail?.title || work.work}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`flex h-full w-full items-center justify-center text-midtone-gray ${
                  generateCoverUrl(work) ? "hidden" : ""
                }`}
              >
                <BiImage className="text-xl" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-sm leading-[1.43] font-medium text-rich-black transition-colors group-hover:text-rich-black dark:text-zinc-100 dark:group-hover:text-zinc-300"
                title={work.detail?.title || work.work}
              >
                {work.detail?.title || work.work}
              </div>
              <div
                className="mt-0.5 truncate font-mono text-[11px] leading-[1.43] text-midtone-gray dark:text-zinc-500"
                title={work.hash_id}
              >
                ID {work.hash_id}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "归属",
        key: "belongs",
        width: 160,
        render: (_, work) => (
          <div className="grid min-w-0 gap-1.5">
            <div className="grid min-w-0 grid-cols-[34px_1fr] items-center gap-2">
              <span className="rounded-[26px] bg-ghost-gray px-1.5 py-0.5 text-center text-[10px] font-medium text-midtone-gray dark:bg-zinc-800 dark:text-zinc-400">
                主题
              </span>
              <span
                className="truncate text-sm font-medium text-rich-black dark:text-zinc-100"
                title={getDomainName(work.domain)}
              >
                {getDomainName(work.domain)}
              </span>
            </div>
            <div className="grid min-w-0 grid-cols-[34px_1fr] items-center gap-2">
              <span className="rounded-[26px] bg-ghost-gray px-1.5 py-0.5 text-center text-[10px] font-medium text-midtone-gray dark:bg-zinc-800 dark:text-zinc-400">
                分类
              </span>
              <span
                className="truncate text-xs text-midtone-gray dark:text-zinc-400"
                title={getCategoryName(work.category)}
              >
                {getCategoryName(work.category)}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: "文件数",
        dataIndex: "detail",
        key: "amount",
        width: 80,
        render: (detail) => (
          <span className="text-sm text-midtone-gray dark:text-zinc-400">
            {formatAmount((detail as WorkDetail)?.amount || 0)}
          </span>
        ),
      },
      {
        title: "大小",
        dataIndex: "detail",
        key: "size",
        width: 100,
        render: (detail) => (
          <span className="font-mono text-sm text-midtone-gray dark:text-zinc-400">
            {formatSize((detail as WorkDetail)?.size || 0)}
          </span>
        ),
      },
      {
        title: "状态",
        dataIndex: "state",
        key: "state",
        width: 110,
        render: (_, work) => (
          <Switch
            checked={work.state === 1}
            onChange={() => handleToggleState(work)}
            checkedChildren="已发布"
            unCheckedChildren="草稿"
            size="sm"
          />
        ),
      },
      {
        title: "创建时间",
        dataIndex: "create_time",
        key: "create_time",
        width: 110,
        render: (time) => (
          <span className="font-mono text-xs text-midtone-gray dark:text-zinc-400">
            {formatDate(time as string)}
          </span>
        ),
      },
      {
        title: "操作",
        key: "action",
        width: 80,
        render: (_, work) => (
          <div className="flex items-center gap-1">
            <Tooltip content="编辑详情">
              <Button
                variant="ghost"
                size="sm"
                shape="circle"
                className={adminStyles.iconButton}
                onClick={() => onEdit(work)}
              >
                <BiEditAlt className="text-base" />
              </Button>
            </Tooltip>
          </div>
        ),
      },
    ],
    [getDomainName, getCategoryName, onEdit, handleToggleState],
  );
}

import { ReactNode, useState } from "react";
import { BiFolder, BiPlay } from "react-icons/bi";
import { Empty, Pagination } from "@/components";

interface FileListPanelProps {
  files: string[];
  pageSize: number;
  onPlay: (file: string) => void;
  /** 自定义每个文件前的图标节点；不传则使用默认占位 */
  renderIcon?: (file: string) => ReactNode;
}

/** 分页文件列表：每页 pageSize 条，点击触发 onPlay。Mixture/Music/Ebook 共用。 */
export default function FileListPanel({
  files,
  pageSize,
  onPlay,
  renderIcon,
}: FileListPanelProps) {
  const [page, setPage] = useState(1);

  if (files.length === 0) {
    return (
      <Empty
        size="lg"
        iconVariant="flat"
        icon={<BiFolder className="h-12 w-12 text-faint" strokeWidth={1} />}
        description="暂无内容"
      />
    );
  }

  const start = (page - 1) * pageSize;
  const pageFiles = files.slice(start, start + pageSize);
  const total = files.length;

  return (
    <div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {pageFiles.map((file, idx) => (
          <div
            key={`${file}-${idx}`}
            className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            onClick={() => onPlay(file)}
          >
            <span className="w-6 shrink-0 text-[13px] font-medium text-slate-300 tabular-nums dark:text-slate-600">
              {String(start + idx + 1).padStart(2, "0")}
            </span>
            <span className="text-slate-400 transition-colors group-hover:text-slate-500 dark:group-hover:text-slate-300">
              {renderIcon?.(file)}
            </span>
            <span className="flex-1 truncate text-[14px] text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
              {file}
            </span>
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              <BiPlay className="h-5 w-5 text-deep-black" />
            </span>
          </div>
        ))}
      </div>
      {total > pageSize && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
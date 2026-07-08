import { BiChevronDown, BiChevronRight, BiMoviePlay, BiImage, BiMusic, BiFile } from "react-icons/bi";
import { getFileType } from "./utils";
import { getFileName } from "@/utils/fileHelper";
import type { SectionItem } from "./types";

/**
 * 手风琴章节组件 Props
 */
interface AccordionSectionProps {
  /** 章节数据 */
  item: SectionItem;
  /** 是否展开 */
  isExpanded: boolean;
  /** 当前选中的文件路径 */
  currentFilePath: string | null;
  /** 切换展开/折叠回调 */
  onToggle: () => void;
  /** 文件点击回调 */
  onFileClick: (filePath: string) => void;
}

/**
 * 根据文件类型获取对应的图标
 */
function getFileIcon(fileName: string, className = "h-4 w-4") {
  const type = getFileType(fileName);
  switch (type) {
    case "video":
      return <BiMoviePlay className={`${className} text-zinc-400`} />;
    case "audio":
      return <BiMusic className={`${className} text-zinc-400`} />;
    case "image":
      return <BiImage className={`${className} text-zinc-400`} />;
    default:
      return <BiFile className={`${className} text-zinc-400`} />;
  }
}

/**
 * 手风琴章节组件
 *
 * 功能特性：
 * - 展开/折叠动画
 * - 显示章节内文件数量
 * - 当前播放文件高亮显示
 * - 根据文件类型显示不同图标
 *
 * DOM 优化：
 * - 折叠时不渲染文件列表（减少 DOM 节点数）
 */
export default function AccordionSection({
  item,
  isExpanded,
  currentFilePath,
  onToggle,
  onFileClick,
}: AccordionSectionProps) {
  // 折叠状态 - 只渲染头部（DOM优化）
  if (!isExpanded) {
    return (
      <div className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
          <span className="font-medium text-zinc-900 dark:text-white">{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800">
              {item.files.length}
            </span>
            <BiChevronRight className="h-5 w-5 text-zinc-400" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
      {/* 展开头部 */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
      >
        <span className="font-medium text-zinc-900 dark:text-white">{item.label}</span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800">
            {item.files.length}
          </span>
          <BiChevronDown className="h-5 w-5 text-zinc-400" />
        </div>
      </button>

      {/* 文件列表 */}
      <div className="max-h-[300px] overflow-y-auto bg-white py-2 dark:bg-zinc-900">
        {item.files.map((file, index) => {
          const isActive = file === currentFilePath;
          const fileName = getFileName(file);

          return (
            <button
              key={file}
              onClick={() => onFileClick(file)}
              className={`group flex w-full items-center gap-3 px-4 py-2 text-left transition-all ${
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              }`}
            >
              {/* 序号 */}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-medium ${
                  isActive
                    ? "bg-rich-black/10 text-rich-black dark:bg-zinc-100/10 dark:text-zinc-100"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                }`}
              >
                {index + 1}
              </span>
              {/* 文件类型图标 */}
              <span className={isActive ? "text-rich-black dark:text-zinc-100" : ""}>{getFileIcon(fileName)}</span>
              {/* 文件名 */}
              <span
                className={`min-w-0 flex-1 truncate text-sm ${isActive ? "font-medium text-rich-black dark:text-zinc-100" : ""}`}
              >
                {fileName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

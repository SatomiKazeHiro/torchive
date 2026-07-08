import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BiX, BiSearch, BiChevronUp, BiChevronDown, BiTrash } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { TXT_READER_PALETTE } from "@/features/common/readerThemes";
import type { SearchResult, SearchState, TxtThemeMode } from "../types";

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchState: SearchState;
  themeMode: TxtThemeMode;
  onSearch: (keyword: string) => void;
  onResultSelect: (result: SearchResult) => void;
  onPrevResult: () => void;
  onNextResult: () => void;
  onClearSearch: () => void;
}

// 主题样式 - 复用 readerThemes palette
const THEME_STYLES = TXT_READER_PALETTE;

export default function SearchDrawer({
  isOpen,
  onClose,
  searchState,
  themeMode,
  onSearch,
  onResultSelect,
  onPrevResult,
  onNextResult,
  onClearSearch,
}: SearchDrawerProps) {
  const theme = THEME_STYLES[themeMode] || THEME_STYLES.parchment;
  const inputRef = useRef<HTMLInputElement>(null);
  const activeResultRef = useRef<HTMLButtonElement>(null);
  const [localKeyword, setLocalKeyword] = useState(searchState.keyword);

  // 同步外部关键词到本地
  useEffect(() => {
    setLocalKeyword(searchState.keyword);
  }, [searchState.keyword]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 搜索结果变化时滚动到当前结果
  useEffect(() => {
    if (isOpen && activeResultRef.current && searchState.results.length > 0) {
      setTimeout(() => {
        activeResultRef.current?.scrollIntoView({
          behavior: "auto",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen, searchState.currentResultIndex, searchState.results.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localKeyword.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result);
  };

  const handleClear = () => {
    setLocalKeyword("");
    onClearSearch();
    inputRef.current?.focus();
  };

  // 渲染高亮文本
  const renderHighlightedText = (
    content: string,
    matches: Array<{ start: number; end: number }>
  ) => {
    if (!matches.length) return content;

    const parts: Array<{ text: string; isHighlight: boolean }> = [];
    let lastEnd = 0;

    for (const match of matches) {
      if (match.start > lastEnd) {
        parts.push({ text: content.slice(lastEnd, match.start), isHighlight: false });
      }
      parts.push({ text: content.slice(match.start, match.end), isHighlight: true });
      lastEnd = match.end;
    }

    if (lastEnd < content.length) {
      parts.push({ text: content.slice(lastEnd), isHighlight: false });
    }

    return parts.map((part, i) =>
      part.isHighlight ? (
        <mark key={i} className={cn("rounded px-0.5", theme.highlight)}>
          {part.text}
        </mark>
      ) : (
        <span key={i}>{part.text}</span>
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 384, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 384, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            "fixed right-0 top-[49px] z-40 h-[calc(100%-49px)] w-96 border-l shadow-2xs",
            theme.bg,
            theme.line
          )}
        >
          {/* 头部 */}
          <div className={cn("border-b px-4 py-3", theme.line)}>
            <div className="flex items-center justify-between">
              <h3 className={cn("font-medium", theme.text)}>搜索</h3>
              <button
                onClick={onClose}
                className={cn("rounded p-1.5 transition-colors", theme.text, theme.buttonHover)}
                title="关闭 (ESC)"
              >
                <BiX className="h-5 w-5" />
              </button>
            </div>

            {/* 搜索输入框 */}
            <form onSubmit={handleSubmit} className="mt-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={localKeyword}
                    onChange={(e) => setLocalKeyword(e.target.value)}
                    placeholder="输入关键词搜索（至少2个字）..."
                    className={cn(
                      "h-9 w-full rounded border px-3 pr-8 text-sm outline-none transition-colors",
                      "focus:border-zinc-400",
                      theme.input
                    )}
                  />
                  {localKeyword && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors",
                        theme.text,
                        "opacity-50 hover:opacity-100"
                      )}
                    >
                      <BiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={localKeyword.trim().length < 2 || searchState.isSearching}
                  className={cn(
                    "flex h-9 items-center justify-center rounded border px-3 text-sm font-medium transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    themeMode === "dark"
                      ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <BiSearch className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* 搜索结果导航 */}
            {searchState.results.length > 0 && (
              <div className={cn("mt-3 flex items-center justify-between text-sm", theme.text)}>
                <span>
                  {searchState.currentResultIndex + 1} / {searchState.results.length}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={onPrevResult}
                    disabled={searchState.currentResultIndex <= 0}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      theme.buttonHover,
                      "disabled:cursor-not-allowed disabled:opacity-30"
                    )}
                  >
                    <BiChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onNextResult}
                    disabled={searchState.currentResultIndex >= searchState.results.length - 1}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      theme.buttonHover,
                      "disabled:cursor-not-allowed disabled:opacity-30"
                    )}
                  >
                    <BiChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClearSearch}
                    className={cn(
                      "ml-2 rounded p-1.5 transition-colors",
                      theme.buttonHover,
                      "text-zinc-500 hover:text-red-500"
                    )}
                    title="清除搜索"
                  >
                    <BiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 搜索结果列表 */}
          <div className="h-[calc(100%-140px)] overflow-y-auto p-2 scrollbar-thin">
            {searchState.isSearching ? (
              <div className={cn("flex h-32 items-center justify-center text-sm", theme.text)}>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                搜索中...
              </div>
            ) : searchState.keyword && searchState.results.length === 0 ? (
              <div className={cn("p-4 text-center text-sm", theme.text)}>
                未找到 &quot;{searchState.keyword}&quot; 相关内容
              </div>
            ) : searchState.results.length === 0 ? (
              <div className={cn("p-4 text-center text-sm opacity-60", theme.text)}>
                {localKeyword.trim().length === 1 
                  ? "请至少输入2个字符进行搜索" 
                  : "输入关键词开始搜索"}
              </div>
            ) : (
              <div className="space-y-1">
                {searchState.results.map((result, index) => {
                  const isActive = index === searchState.currentResultIndex;
                  return (
                    <button
                      key={result.id}
                      ref={isActive ? activeResultRef : null}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full rounded border p-3 text-left text-sm transition-colors",
                        theme.line,
                        isActive
                          ? cn(theme.active, "border-zinc-400")
                          : cn(theme.resultBg, theme.buttonHover)
                      )}
                    >
                      <div className={cn("line-clamp-3", theme.text)}>
                        {renderHighlightedText(result.content, result.matches)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

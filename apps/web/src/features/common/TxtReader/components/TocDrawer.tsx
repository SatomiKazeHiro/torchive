import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BiX } from "react-icons/bi";
import { cn } from "@/components/utils/common";
import { TXT_READER_PALETTE } from "@/features/common/readerThemes";
import type { TocItem, TxtThemeMode } from "../types";

interface TocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tocItems: TocItem[];
  currentTocIndex: number;
  themeMode: TxtThemeMode;
  onTocSelect: (item: TocItem) => void;
}

// 主题样式 - 复用 readerThemes palette
const THEME_STYLES = TXT_READER_PALETTE;

export default function TocDrawer({
  isOpen,
  onClose,
  tocItems,
  currentTocIndex,
  themeMode,
  onTocSelect,
}: TocDrawerProps) {
  const theme = THEME_STYLES[themeMode] || THEME_STYLES.parchment;
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // 打开时滚动到当前章节
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({
          behavior: "auto",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen]);

  const handleTocClick = (item: TocItem) => {
    onTocSelect(item);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            "fixed left-0 top-[49px] z-40 h-[calc(100%-49px)] w-80 border-r shadow-2xs",
            theme.bg,
            theme.line
          )}
        >
          {/* 头部 */}
          <div
            className={cn(
              "flex items-center justify-between border-b px-4 py-3",
              theme.line
            )}
          >
            <h3 className={cn("font-medium", theme.text)}>目录</h3>
            <button
              onClick={onClose}
              className={cn(
                "rounded p-1.5 transition-colors",
                theme.text,
                theme.buttonHover
              )}
              title="关闭 (ESC)"
            >
              <BiX className="h-5 w-5" />
            </button>
          </div>

          {/* 目录列表 */}
          <div className="h-[calc(100%-60px)] overflow-y-auto p-2 scrollbar-thin">
            {tocItems.length === 0 ? (
              <div className={cn("p-4 text-center text-sm", theme.text)}>
                暂无目录
              </div>
            ) : (
              <div className="space-y-0.5">
                {tocItems.map((item, index) => {
                  const isActive = index === currentTocIndex;
                  return (
                    <button
                      key={item.id}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => handleTocClick(item)}
                      className={cn(
                        "w-full rounded px-3 py-2 text-left text-sm transition-colors",
                        theme.text,
                        isActive ? cn(theme.active, "font-medium") : theme.buttonHover,
                        item.level > 1 && "pl-6 text-xs opacity-80"
                      )}
                    >
                      <span className="line-clamp-2">{item.title}</span>
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

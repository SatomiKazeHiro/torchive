import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BiChevronLeft, BiChevronRight, BiChevronsRight } from "react-icons/bi";

import { cn } from "@/components/utils/common";
import { Empty, PosterV2, Tooltip } from "@/components";

export interface HorizontalScrollerItem {
  label: string;
  cover: string;
  link: string;
}

export interface HorizontalScrollerProps {
  title: string;
  items: HorizontalScrollerItem[];
  link?: string;
}

const DOUBLE_CLICK_TIMEOUT = 3000;

export default function HorizontalScroller({ title, items = [], link }: HorizontalScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [lastRightClickTime, setLastRightClickTime] = useState(0);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showEndAction = items.length > 0 && isAtEnd;
  const isEmpty = items.length === 0;

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setIsAtStart(el.scrollLeft <= 1);
    setIsAtEnd(maxScroll <= 1 || el.scrollLeft >= maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollState();

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, [updateScrollState, items]);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth + 16;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

    if (direction === "right") {
      const target = Math.min(el.scrollLeft + scrollAmount, maxScroll);
      el.scrollTo({ left: target, behavior: "smooth" });
      setIsAtStart(false);
      setIsAtEnd(target >= maxScroll - 1);
    } else {
      const target = Math.max(el.scrollLeft - scrollAmount, 0);
      el.scrollTo({ left: target, behavior: "smooth" });
      setIsAtStart(target <= 1);
      setIsAtEnd(target >= maxScroll - 1);
    }
  };

  const handleRightClick = () => {
    if (isEmpty) return;
    if (!showEndAction) {
      scroll("right");
      return;
    }

    if (!link) return;

    const now = Date.now();

    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    if (lastRightClickTime > 0 && now - lastRightClickTime <= DOUBLE_CLICK_TIMEOUT) {
      navigate(link);
      setLastRightClickTime(0);
    } else {
      setLastRightClickTime(now);
      tooltipTimerRef.current = setTimeout(() => {
        setLastRightClickTime(0);
      }, DOUBLE_CLICK_TIMEOUT);
    }
  };

  const resetTooltipTimer = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setLastRightClickTime(0);
  };

  const open = (item: HorizontalScrollerItem) => {
    navigate(item.link);
  };

  const scrollBtnBaseClass = cn(
    "cursor-pointer rounded-full border border-zinc-300 bg-white p-1.5",
    "text-zinc-600 shadow-2xs-soft transition-colors",
    "hover:border-zinc-400 hover:text-zinc-900",
  );
  const scrollBtnDisableClass = cn(
    "cursor-not-allowed rounded-full border border-zinc-200 bg-zinc-50 p-1.5",
    "text-zinc-300 shadow-none transition-colors",
  );

  return (
    <div className="horizontal-scroller-wrap mx-auto mt-12 max-w-7xl">
      <div className="mb-5 flex items-center gap-2">
        {link ? (
          <button
            onClick={() => navigate(link)}
            className="group flex cursor-pointer items-center gap-1 transition-colors"
          >
            <span className="text-xl font-medium text-zinc-900 group-hover:text-zinc-600">
              {title}
            </span>
            <BiChevronRight
              size={20}
              className="text-zinc-400 transition-colors group-hover:text-zinc-600"
            />
          </button>
        ) : (
          <span className="text-xl font-medium text-zinc-900">{title}</span>
        )}
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          {/* 左按钮：只有在左侧未到头时才显示 */}
          <button
            onClick={() => scroll("left")}
            className={isAtStart ? scrollBtnDisableClass : scrollBtnBaseClass}
          >
            <BiChevronLeft size={16} />
          </button>

          {/* 右按钮 */}
          {isEmpty ? (
            <button disabled className={scrollBtnDisableClass} aria-label="暂无内容">
              <BiChevronRight size={16} />
            </button>
          ) : showEndAction && link ? (
            <Tooltip
              content={
                <div>
                  再点击一次
                  <br />
                  打开更多
                </div>
              }
              position="top"
              trigger="click"
              duration={3000}
            >
              <button
                onClick={handleRightClick}
                onMouseLeave={resetTooltipTimer}
                className={scrollBtnBaseClass}
              >
                <BiChevronsRight size={16} />
              </button>
            </Tooltip>
          ) : (
            <button onClick={handleRightClick} className={scrollBtnBaseClass}>
              {showEndAction ? <BiChevronsRight size={16} /> : <BiChevronRight size={16} />}
            </button>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <Empty className="opacity-50" description="暂无内容" />
      ) : (
        <div className="relative">
          {/* 可视窗口 */}
          <div ref={containerRef} className="overflow-hidden scroll-smooth">
            {/* 内容轨道 */}
            <div className="flex gap-4">
              {items.map((item, i) => (
                <div key={i} className="w-[200px] shrink-0 p-px">
                  <a
                    className="group block cursor-pointer"
                    title={item.label}
                    onClick={() => open(item)}
                  >
                    <PosterV2 src={item.cover} alt={item.label} />
                    <div className="mt-2 line-clamp-2 text-sm text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                      {item.label}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

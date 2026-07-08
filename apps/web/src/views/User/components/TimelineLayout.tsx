import { useEffect, useRef, useState, useCallback } from "react";
import { groupByDate } from "../utils/date-group";

interface TimelineItem {
  id: number;
  work_hash_id: string;
  time?: string;
  work?: Work;
  [key: string]: unknown;
}

interface TimelineLayoutProps<T extends TimelineItem> {
  items: T[];
  getTime: (item: T) => string | Date | undefined;
  renderCard: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyState?: React.ReactNode;
  header?: React.ReactNode;
}

export default function TimelineLayout<T extends TimelineItem>({
  items,
  getTime,
  renderCard,
  loading,
  emptyState,
  header,
}: TimelineLayoutProps<T>) {
  const groups = groupByDate(items, getTime);
  const [activeKey, setActiveKey] = useState<string>(groups[0]?.key || "");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // IntersectionObserver 检测当前可见分组
  useEffect(() => {
    if (groups.length === 0) return;

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      if (isScrollingRef.current) return;

      // 找到可见比例最大的分组
      let maxRatio = 0;
      let bestKey = "";

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          bestKey = entry.target.getAttribute("data-group-key") || "";
        }
      }

      if (bestKey) {
        setActiveKey(bestKey);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "-80px 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    sectionRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [groups]);

  // 注册 section ref
  const registerSection = useCallback((key: string, el: HTMLElement | null) => {
    if (el) {
      sectionRefs.current.set(key, el);
      observerRef.current?.observe(el);
    } else {
      const old = sectionRefs.current.get(key);
      if (old) {
        observerRef.current?.unobserve(old);
      }
      sectionRefs.current.delete(key);
    }
  }, []);

  // 点击左侧标签滚动到对应分组
  const scrollToGroup = useCallback((key: string) => {
    const el = sectionRefs.current.get(key);
    if (!el) return;

    isScrollingRef.current = true;
    setActiveKey(key);

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-faint">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-edge border-t-faint" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="relative flex gap-6">
      {/* 左侧时间轴 */}
      {groups.length > 0 && (
        <div className="hidden w-20 flex-shrink-0 md:block">
          <div className="sticky top-24">
            <div className="relative pl-3">
              {/* 垂直线 */}
              <div className="absolute top-2 bottom-2 left-[5px] w-px bg-edge" />

              {/* 标签列表 */}
              <div className="space-y-6">
                {groups.map((group) => {
                  const isActive = group.key === activeKey;
                  return (
                    <button
                      key={group.key}
                      onClick={() => scrollToGroup(group.key)}
                      className="group relative flex w-full items-center gap-2 text-left"
                    >
                      {/* 圆点 */}
                      <div
                        className={`relative z-10 h-[11px] w-[11px] rounded-full border-2 transition-all ${
                          isActive
                            ? "border-accent bg-accent"
                            : "border-edge bg-card group-hover:border-secondary"
                        }`}
                      />
                      {/* 标签文字 */}
                      <span
                        className={`text-xs transition-colors ${
                          isActive
                            ? "font-medium text-primary"
                            : "text-faint group-hover:text-secondary"
                        }`}
                      >
                        {group.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 右侧内容 */}
      <div className="min-w-0 flex-1">
        {header}

        <div className="space-y-10">
          {groups.map((group) => (
            <section
              key={group.key}
              ref={(el) => registerSection(group.key, el)}
              data-group-key={group.key}
            >
              {/* 分组标题 */}
              <div className="mb-4 flex items-center gap-3">
                <div className="hidden md:block h-2 w-2 rounded-full bg-accent" />
                <h2 className="text-lg md:text-sm font-bold md:font-medium text-primary">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-edge-subtle" />
              </div>

              {/* 卡片列表：使用 Grid 布局，每行多个 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {group.items.map((item) => (
                  <div key={item.id}>{renderCard(item)}</div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

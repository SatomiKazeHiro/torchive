/**
 * 日期分组工具
 * 将时间字符串分组为：今天、昨天、近一周、近一月、更早
 */

export interface DateGroup<T> {
  label: string;
  key: string;
  items: T[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function stripTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  const diff = stripTime(a).getTime() - stripTime(b).getTime();
  return Math.round(diff / MS_PER_DAY);
}

function getDateLabel(dateStr: string | Date, now: Date = new Date()): string {
  const date = new Date(dateStr);
  const days = daysBetween(now, date);

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return "近一周";
  if (days < 30) return "近一月";
  return "更早";
}

/**
 * 按日期分组数据
 * @param items 数据项数组
 * @param getTime 获取时间字符串的函数
 * @returns 按日期分组后的数组
 */
export function groupByDate<T>(
  items: T[],
  getTime: (item: T) => string | Date | undefined
): DateGroup<T>[] {
  const now = new Date();
  const groupMap = new Map<string, { label: string; items: T[] }>();

  // 定义分组顺序
  const orderKeys = ["today", "yesterday", "week", "month", "older"];
  const keyToLabel: Record<string, string> = {
    today: "今天",
    yesterday: "昨天",
    week: "近一周",
    month: "近一月",
    older: "更早",
  };

  for (const item of items) {
    const timeStr = getTime(item);
    if (!timeStr) {
      // 没有时间的数据归入"更早"
      const key = "older";
      if (!groupMap.has(key)) {
        groupMap.set(key, { label: keyToLabel[key], items: [] });
      }
      groupMap.get(key)!.items.push(item);
      continue;
    }

    const label = getDateLabel(timeStr, now);
    const key =
      label === "今天"
        ? "today"
        : label === "昨天"
          ? "yesterday"
          : label === "近一周"
            ? "week"
            : label === "近一月"
              ? "month"
              : "older";

    if (!groupMap.has(key)) {
      groupMap.set(key, { label, items: [] });
    }
    groupMap.get(key)!.items.push(item);
  }

  // 按预定顺序返回
  const result: DateGroup<T>[] = [];
  for (const key of orderKeys) {
    const group = groupMap.get(key);
    if (group && group.items.length > 0) {
      result.push({
        key,
        label: group.label,
        items: group.items,
      });
    }
  }
  return result;
}

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BiTime, BiTrash, BiPlay } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import {
  getUserHistories,
  deleteUserHistory,
  clearUserHistories,
  getWork,
} from "@/api/web";
import { confirm } from "@/components/Modal/modal";
import { PageHeader, EmptyState } from "@/components";
import toast from "react-hot-toast";
import TimelineLayout from "../components/TimelineLayout";
import TimelineWorkCard from "../components/TimelineWorkCard";

interface HistoryItem {
  id: number;
  work_hash_id: string;
  params?: string;
  create_time?: string | Date;
  update_time?: string | Date;
  work?: Work;
  [key: string]: unknown;
}

function HistoryView() {
  const { user } = useUser();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getUserHistories(user.uid);
      const histories = (res.data || []) as UserHistory[];
      const list: HistoryItem[] = histories.map((h) => ({
        id: h.id,
        work_hash_id: h.work_hash_id,
        params: h.params,
        create_time: h.create_time,
        update_time: h.update_time,
      }));

      // 并行获取作品详情
      const uniqueIds = [...new Set(list.map((i) => i.work_hash_id))];
      const workMap = new Map<string, Work>();
      await Promise.all(
        uniqueIds.map(async (hash_id) => {
          try {
            const res = await getWork(hash_id);
            if (res.data) {
              workMap.set(hash_id, res.data);
            }
          } catch {
            // ignore missing work
          }
        }),
      );

      // 按时间降序排列（最新的在前面）
      const sortedList = list.sort((a, b) => {
        const ta = new Date(b.update_time || b.create_time || 0).getTime();
        const tb = new Date(a.update_time || a.create_time || 0).getTime();
        return ta - tb;
      });

      setItems(
        sortedList.map((item) => ({
          ...item,
          work: workMap.get(item.work_hash_id),
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  const handleDelete = (id: number) => {
    confirm({
      title: "删除记录",
      content: "确定要删除这条观看记录吗？",
      type: "warning",
      okText: "删除",
      onOk: async () => {
        await deleteUserHistory(id);
        toast.success("已删除记录");
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
    });
  };

  const handleClearAll = () => {
    if (!user) return;
    confirm({
      title: "清空历史",
      content: "确定要清空所有观看历史吗？此操作不可恢复。",
      type: "warning",
      okText: "清空",
      onOk: async () => {
        await clearUserHistories(user.uid);
        toast.success("已清空历史");
        setItems([]);
      },
    });
  };

  const formatTime = (time?: string | Date) => {
    if (!time) return "";
    const date = new Date(time);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const emptyState = (
    <EmptyState
      icon={<BiTimeEmpty />}
      title="暂无观看记录"
      description="开始观看内容后将显示在这里"
      action={
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:opacity-90 2xs-soft"
        >
          <BiPlay size={18} className="mr-1.5" />
          去发现
        </Link>
      }
    />
  );

  return (
    <div id="history-page" className="pb-10 pt-6">
      <PageHeader
        icon={BiTime}
        title="观看历史"
        count={<>{items.length} 条记录</>}
        action={
          items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-full border border-edge bg-card px-4 py-1.5 text-sm font-medium text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400 2xs-soft"
            >
              <BiTrash size={16} />
              清空历史
            </button>
          )
        }
      />

      <div className="min-h-[400px] rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
        <TimelineLayout
          items={items}
          getTime={(item) => item.update_time || item.create_time}
          loading={loading}
          emptyState={emptyState}
          renderCard={(item) => (
            <TimelineWorkCard
              work={item.work}
              workHashId={item.work_hash_id}
              actionLabel="继续观看"
              linkState={item.params ? { filePath: item.params } : undefined}
              extraInfo={
                <div className="flex items-center gap-1.5 w-full">
                  {item.update_time || item.create_time ? (
                    <span className="whitespace-nowrap rounded bg-subtle px-1.5 py-0.5 text-[11px] font-medium text-muted">
                      {formatTime(item.update_time || item.create_time)}
                    </span>
                  ) : null}
                  {item.params && (
                    <span className="truncate text-[11px] text-faint">
                      看到 {item.params.split("/").pop()}
                    </span>
                  )}
                </div>
              }
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      </div>
    </div>
  );
}

function BiTimeEmpty() {
  return (
    <svg
      className="h-8 w-8 text-faint"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default HistoryView;

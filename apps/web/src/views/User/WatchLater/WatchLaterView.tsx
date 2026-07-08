import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BiBookmark, BiTrash, BiPlay } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import {
  getUserWatchLaters,
  deleteUserWatchLater,
  clearUserWatchLaters,
  getWork,
} from "@/api/web";
import { confirm } from "@/components/Modal/modal";
import { PageHeader, EmptyState } from "@/components";
import toast from "react-hot-toast";
import TimelineLayout from "../components/TimelineLayout";
import TimelineWorkCard from "../components/TimelineWorkCard";

interface WatchLaterItem {
  id: number;
  work_hash_id: string;
  create_time?: string | Date;
  work?: Work;
  [key: string]: unknown;
}

function WatchLaterView() {
  const { user } = useUser();
  const [items, setItems] = useState<WatchLaterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatchLaters = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getUserWatchLaters(user.uid);
      const watchLaters = (res.data || []) as UserWatchLater[];
      const list: WatchLaterItem[] = watchLaters.map((w) => ({
        id: w.id,
        work_hash_id: w.work_hash_id,
        create_time: w.create_time,
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

      // 按时间降序排列
      const sortedList = list.sort((a, b) => {
        const ta = new Date(b.create_time || 0).getTime();
        const tb = new Date(a.create_time || 0).getTime();
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
    loadWatchLaters();
  }, [loadWatchLaters]);

  const handleDelete = (id: number) => {
    confirm({
      title: "移除记录",
      content: "确定要移除此条稍后再看吗？",
      type: "warning",
      okText: "移除",
      onOk: async () => {
        await deleteUserWatchLater(id);
        toast.success("已移除");
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
    });
  };

  const handleClearAll = () => {
    if (!user) return;
    confirm({
      title: "清空列表",
      content: "确定要清空稍后再看列表吗？此操作不可恢复。",
      type: "warning",
      okText: "清空",
      onOk: async () => {
        await clearUserWatchLaters(user.uid);
        toast.success("已清空");
        setItems([]);
      },
    });
  };

  const emptyState = (
    <EmptyState
      icon={<BiBookmarkEmpty />}
      title="暂无稍后再看"
      description="将想看的内容添加到这里，随时可以观看"
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
    <div id="watch-later-page" className="pb-10 pt-6">
      <PageHeader
        icon={BiBookmark}
        title="稍后再看"
        count={<>{items.length} 个内容</>}
        action={
          items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-full border border-edge bg-card px-4 py-1.5 text-sm font-medium text-secondary transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400 2xs-soft"
            >
              <BiTrash size={16} />
              清空列表
            </button>
          )
        }
      />

      <div className="min-h-[400px] rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
        <TimelineLayout
          items={items}
          getTime={(item) => item.create_time}
          loading={loading}
          emptyState={emptyState}
          renderCard={(item) => (
            <TimelineWorkCard
              work={item.work}
              workHashId={item.work_hash_id}
              actionLabel="立即观看"
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      </div>
    </div>
  );
}

function BiBookmarkEmpty() {
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
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

export default WatchLaterView;

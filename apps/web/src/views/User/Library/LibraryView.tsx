import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BiHeart, BiPlay } from "react-icons/bi";
import toast from "react-hot-toast";

import { useUser } from "@/contexts/useUser";
import { getUserFavorites, deleteUserFavorite, getWork } from "@/api/web";
import { confirm } from "@/components/Modal/modal";
import { PageHeader, EmptyState } from "@/components";
import TimelineWorkCard from "../components/TimelineWorkCard";

interface FavoriteItem {
  id: number;
  work_hash_id: string;
  work?: Work;
}

function LibraryView() {
  const { user } = useUser();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getUserFavorites(user.uid);
      const favorites = (res.data || []) as UserFavorite[];
      const list: FavoriteItem[] = favorites.map((f) => ({
        id: f.id,
        work_hash_id: f.work_hash_id,
      }));

      // 分批并行获取作品详情（每批 10 个，避免一次性发起过多并发请求）
      const uniqueIds = [...new Set(list.map((i) => i.work_hash_id))];
      const workMap = new Map<string, Work>();
      const BATCH_SIZE = 10;
      for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
        const batch = uniqueIds.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (hash_id) => {
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
      }

      setItems(
        list.map((item) => ({
          ...item,
          work: workMap.get(item.work_hash_id),
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleDelete = (id: number) => {
    confirm({
      title: "取消收藏",
      content: "确定要取消收藏此作品吗？",
      type: "warning",
      okText: "取消收藏",
      onOk: async () => {
        await deleteUserFavorite(id);
        toast.success("已取消收藏");
        setItems((prev) => prev.filter((i) => i.id !== id));
      },
    });
  };

  return (
    <div id="library-page" className="pb-10 pt-6">
      <PageHeader
        icon={BiHeart}
        title="我的收藏"
        count={<>{items.length} 个内容</>}
      />

      <div className="min-h-[400px] rounded-2xl border border-edge-subtle bg-card p-6 md:p-8 2xs-soft">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-faint">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-edge border-t-faint" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <TimelineWorkCard
                key={item.id}
                work={item.work}
                workHashId={item.work_hash_id}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BiHeartEmpty />}
            title="暂无收藏"
            description="去发现更多精彩内容吧"
            action={
              <Link
                to="/"
                className="inline-flex items-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-on-accent transition-colors hover:opacity-90 2xs-soft"
              >
                <BiPlay size={18} className="mr-1.5" />
                去浏览
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

function BiHeartEmpty() {
  return (
    <svg className="h-8 w-8 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default LibraryView;

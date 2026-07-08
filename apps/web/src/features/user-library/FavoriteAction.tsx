import { useState, useEffect, useCallback, useMemo } from "react";
import { BiHeart, BiSolidHeart } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import { getUserFavorites, createUserFavorite, deleteUserFavorite } from "@/api/web";
import toast from "react-hot-toast";

interface FavoriteActionProps {
  work: Work;
  activeSlot?: React.ReactNode;
  inactiveSlot?: React.ReactNode;
  className?: string;
  title?: string;
  children?: (state: {
    isActive: boolean;
    toggle: () => void;
    loading: boolean;
  }) => React.ReactNode;
}

export default function FavoriteAction({
  work,
  activeSlot,
  inactiveSlot,
  className = "inline-flex items-center justify-center transition-colors disabled:opacity-50",
  title,
  children,
}: FavoriteActionProps) {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const hashId = work.hash_id;

  const isActive = useMemo(() => {
    return favorites.some((f) => f.work_hash_id === hashId);
  }, [favorites, hashId]);

  const activeItem = useMemo(() => {
    return favorites.find((f) => f.work_hash_id === hashId);
  }, [favorites, hashId]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUserFavorites(user.uid);
      setFavorites((res.data || []) as UserFavorite[]);
    } catch {
      // ignore
    } finally {
      setInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    setLoading(true);
    try {
      if (isActive && activeItem) {
        await deleteUserFavorite(activeItem.id);
        setFavorites((prev) => prev.filter((f) => f.id !== activeItem.id));
        toast.success("已取消收藏");
      } else {
        const res = await createUserFavorite({ uid: user.uid, work_hash_id: hashId });
        if (res.data) {
          setFavorites((prev) => [...prev, res.data as UserFavorite]);
          toast.success("已收藏");
        }
      }
    } catch {
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  }, [user, isActive, activeItem, hashId]);

  if (children) {
    return <>{children({ isActive, toggle, loading })}</>;
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || !initialized}
      className={className}
      title={title ?? (isActive ? "已收藏" : "收藏")}
    >
      {isActive
        ? (activeSlot ?? <BiSolidHeart size={18} className="fill-red-500 text-red-500" />)
        : (inactiveSlot ?? <BiHeart size={18} className="text-zinc-500" />)}
    </button>
  );
}

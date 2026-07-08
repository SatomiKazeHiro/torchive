import { useState, useEffect, useCallback, useMemo } from "react";
import { BiBookmark, BiSolidBookmark } from "react-icons/bi";
import { useUser } from "@/contexts/useUser";
import { getUserWatchLaters, createUserWatchLater, deleteUserWatchLater } from "@/api/web";
import toast from "react-hot-toast";

interface WatchLaterActionProps {
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

export default function WatchLaterAction({
  work,
  activeSlot,
  inactiveSlot,
  className = "inline-flex items-center justify-center transition-colors disabled:opacity-50",
  title,
  children,
}: WatchLaterActionProps) {
  const { user } = useUser();
  const [watchLaters, setWatchLaters] = useState<UserWatchLater[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const hashId = work.hash_id;

  const isActive = useMemo(() => {
    return watchLaters.some((w) => w.work_hash_id === hashId);
  }, [watchLaters, hashId]);

  const activeItem = useMemo(() => {
    return watchLaters.find((w) => w.work_hash_id === hashId);
  }, [watchLaters, hashId]);

  const loadWatchLaters = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUserWatchLaters(user.uid);
      setWatchLaters((res.data || []) as UserWatchLater[]);
    } catch {
      // ignore
    } finally {
      setInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    loadWatchLaters();
  }, [loadWatchLaters]);

  const toggle = useCallback(async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    setLoading(true);
    try {
      if (isActive && activeItem) {
        await deleteUserWatchLater(activeItem.id);
        setWatchLaters((prev) => prev.filter((w) => w.id !== activeItem.id));
        toast.success("已移除");
      } else {
        const res = await createUserWatchLater({ uid: user.uid, work_hash_id: hashId });
        if (res.data) {
          setWatchLaters((prev) => [...prev, res.data as UserWatchLater]);
          toast.success("已标记稍后再看");
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
      title={title ?? (isActive ? "已标记稍后再看" : "稍后再看")}
    >
      {isActive
        ? (activeSlot ?? <BiSolidBookmark size={18} className="text-deep-black" />)
        : (inactiveSlot ?? <BiBookmark size={18} className="text-zinc-500" />)}
    </button>
  );
}

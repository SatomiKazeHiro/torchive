import { BiRefresh, BiSkipNext } from "react-icons/bi";

export interface EndScreenProps {
  /** 是否有下一个视频 */
  hasNext: boolean;
  /** 倒计时秒数 */
  countdown: number;
  /** 重播回调 */
  onReplay: () => void;
  /** 播放下一个回调 */
  onPlayNext: () => void;
}

const btnClassName =
  "group flex flex-col items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-4 transition-all hover:scale-105 hover:bg-white/20";

/**
 * 视频播放结束画面组件
 *
 * 功能：
 * - 显示重播按钮
 * - 显示播放下一个按钮（带倒计时）
 * - 支持 Tailwind CSS 样式
 */
export function EndScreen({ hasNext, countdown, onReplay, onPlayNext }: EndScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        {/* 重播按钮 */}
        <button onClick={onReplay} className={btnClassName}>
          <BiRefresh className="h-8 w-8 text-white" />
          <span className="text-sm font-medium text-white">重播</span>
        </button>

        {/* 分割线 */}
        <div className="h-16 w-px bg-white/20" />

        {/* 播放下一个按钮 */}
        {hasNext ? (
          <button onClick={onPlayNext} className={btnClassName}>
            <BiSkipNext className="h-8 w-8 text-white dark:text-zinc-900" />
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white dark:text-zinc-900">下一个</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs text-white dark:bg-zinc-900/20 dark:text-zinc-900">
                {countdown}s
              </span>
            </div>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-8 py-4 opacity-50">
            <BiSkipNext className="h-8 w-8 text-white/50" />
            <span className="text-sm font-medium text-white/50">没有更多了</span>
          </div>
        )}
      </div>
    </div>
  );
}
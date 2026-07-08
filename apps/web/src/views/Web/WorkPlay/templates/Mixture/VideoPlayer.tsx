import { BiPlay, BiPause, BiVolumeFull, BiVolumeMute } from "react-icons/bi";
import type { ViewerProps } from "./types";
import { formatTime } from "@/utils/format";
import { useVideoPlayer } from "./hooks";

/**
 * 视频播放器组件
 *
 * 功能特性：
 * - 播放/暂停控制
 * - 静音切换
 * - 进度条拖动
 * - 控制栏自动隐藏（播放时 3 秒后隐藏，鼠标移动时显示）
 *
 * 技术实现：
 * - 使用 useVideoPlayer Hook 管理播放逻辑
 * - 使用 ahooks 的 useUnmount 清理定时器
 */
export default function VideoPlayer({ src, fileName }: ViewerProps) {
  const {
    isPlaying,
    isMuted,
    progress,
    currentTime,
    duration,
    showControls,
    videoRef,
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleSeek,
    handleMouseMove,
    handleMouseLeave,
  } = useVideoPlayer();

  return (
    <div
      className="group relative aspect-video h-full w-full bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          // 视频结束时更新播放状态
          // 注意：这里不需要调用 setIsPlaying，因为视频元素会暂停
        }}
        onClick={togglePlay}
      />

      {/* 播放按钮覆盖层（暂停时显示） */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zinc-900 shadow-2xs transition-transform hover:scale-105"
          >
            <BiPlay className="h-8 w-8" />
          </button>
        </div>
      )}

      {/* 底部控制栏 */}
      <div
        className={`absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-12 pb-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 进度条 */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white transition-colors hover:text-zinc-300"
            >
              {isPlaying ? <BiPause className="h-6 w-6" /> : <BiPlay className="h-6 w-6" />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white transition-colors hover:text-zinc-300"
            >
              {isMuted ? (
                <BiVolumeMute className="h-5 w-5" />
              ) : (
                <BiVolumeFull className="h-5 w-5" />
              )}
            </button>
            <span className="text-sm text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <span className="max-w-xs truncate text-sm text-white/50">{fileName}</span>
        </div>
      </div>
    </div>
  );
}

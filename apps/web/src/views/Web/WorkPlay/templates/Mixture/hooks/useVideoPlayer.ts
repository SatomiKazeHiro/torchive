import { useState, useRef, useCallback } from "react";
import { useUnmount } from "ahooks";

interface UseVideoPlayerReturn {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否静音 */
  isMuted: boolean;
  /** 播放进度 (0-100) */
  progress: number;
  /** 当前时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 是否显示控制栏 */
  showControls: boolean;
  /** 视频元素引用 */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** 切换播放/暂停 */
  togglePlay: () => void;
  /** 切换静音 */
  toggleMute: () => void;
  /** 处理时间更新 */
  handleTimeUpdate: () => void;
  /** 处理元数据加载完成 */
  handleLoadedMetadata: () => void;
  /** 处理进度条拖动 */
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 处理鼠标移动（显示控制栏） */
  handleMouseMove: () => void;
  /** 处理鼠标离开 */
  handleMouseLeave: () => void;
}

/**
 * 视频播放器 Hook
 *
 * 功能：
 * - 播放/暂停控制
 * - 静音切换
 * - 进度追踪和跳转
 * - 控制栏自动隐藏
 *
 * 使用 ahooks：
 * - useUnmount: 清理定时器
 */
export function useVideoPlayer(): UseVideoPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 切换播放/暂停
   */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  /**
   * 切换静音
   */
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  /**
   * 处理时间更新
   */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    const dur = video.duration;
    setCurrentTime(current);
    setProgress((current / dur) * 100);
  }, []);

  /**
   * 处理元数据加载完成
   */
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  /**
   * 处理进度条拖动
   */
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);

    const video = videoRef.current;
    if (!video) return;
    video.currentTime = (newProgress / 100) * video.duration;
  }, []);

  /**
   * 延迟隐藏控制栏
   */
  const hideControlsDelayed = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  /**
   * 处理鼠标移动 - 显示控制栏并设置自动隐藏
   */
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsDelayed();
  }, [hideControlsDelayed]);

  /**
   * 处理鼠标离开
   */
  const handleMouseLeave = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  // 使用 ahooks useUnmount 清理定时器
  useUnmount(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  });

  return {
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
  };
}

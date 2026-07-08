import { useState, useRef, useEffect, useCallback } from "react";
import { useEventListener, useUnmount } from "ahooks";

interface UseAudioPlayerOptions {
  /** 音频文件 URL */
  src: string;
}

interface UseAudioPlayerReturn {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 音频总时长（秒） */
  duration: number;
  /** 音频元素引用 */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 切换播放/暂停 */
  togglePlay: () => void;
  /** 跳转到指定位置（通过点击进度条） */
  handleSeek: (e: React.MouseEvent<HTMLDivElement>, containerWidth: number) => void;
  /** 后退 10 秒 */
  skipBackward: () => void;
  /** 前进 10 秒 */
  skipForward: () => void;
}

/**
 * 音频播放器 Hook
 * 
 * 使用 ahooks 的 useEventListener 简化事件监听管理
 * 使用 useUnmount 确保组件卸载时正确清理
 */
export function useAudioPlayer({ src }: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSeekingRef = useRef(false);

  // 切换音频时重置状态
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = src;
    audio.load();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  // 使用 ahooks useEventListener 管理音频事件，自动处理绑定和解绑
  useEventListener(
    "timeupdate",
    () => {
      const audio = audioRef.current;
      if (audio && !isSeekingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    },
    { target: audioRef }
  );

  useEventListener(
    "loadedmetadata",
    () => {
      const audio = audioRef.current;
      if (audio) {
        setDuration(audio.duration || 0);
      }
    },
    { target: audioRef }
  );

  useEventListener("ended", () => setIsPlaying(false), { target: audioRef });
  useEventListener("play", () => setIsPlaying(true), { target: audioRef });
  useEventListener("pause", () => setIsPlaying(false), { target: audioRef });

  // 组件卸载时确保音频停止（使用 ahooks useUnmount）
  useUnmount(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  });

  /** 切换播放/暂停状态 */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  /** 处理进度条点击跳转 */
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>, containerWidth: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / containerWidth));
    const newTime = percentage * duration;

    if (isFinite(newTime)) {
      isSeekingRef.current = true;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      setTimeout(() => { isSeekingRef.current = false; }, 50);
    }
  }, [duration]);

  /** 后退 10 秒 */
  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, audio.currentTime - 10);
    if (isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  /** 前进 10 秒 */
  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const newTime = Math.min(duration, audio.currentTime + 10);
    if (isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  return {
    isPlaying,
    currentTime,
    duration,
    audioRef,
    togglePlay,
    handleSeek,
    skipBackward,
    skipForward,
  };
}

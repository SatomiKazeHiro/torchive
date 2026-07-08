import { useEffect, useRef, useState, useCallback } from "react";
import { useUnmount } from "ahooks";

interface WaveformProps {
  /** 音频文件 URL */
  src: string;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 音频总时长（秒） */
  duration: number;
  /** 波形图高度 */
  height?: number;
  /** 点击跳转回调 */
  onSeek?: (time: number) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 波形图组件
 * 
 * 使用 wavesurfer.js 渲染音频波形
 * 使用 ahooks useUnmount 确保组件卸载时正确销毁实例
 */
export function Waveform({ src, currentTime, duration, height = 40, onSeek, className = "" }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 清理函数 - 销毁 WaveSurfer 实例和 AbortController
   */
  const cleanup = useCallback(() => {
    // 取消进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 销毁 WaveSurfer 实例
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy();
      } catch {
        // 忽略销毁错误
      }
      wavesurferRef.current = null;
    }
    
    setLoaded(false);
    setIsReady(false);
  }, []);

  // 使用 ahooks useUnmount 确保组件卸载时调用清理
  useUnmount(cleanup);

  // 初始化 WaveSurfer
  useEffect(() => {
    // 先清理旧实例
    cleanup();
    
    if (!containerRef.current) return;

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    let isMounted = true;

    import("wavesurfer.js").then((module) => {
      // 检查是否已取消
      if (signal.aborted || !isMounted || !containerRef.current) return;

      const WaveSurfer = module.default;
      
      try {
        wavesurferRef.current = WaveSurfer.create({
          container: containerRef.current,
          waveColor: "#d4d4d8",
          progressColor: "#18181b",
          cursorColor: "transparent",
          barWidth: 2,
          barGap: 1,
          barRadius: 1,
          height,
          interact: true,
        });

        // 监听 ready 事件
        wavesurferRef.current.on("ready", () => {
          if (!signal.aborted && isMounted) {
            setLoaded(true);
            setIsReady(true);
          }
        });

        // 监听错误事件
        wavesurferRef.current.on("error", (err: Error) => {
          if (!signal.aborted && isMounted) {
            console.warn("Waveform error:", err);
            setLoaded(false);
          }
        });

        // 监听交互事件（点击跳转）
        wavesurferRef.current.on("interaction", () => {
          if (!wavesurferRef.current || signal.aborted) return;
          
          const wsTime = wavesurferRef.current.getCurrentTime();
          if (isFinite(wsTime) && wsTime >= 0 && onSeek) {
            onSeek(wsTime);
          }
        });

        // 加载音频
        wavesurferRef.current.load(src).catch((err: Error) => {
          // 忽略中止错误
          if (err.name === "AbortError") return;
          if (!signal.aborted && isMounted) {
            console.warn("Failed to load waveform:", err);
          }
        });
      } catch (err) {
        if (!signal.aborted && isMounted) {
          console.warn("Failed to create waveform:", err);
        }
      }
    }).catch((err) => {
      if (!signal.aborted && isMounted) {
        console.warn("Failed to import wavesurfer:", err);
      }
    });

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [src, height, onSeek, cleanup]);

  // 同步波形进度
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;
    
    const progress = duration > 0 ? currentTime / duration : 0;
    if (isFinite(progress) && progress >= 0 && progress <= 1) {
      try {
        wavesurferRef.current.seekTo(progress);
      } catch {
        // 忽略 seek 错误
      }
    }
  }, [currentTime, duration, isReady]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}

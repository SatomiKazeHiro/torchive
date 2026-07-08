import { useEffect, useMemo, useRef } from "react";
import Artplayer from "artplayer";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import { useUnmount } from "ahooks";
import type { Danmu } from "./types";
import type { ViewerProps } from "../types";
import { loadAssDanmuku } from "./assParser";
import { EndScreenManager, type EndScreenManagerConfig } from "./EndScreenManager";
import { getBaseName, getFileName } from "@/utils/fileHelper";
import "./style.less";

// 字幕文件扩展名
type SubtitleExt = "vtt" | "ass" | "srt";
const SUBTITLE_EXTENSIONS = ["vtt", "ass", "srt"];

// 播放下一个视频的倒计时秒数
const NEXT_VIDEO_COUNTDOWN = 5;

/**
 * 判断是否为字幕文件
 */
function isSubtitleFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return SUBTITLE_EXTENSIONS.includes(ext);
}

/**
 * 获取文件扩展名
 */
function getFileExt(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath;
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

/**
 * 查找视频对应的字幕文件
 */
function findSubtitleFile(
  videoPath: string,
  allFiles: string[],
): { url: string; type: SubtitleExt } | null {
  const videoName = getBaseName(getFileName(videoPath));

  const matchedFile = allFiles.filter(isSubtitleFile).find((file) => {
    const fileNameWithoutExt = getBaseName(getFileName(file));
    return fileNameWithoutExt.toLowerCase() === videoName.toLowerCase();
  });

  if (!matchedFile) return null;

  const ext = getFileExt(matchedFile);
  if (!SUBTITLE_EXTENSIONS.includes(ext)) return null;

  return { url: matchedFile, type: ext as SubtitleExt };
}

interface ArtPlayerVideoProps extends ViewerProps {
  /** 所有文件列表（用于查找字幕） */
  allFiles: string[];
  /** 是否有下一个视频 */
  hasNext?: boolean;
  /** 重播回调 */
  onReplay?: () => void;
  /** 播放下一个回调 */
  onPlayNext?: () => void;
  /** 播放重 */
  onPlaying?: (isPlaying: boolean) => void;
}

/**
 * ArtPlayer 视频播放器组件
 *
 * 功能特性：
 * - 使用 ArtPlayer 作为播放器核心
 * - 自动检测并加载同名字幕文件（.vtt, .ass, .srt）
 * - 支持字幕切换和样式调整
 * - 现代简约扁平风格 UI
 * - 播放完成后显示重播/下一个提示（全屏可用）
 */
export default function ArtPlayerVideo({
  src,
  allFiles,
  hasNext = false,
  onReplay,
  onPlayNext,
  onPlaying,
}: ArtPlayerVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);
  const endScreenManagerRef = useRef<EndScreenManager | null>(null);

  // 使用 ref 存储回调函数，避免依赖变化导致重新初始化
  const callbacksRef = useRef({ onReplay, onPlayNext, onPlaying });
  callbacksRef.current = { onReplay, onPlayNext, onPlaying };

  // 使用 useMemo 缓存字幕文件查找结果
  const subtitleInfo = useMemo(() => findSubtitleFile(src, allFiles), [src, allFiles]);

  // 组件卸载时清理
  useUnmount(() => {
    endScreenManagerRef.current?.destroy();
    endScreenManagerRef.current = null;
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  });

  // 初始化播放器
  useEffect(() => {
    if (!containerRef.current) return;

    let isCancelled = false;

    const initPlayer = async () => {
      // 加载 ASS 字幕为弹幕
      const danmuku: Danmu[] =
        subtitleInfo?.type === "ass" ? await loadAssDanmuku(subtitleInfo.url) : [];

      if (isCancelled) return;

      // 销毁旧的播放器实例
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // 销毁旧的结束画面
      endScreenManagerRef.current?.destroy();
      endScreenManagerRef.current = null;

      if (isCancelled) return;

      // 构建字幕配置（非 ASS 格式）
      const subtitleConfig =
        subtitleInfo?.type && subtitleInfo.type !== "ass"
          ? { url: subtitleInfo.url, type: subtitleInfo.type }
          : undefined;

      // 创建 ArtPlayer 实例
      playerRef.current = new Artplayer({
        container: containerRef.current!,
        url: src,
        volume: 1,
        isLive: false,
        muted: false,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: true,
        setting: true,
        loop: false,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: "#00aeec", // 备用：#ef4444
        ...(subtitleConfig && { subtitle: subtitleConfig }),
        icons: {
          loading: `<div class="art-loading-spinner"></div>`,
        },
        cssVar: {
          "--art-theme": "#00aeec",
          "--art-font-color": "#fafafa",
        },
        settings: [
          ...(subtitleInfo?.type && subtitleInfo.type !== "ass"
            ? [
                {
                  name: "subtitle" as const,
                  type: "switcher" as const,
                  html: "字幕",
                  tooltip: "已加载",
                  switch: true,
                  onSwitch(this: Artplayer) {
                    this.subtitle.show = !this.subtitle.show;
                    return this.subtitle.show;
                  },
                },
              ]
            : []),
        ],
        plugins: [
          artplayerPluginDanmuku({
            danmuku,
            emitter: false,
            speed: 10,
          }),
        ],
      });

      // 初始化结束画面管理器
      const videoElement = playerRef.current.template?.$video;
      if (videoElement) {
        const endScreenConfig: EndScreenManagerConfig = {
          countdownSeconds: NEXT_VIDEO_COUNTDOWN,
          hasNext,
          onReplay: () => {
            if (playerRef.current) {
              playerRef.current.currentTime = 0;
              playerRef.current.play();
            }
            callbacksRef.current.onReplay?.();
          },
          onPlayNext: () => {
            setTimeout(() => {
              callbacksRef.current.onPlayNext?.();
            }, 0);
          },
        };

        endScreenManagerRef.current = new EndScreenManager(endScreenConfig);
        endScreenManagerRef.current.init(videoElement);
      }

      // 监听事件
      playerRef.current.on("error", (error) => {
        console.error("ArtPlayer error:", error);
      });

      playerRef.current.on("ready", () => {
        console.log("ArtPlayer ready");
        // autoplay: true 时，play 事件可能在监听器绑定前已触发
        // playing 属性在 ready 时不够可靠，用 rAF 在下一帧检查底层 video 的真实状态
        requestAnimationFrame(() => {
          if (playerRef.current && !playerRef.current.video.paused) {
            endScreenManagerRef.current?.hide();
            callbacksRef.current.onPlaying?.(true);
          }
        });
      });

      // 监听视频结束，显示结束画面
      playerRef.current.on("video:ended", () => {
        setTimeout(() => {
          endScreenManagerRef.current?.show();
          callbacksRef.current.onPlaying?.(false);
        }, 0);
      });

      // 监听播放开始，隐藏结束画面
      playerRef.current.on("play", () => {
        endScreenManagerRef.current?.hide();
        callbacksRef.current.onPlaying?.(true);
      });

      // 监听暂停
      playerRef.current.on("pause", () => {
        callbacksRef.current.onPlaying?.(false);
      });
    };

    initPlayer();

    return () => {
      isCancelled = true;
    };
  }, [src, subtitleInfo, hasNext]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio: "16/9" }}
    />
  );
}

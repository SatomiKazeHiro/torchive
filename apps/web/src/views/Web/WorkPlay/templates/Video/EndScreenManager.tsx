import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { EndScreen } from "./EndScreen";

/**
 * 结束画面管理器配置
 */
export interface EndScreenManagerConfig {
  /** 倒计时秒数 */
  countdownSeconds?: number;
  /** 是否有下一个视频 */
  hasNext: boolean;
  /** 重播回调 */
  onReplay?: () => void;
  /** 播放下一个回调 */
  onPlayNext?: () => void;
}

/**
 * 结束画面管理器
 *
 * 用于管理结束画面的显示/隐藏、倒计时等逻辑
 */
export class EndScreenManager {
  private container: HTMLDivElement | null = null;
  private root: Root | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private countdown = 5;
  private readonly config: EndScreenManagerConfig;
  private readonly defaultCountdown = 5;

  constructor(config: EndScreenManagerConfig) {
    this.config = config;
    this.countdown = config.countdownSeconds ?? this.defaultCountdown;
  }

  /**
   * 初始化结束画面容器
   * @param videoElement 视频元素
   */
  init(videoElement: HTMLVideoElement): boolean {
    if (!videoElement.parentElement) return false;

    // 创建容器
    this.container = document.createElement("div");
    this.container.className = "art-end-screen-container";
    this.container.style.cssText = "position: absolute; inset: 0; display: none; z-index: 100;";

    // 插入到 video 的父元素中
    videoElement.parentElement.style.position = "relative";
    videoElement.parentElement.appendChild(this.container);

    // 创建 React root
    this.root = createRoot(this.container);

    return true;
  }

  /**
   * 显示结束画面
   */
  show(): void {
    if (!this.container || !this.root) return;

    // 重置倒计时
    this.countdown = this.config.countdownSeconds ?? this.defaultCountdown;

    // 渲染组件
    this.render();

    // 显示容器
    this.container.style.display = "block";

    // 如果有下一个，启动倒计时
    if (this.config.hasNext && !this.countdownTimer) {
      this.countdownTimer = setInterval(() => {
        this.countdown -= 1;
        this.render();

        if (this.countdown <= 0) {
          this.hide();
          setTimeout(() => {
            this.config.onPlayNext?.();
          }, 0);
        }
      }, 1000);
    }
  }

  /**
   * 隐藏结束画面
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = "none";
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.countdown = this.config.countdownSeconds ?? this.defaultCountdown;
  }

  /**
   * 销毁结束画面
   */
  destroy(): void {
    this.hide();
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * 渲染结束画面组件
   */
  private render(): void {
    if (!this.root) return;

    this.root.render(
      <EndScreen
        hasNext={this.config.hasNext}
        countdown={this.countdown}
        onReplay={() => {
          this.hide();
          this.config.onReplay?.();
        }}
        onPlayNext={() => {
          this.hide();
          setTimeout(() => {
            this.config.onPlayNext?.();
          }, 0);
        }}
      />,
    );
  }
}
import { useState, useRef, useCallback } from "react";
import { useEventListener, useUnmount } from "ahooks";

interface Position {
  x: number;
  y: number;
}

interface BaseSize {
  width: number;
  height: number;
}

interface UseImageViewerReturn {
  /** 当前缩放比例 */
  scale: number;
  /** 当前位置 */
  position: Position;
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 图片元素引用 */
  imgRef: React.RefObject<HTMLImageElement | null>;
  /** 容器元素引用 */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 更新基础尺寸（图片加载/窗口大小变化时调用） */
  updateBaseSize: () => void;
  /** 处理鼠标按下（开始拖拽） */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** 双击重置 */
  handleDoubleClick: () => void;
}

/**
 * 图片查看器 Hook
 *
 * 功能：
 * - 滚轮缩放（以鼠标位置为中心）
 * - 拖拽平移（缩放后可用）
 * - 边界约束（防止图片拖出可视区域）
 * - 双击重置
 *
 * 使用 ahooks：
 * - useEventListener: 监听窗口大小变化、鼠标事件
 * - useUnmount: 清理拖拽状态
 */
export function useImageViewer(): UseImageViewerReturn {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 记录图片在 scale=1 时的实际显示宽高（受 object-contain 影响后的尺寸）
  const baseSizeRef = useRef<BaseSize>({ width: 0, height: 0 });

  // 用于在事件回调中访问最新状态
  const stateRef = useRef({ scale: 1, x: 0, y: 0 });
  stateRef.current = { scale, x: position.x, y: position.y };

  // 拖拽开始位置
  const dragStartRef = useRef({ x: 0, y: 0 });

  /**
   * 更新基础尺寸（图片加载或窗口大小变化时）
   */
  const updateBaseSize = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const { naturalWidth, naturalHeight } = img;
    const { clientWidth, clientHeight } = container;

    // 计算 object-contain 后的实际显示尺寸
    const ratio = Math.min(clientWidth / naturalWidth, clientHeight / naturalHeight);
    baseSizeRef.current = {
      width: naturalWidth * ratio,
      height: naturalHeight * ratio,
    };
  }, []);

  /**
   * 计算带边界约束的位置
   */
  const getConstrainedPos = useCallback(
    (newScale: number, targetX: number, targetY: number): Position => {
      const container = containerRef.current;
      if (!container) return { x: targetX, y: targetY };

      const { width: bW, height: bH } = baseSizeRef.current;
      const { clientWidth: cW, clientHeight: cH } = container;

      const curW = bW * newScale;
      const curH = bH * newScale;

      // X 轴边界：图片小于容器时居中，否则限制在边界内
      let x = targetX;
      if (curW <= cW) {
        x = 0;
      } else {
        const boundaryX = (curW - cW) / 2;
        x = Math.max(-boundaryX, Math.min(boundaryX, targetX));
      }

      // Y 轴边界
      let y = targetY;
      if (curH <= cH) {
        y = 0;
      } else {
        const boundaryY = (curH - cH) / 2;
        y = Math.max(-boundaryY, Math.min(boundaryY, targetY));
      }

      return { x, y };
    },
    [],
  );

  // 使用 ahooks useEventListener 监听窗口大小变化
  useEventListener("resize", updateBaseSize);

  // 使用 ahooks useEventListener 监听滚轮缩放
  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;

      if (baseSizeRef.current.width === 0) updateBaseSize();

      const { scale: s, x, y } = stateRef.current;
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.25 : 0.8;
      const nextScale = Math.max(1, Math.min(15, s * factor));

      if (nextScale === s) return;

      const rect = el.getBoundingClientRect();
      const mX = e.clientX - (rect.left + rect.width / 2);
      const mY = e.clientY - (rect.top + rect.height / 2);

      // 以鼠标位置为中心缩放
      const ratio = nextScale / s;
      const idealX = mX - (mX - x) * ratio;
      const idealY = mY - (mY - y) * ratio;

      const finalPos = getConstrainedPos(nextScale, idealX, idealY);

      setScale(nextScale);
      setPosition(finalPos);
    },
    { target: containerRef, passive: false },
  );

  /**
   * 处理鼠标按下 - 开始拖拽
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [scale, position],
  );

  // 使用 ahooks useEventListener 监听鼠标移动（拖拽中）
  useEventListener(
    "mousemove",
    (e: MouseEvent) => {
      if (!isDragging) return;
      const nextX = e.clientX - dragStartRef.current.x;
      const nextY = e.clientY - dragStartRef.current.y;
      setPosition(getConstrainedPos(stateRef.current.scale, nextX, nextY));
    },
    { target: () => (isDragging ? window : null) },
  );

  // 使用 ahooks useEventListener 监听鼠标释放
  useEventListener("mouseup", () => setIsDragging(false), {
    target: () => (isDragging ? window : null),
  });

  // 使用 ahooks useUnmount 确保组件卸载时清理拖拽状态
  useUnmount(() => {
    setIsDragging(false);
  });

  /**
   * 双击重置缩放
   */
  const handleDoubleClick = useCallback(() => {
    setScale(scale === 1 ? 3 : 1);
    setPosition({ x: 0, y: 0 });
  }, [scale]);

  return {
    scale,
    position,
    isDragging,
    imgRef,
    containerRef,
    updateBaseSize,
    handleMouseDown,
    handleDoubleClick,
  };
}

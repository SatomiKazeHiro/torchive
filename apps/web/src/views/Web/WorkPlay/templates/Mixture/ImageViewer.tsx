import type { ViewerProps } from "./types";
import { useImageViewer } from "./hooks";

/**
 * 图片查看器组件
 *
 * 功能特性：
 * - 滚轮缩放（以鼠标位置为中心）
 * - 拖拽平移（缩放后可拖动查看）
 * - 边界约束（防止图片拖出可视区域）
 * - 双击快速缩放/重置
 *
 * 技术实现：
 * - 使用 useImageViewer Hook 管理所有交互逻辑
 * - 使用 transform: translate3d + scale 实现高性能变换
 */
export default function ImageViewer({ src, fileName }: ViewerProps) {
  const {
    scale,
    position,
    isDragging,
    imgRef,
    containerRef,
    updateBaseSize,
    handleMouseDown,
    handleDoubleClick,
  } = useImageViewer();

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden bg-zinc-950"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={fileName}
        onLoad={updateBaseSize}
        draggable={false}
        className="max-h-full max-w-full object-contain shadow-xl select-none"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          // 只有缩放时给极短的过渡，拖拽时必须为 none
          transition: isDragging ? "none" : "transform 0.12s ease-out",
          willChange: "transform",
        }}
      />
    </div>
  );
}

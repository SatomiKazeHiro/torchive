/**
 * Mixture 模块自定义 Hooks
 * 
 * 这些 Hooks 封装了组件的业务逻辑，实现关注点分离：
 * - 状态管理、副作用处理在 Hooks 中
 * - UI 渲染在组件中
 * 
 * 统一使用 ahooks 提供的工具：
 * - useSet: 管理 Set 类型的状态
 * - useToggle: 管理布尔开关状态
 * - useEventListener: 简化事件监听
 * - useUnmount: 组件卸载时清理资源
 */

export { useMixtureState } from "./useMixtureState";
export { useImageViewer } from "./useImageViewer";
export { useVideoPlayer } from "./useVideoPlayer";
export { useTextViewer } from "./useTextViewer";

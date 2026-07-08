/**
 * Audio 模块自定义 Hooks
 * 
 * 这些 Hooks 封装了音频播放器的业务逻辑：
 * - useAudioPlayer: 音频播放控制
 * - useAudioMetadata: 音频元数据解析
 * - useCoverColor: 封面主色调提取
 * - useLyrics: 歌词管理（新增）
 */

export { useAudioPlayer } from "./useAudioPlayer";
export { useAudioMetadata } from "./useAudioMetadata";
export { useCoverColor } from "./useCoverColor";
export { useLyrics } from "./useLyrics";

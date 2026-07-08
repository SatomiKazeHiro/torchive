/**
 * Audio 播放器模块
 * 
 * 提供完整的音频播放功能，包括：
 * - AudioPlayer: 主播放器组件（支持歌词显示、波形图等）
 * - Cover 组件: 黑胶唱片封面、方形封面等
 * - LyricsSearchDialog: 歌词搜索弹窗
 * - Waveform: 波形图组件
 * - Hooks: useAudioPlayer, useAudioMetadata, useCoverColor, useLyrics
 */

// 主播放器组件
export { default as AudioPlayer } from "./AudioPlayer";

// 封面组件
export { VinylCover, SquareCover, SwitchableCover, ImageCover, SimpleCover } from "./Cover";

// 歌词搜索弹窗
export { LyricsSearchDialog } from "./LyricsSearchDialog";

// 波形图组件
export { Waveform } from "./Waveform";

// Hooks
export { useAudioPlayer, useAudioMetadata, useCoverColor, useLyrics } from "./hooks";

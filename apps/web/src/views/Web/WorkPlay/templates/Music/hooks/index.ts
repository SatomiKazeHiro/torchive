// 复用 Mixture 中的音频相关 hooks
export {
  useAudioPlayer,
  useAudioMetadata,
  useCoverColor,
  useLyrics,
} from "../../Mixture/Audio/hooks";

// 歌单管理 hook
export { usePlaylist } from "./usePlaylist";

// 布局管理 hook
export { useLayout } from "./useLayout";

// 音乐播放器主 hook
export { useMusicPlayer } from "./useMusicPlayer";

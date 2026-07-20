import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { shortHash } from "@/utils/shortHash";
import type { PlaylistItem } from "./types";

/**
 * 音乐播放页 URL 状态管理
 *
 * URL 编码: ?asset=<shortHash>
 * - asset 用 8 字符 base32 短 hash 代替全路径,首屏 URL 长度可控
 * - 歌单内 local 查表(hashToPath)把 short hash 还原回全路径
 *
 * 状态推算优先级:
 *   1. URL 上的合法 hash → 用它
 *   2. initialAssetPath(从 location.state.filePath 传入)匹配歌单内任一 asset → 用它并回写 URL
 *   3. playlist 第一首
 *
 * URL 缺/失效时由唯一一处 useEffect 静默回写,replace 不污染历史栈。
 */
export function useMusicPlayState(playlist: PlaylistItem[], initialAssetPath?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAsset = searchParams.get("asset");

  // 短 hash 双向查表(短 hash → 路径 / 路径 → 短 hash)
  const { hashToPath, pathToHash } = useMemo(() => {
    const h2p = new Map<string, string>();
    const p2h = new Map<string, string>();
    for (const item of playlist) {
      const h = shortHash(item.path, 8);
      p2h.set(item.path, h);
      if (!h2p.has(h)) h2p.set(h, item.path);
    }
    return { hashToPath: h2p, pathToHash: p2h };
  }, [playlist]);

  // 校验并兜底当前 asset
  const currentAsset = useMemo(() => {
    if (urlAsset && hashToPath.has(urlAsset)) {
      return hashToPath.get(urlAsset)!;
    }
    if (initialAssetPath && pathToHash.has(initialAssetPath)) {
      return initialAssetPath;
    }
    return playlist[0]?.path ?? null;
  }, [urlAsset, hashToPath, initialAssetPath, pathToHash, playlist]);

  const currentIndex = useMemo(() => {
    if (!currentAsset) return -1;
    return playlist.findIndex((item) => item.path === currentAsset);
  }, [playlist, currentAsset]);

  // URL 与 state 偏离时静默回写(初次进入 / asset 失效都走这里)
  useEffect(() => {
    if (playlist.length === 0) return;

    const wantHash = currentAsset ? (pathToHash.get(currentAsset) ?? "") : "";
    if (urlAsset === wantHash) return;

    const next = new URLSearchParams(searchParams);
    if (wantHash) next.set("asset", wantHash);
    setSearchParams(next, { replace: true });
  }, [playlist.length, urlAsset, currentAsset, pathToHash, searchParams, setSearchParams]);

  const setAsset = useCallback(
    (asset: string) => {
      const next = new URLSearchParams(searchParams);
      const hash = pathToHash.get(asset);
      if (hash) next.set("asset", hash);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, pathToHash],
  );

  return {
    currentAsset,
    currentIndex,
    setAsset,
  };
}

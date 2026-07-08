import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { shortHash } from "@/utils/shortHash";
import type { VideoTab } from "./videoTabs";

/**
 * 视频播放页 URL 状态管理
 *
 * URL 编码: ?tab=<tabKey>&asset=<shortHash>
 * - tabKey 是 videoTabs[].key,本身已短(main/section_0/others)
 * - asset 用 8 字符 base32 短 hash 代替全路径,首屏 URL 长度可控
 * - work 内 local 查表(hashToPath)把 short hash 还原回全路径
 *
 * 状态推算优先级:
 *   1. URL 上的合法 hash → 用它
 *   2. initialAssetPath(从 location.state.filePath 传入)匹配 work 内任一 asset → 用它并回写 URL
 *   3. currentTab 第一个 video
 *
 * URL 缺/失效时由唯一一处 useEffect 静默回写,replace 不污染历史栈。
 */
export function useVideoPlayState(videoTabs: VideoTab[], initialAssetPath?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAsset = searchParams.get("asset");
  const urlTab = searchParams.get("tab");

  // 短 hash 双向查表(短 hash → 路径 / 路径 → 短 hash)
  const { hashToPath, pathToHash } = useMemo(() => {
    const h2p = new Map<string, string>();
    const p2h = new Map<string, string>();
    for (const tab of videoTabs) {
      for (const path of tab.videos) {
        const h = shortHash(path, 8);
        p2h.set(path, h);
        if (!h2p.has(h)) h2p.set(h, path);
      }
    }
    return { hashToPath: h2p, pathToHash: p2h };
  }, [videoTabs]);

  // 校验并兜底当前 tab
  const currentTab = useMemo(() => {
    if (urlTab && videoTabs.some((t) => t.key === urlTab)) return urlTab;
    return videoTabs[0]?.key ?? null;
  }, [urlTab, videoTabs]);

  // 校验并兜底当前 asset
  const currentAsset = useMemo(() => {
    if (urlAsset && hashToPath.has(urlAsset)) {
      return hashToPath.get(urlAsset)!;
    }
    if (initialAssetPath && pathToHash.has(initialAssetPath)) {
      return initialAssetPath;
    }
    const tab = videoTabs.find((t) => t.key === currentTab) ?? videoTabs[0];
    return tab?.videos[0] ?? null;
  }, [urlAsset, hashToPath, initialAssetPath, pathToHash, currentTab, videoTabs]);

  // URL 与 state 偏离时静默回写(初次进入 / tab/asset 失效都走这里)
  useEffect(() => {
    if (videoTabs.length === 0) return;

    const wantTab = currentTab ?? "";
    const wantHash = currentAsset ? (pathToHash.get(currentAsset) ?? "") : "";
    if (urlTab === wantTab && urlAsset === wantHash) return;

    const next = new URLSearchParams(searchParams);
    if (wantTab) next.set("tab", wantTab);
    if (wantHash) next.set("asset", wantHash);
    setSearchParams(next, { replace: true });
  }, [
    videoTabs.length,
    urlAsset,
    urlTab,
    currentTab,
    currentAsset,
    pathToHash,
    searchParams,
    setSearchParams,
  ]);

  const setTab = useCallback(
    (tabKey: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", tabKey);
      const newTab = videoTabs.find((t) => t.key === tabKey);
      if (newTab && !newTab.videos.includes(currentAsset ?? "")) {
        const firstHash = newTab.videos[0] ? pathToHash.get(newTab.videos[0]) : null;
        if (firstHash) next.set("asset", firstHash);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, currentAsset, videoTabs, pathToHash],
  );

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
    currentTab,
    currentAsset,
    setTab,
    setAsset,
  };
}

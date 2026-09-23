import { useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSetState, useLocalStorageState, useDebounceFn } from "ahooks";
import { BiFile } from "react-icons/bi";

import PdfReader from "@/features/common/PdfReader";
import { TxtReader } from "@/features/common/TxtReader";
import { MobileTxtReader } from "@/features/common/MobileTxtReader";
import { Empty } from "@/components";
import SettingsPanel from "./components/SettingsPanel";
import { DEFAULT_READER_SETTINGS } from "./constants";
import {
  getFileExtension,
  generateChapterUnits,
  findChapterIndexByFile,
  findFileIndexInChapter,
} from "./utils";
import { useReadingProgress } from "./hooks/useReadingProgress";

import type {
  EbookPlayTemplateProps,
  ChapterUnit,
  ThemeMode,
  FontSize,
  ReadingMode,
} from "./types";
import type { MobileTxtReaderRef } from "@/features/common/MobileTxtReader";

// 主题转换：Ebook (paper/parchment/dark/light) -> PdfReader (light/dark)
function convertToPdfTheme(ebookTheme: ThemeMode): "light" | "dark" {
  switch (ebookTheme) {
    case "dark":
      return "dark";
    case "paper":
    case "parchment":
    default:
      return "light";
  }
}

// 主题转换：Ebook (paper/parchment/dark/light) -> TxtReader (paper/parchment/dark)
function convertToTxtTheme(ebookTheme: ThemeMode): "paper" | "parchment" | "dark" {
  switch (ebookTheme) {
    case "dark":
      return "dark";
    case "paper":
      return "paper";
    case "parchment":
      return "parchment";
    default:
      // light 或其他旧值默认转为 parchment
      return "parchment";
  }
}

export default function EbookPlayTemplate({
  transformedWorkData,
  domain,
  category,
  loading,
  error,
  initialFilePath,
}: EbookPlayTemplateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileReaderRef = useRef<MobileTxtReaderRef>(null);
  const isProgressRestoredRef = useRef(false);

  // 从 localStorage 读取设置
  const [settings, setSettings] = useLocalStorageState<{
    themeMode: ThemeMode;
    fontSize: FontSize;
    readingMode: ReadingMode;
  }>("ebook-reader-settings", {
    defaultValue: DEFAULT_READER_SETTINGS,
  });

  // 获取作品 ID
  // 检测是否为移动端模式（通过 URL 参数 ?type=mobile）
  const isMobileMode = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get("type") === "mobile";
  }, [location.search]);

  const workId = useMemo(() => transformedWorkData?.work?.hash_id ?? null, [transformedWorkData]);

  // 阅读进度管理
  const { getProgress, saveProgress } = useReadingProgress({ workId });

  // 状态管理
  const [state, setState] = useSetState({
    currentFileIndex: 0,
    currentChapterIndex: 0,
    isSettingOpen: false,
    progress: 0,
    themeMode: (settings?.themeMode ?? DEFAULT_READER_SETTINGS.themeMode) as ThemeMode,
    fontSize: (settings?.fontSize ?? DEFAULT_READER_SETTINGS.fontSize) as FontSize,
    readingMode: (settings?.readingMode ?? DEFAULT_READER_SETTINGS.readingMode) as ReadingMode,
  });

  // ============ 数据解析 ============
  const { work, chapterUnits, currentChapter, isFirstChapter, isLastChapter } = useMemo(() => {
    if (!transformedWorkData) {
      return {
        work: null,
        chapterUnits: [] as ChapterUnit[],
        currentChapter: null as ChapterUnit | null,
        isFirstChapter: true,
        isLastChapter: true,
      };
    }

    const { work, entities } = transformedWorkData;
    const units = generateChapterUnits(entities);

    // 尝试恢复阅读进度
    let chapterIndex = state.currentChapterIndex;
    let fileIndex = state.currentFileIndex;
    let savedProgress: ReturnType<typeof getProgress> = null;

    if (!isProgressRestoredRef.current && work.hash_id) {
      savedProgress = getProgress(work.hash_id);
      if (savedProgress && units.length > 0) {
        // 确保保存的章节索引在有效范围内
        if (savedProgress.chapterIndex < units.length) {
          chapterIndex = savedProgress.chapterIndex;
          fileIndex = savedProgress.fileIndex;
          // 恢复进度到状态
          setState({
            currentFileIndex: fileIndex,
            currentChapterIndex: chapterIndex,
            progress: savedProgress.progress,
          });
        }
        isProgressRestoredRef.current = true;
      }
    }

    // 如果没有恢复进度，则使用 URL state 或默认值
    if (!isProgressRestoredRef.current && chapterIndex === 0 && fileIndex === 0) {
      if (initialFilePath && units.length > 0) {
        chapterIndex = findChapterIndexByFile(units, initialFilePath);
      }
      const targetChapter = units[chapterIndex] || units[0] || null;
      if (initialFilePath && targetChapter) {
        fileIndex = findFileIndexInChapter(targetChapter, initialFilePath);
      }
      // 更新状态
      if (chapterIndex !== 0 || fileIndex !== 0) {
        setState({ currentFileIndex: fileIndex, currentChapterIndex: chapterIndex });
      }
    }

    const currentChapter = units[chapterIndex] || units[0] || null;

    return {
      work,
      chapterUnits: units,
      currentChapter,
      isFirstChapter: state.currentChapterIndex <= 0,
      isLastChapter: state.currentChapterIndex >= units.length - 1,
    };
  }, [
    transformedWorkData,
    initialFilePath,
    state.currentChapterIndex,
    state.currentFileIndex,
    setState,
    getProgress,
  ]);

  // 当前文件信息
  const currentFileUrl = useMemo(() => {
    if (
      !currentChapter ||
      state.currentFileIndex < 0 ||
      state.currentFileIndex >= currentChapter.files.length
    ) {
      return null;
    }
    return currentChapter.files[state.currentFileIndex];
  }, [currentChapter, state.currentFileIndex]);

  const currentFileName = useMemo(() => {
    if (!currentFileUrl) return "";
    return currentFileUrl.split("/").pop() || "";
  }, [currentFileUrl]);

  const fileExtension = useMemo(() => getFileExtension(currentFileName), [currentFileName]);

  // ============ 章节切换 ============
  // 保存当前进度
  const saveCurrentProgress = useCallback(() => {
    if (workId) {
      saveProgress({
        chapterIndex: state.currentChapterIndex,
        fileIndex: state.currentFileIndex,
        progress: state.progress,
        scrollTop: 0, // 子组件内部管理滚动位置
      });
    }
  }, [workId, state.currentChapterIndex, state.currentFileIndex, state.progress, saveProgress]);

  const switchChapter = useCallback(
    (direction: "prev" | "next") => {
      const isFirst = state.currentChapterIndex <= 0;
      const isLast = state.currentChapterIndex >= chapterUnits.length - 1;

      if (direction === "prev" && isFirst) return;
      if (direction === "next" && isLast) return;

      // 保存当前进度
      saveCurrentProgress();

      const delta = direction === "prev" ? -1 : 1;
      setState({
        currentChapterIndex: state.currentChapterIndex + delta,
        currentFileIndex: 0,
        progress: 0,
      });
    },
    [state.currentChapterIndex, chapterUnits.length, setState, saveCurrentProgress],
  );

  const handleChapterSelect = useCallback(
    (index: number) => {
      // 保存当前进度
      saveCurrentProgress();

      setState({
        currentChapterIndex: index,
        currentFileIndex: 0,
        isSettingOpen: false,
        progress: 0,
      });
    },
    [setState, saveCurrentProgress],
  );

  // ============ 主题和字体设置 ============
  const updateSetting = useCallback(
    <K extends "themeMode" | "fontSize" | "readingMode">(key: K, value: (typeof state)[K]) => {
      setState({ [key]: value } as Pick<typeof state, K>);
      setSettings({ ...settings, [key]: value } as typeof settings);
    },
    [settings, setSettings, setState],
  );

  // 主题切换由阅读器内部处理，这里保留以备后续需要
  // const handleToggleTheme = useCallback(() => {
  //   const themes: ThemeMode[] = ["parchment", "dark"];
  //   const currentIndex = themes.indexOf(state.themeMode);
  //   const nextTheme = themes[(currentIndex + 1) % themes.length];
  //   updateSetting("themeMode", nextTheme);
  // }, [state.themeMode, updateSetting]);

  // 处理来自阅读器的主题变化
  // 支持 TxtReader (paper/parchment/dark) 与 PdfReader (light/dark) 两种回调类型
  const handleReaderThemeChange = useCallback(
    (readerTheme: "paper" | "parchment" | "dark" | "light") => {
      // PdfReader 只有 light/dark，把 light 映射到最接近的明亮主题（parchment 为默认）
      const theme: ThemeMode = readerTheme === "light" ? "parchment" : readerTheme;
      updateSetting("themeMode", theme);
    },
    [updateSetting],
  );

  // ============ 进度控制 ============
  // 自动保存进度（防抖，每 3 秒最多保存一次）
  const { run: debouncedSaveProgress } = useDebounceFn(
    (progress: number) => {
      if (workId) {
        saveProgress({
          chapterIndex: state.currentChapterIndex,
          fileIndex: state.currentFileIndex,
          progress,
          scrollTop: 0,
        });
      }
    },
    { wait: 3000 },
  );

  const handleProgressChange = useCallback(
    (progress: number) => {
      setState({ progress });
      debouncedSaveProgress(progress);
    },
    [setState, debouncedSaveProgress],
  );

  // ============ 导航栏控制 ============
  const handleOpenSettings = useCallback(() => {
    setState({ isSettingOpen: true });
  }, [setState]);

  // ============ 导航和快捷键 ============
  const handleBack = useCallback(() => {
    // 保存当前进度
    saveCurrentProgress();
    navigate(`/${domain}/${category}/${work?.hash_id}`);
  }, [navigate, domain, category, work, saveCurrentProgress]);

  // 页面卸载前保存进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentProgress();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCurrentProgress]);

  // Esc 键处理：按优先级逐级关闭
  // 优先级：设置弹窗 -> 搜索 -> 目录 -> 导航栏（仅移动端模式）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      // 优先级1: 设置面板
      if (state.isSettingOpen) {
        e.preventDefault();
        e.stopPropagation();
        setState({ isSettingOpen: false });
        return;
      }

      // 仅在移动端模式下继续处理
      if (!isMobileMode || !mobileReaderRef.current) return;

      // 优先级2: 搜索抽屉
      if (mobileReaderRef.current.isSearchOpen()) {
        e.preventDefault();
        e.stopPropagation();
        mobileReaderRef.current.closeSearch();
        return;
      }

      // 优先级3: 目录抽屉
      if (mobileReaderRef.current.isTocOpen()) {
        e.preventDefault();
        e.stopPropagation();
        mobileReaderRef.current.closeToc();
        return;
      }

      // 优先级4: 切换导航栏
      e.preventDefault();
      mobileReaderRef.current.toggleNav();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isSettingOpen, isMobileMode, setState]);

  // ============ 渲染 ============
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !work || !currentChapter) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Empty
          bordered
          size="lg"
          className="w-full max-w-sm"
          icon={<span className="text-5xl">📖</span>}
          description={error || "暂无内容"}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            返回
          </button>
        </Empty>
      </div>
    );
  }

  const title = work.detail?.title || work.work;

  // 渲染文件查看器
  const renderViewer = () => {
    if (!currentFileUrl) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <BiFile className="h-16 w-16 text-zinc-300" />
          <p className="text-zinc-500">无可读文件</p>
        </div>
      );
    }

    switch (fileExtension) {
      case "txt":
        return isMobileMode ? (
          <MobileTxtReader
            ref={mobileReaderRef}
            src={currentFileUrl}
            fileName={currentFileName}
            title={title}
            themeMode={state.themeMode}
            fontSize={state.fontSize}
            chapterUnits={chapterUnits}
            currentChapterIndex={state.currentChapterIndex}
            isFirstChapter={isFirstChapter}
            isLastChapter={isLastChapter}
            onBack={handleBack}
            onProgressChange={handleProgressChange}
            onThemeChange={(theme) => updateSetting("themeMode", theme)}
            onFontSizeChange={(size) => updateSetting("fontSize", size)}
            onPrevChapter={() => switchChapter("prev")}
            onNextChapter={() => switchChapter("next")}
            onOpenSettings={handleOpenSettings}
          />
        ) : (
          <TxtReader
            src={currentFileUrl}
            fileName={currentFileName}
            title={title}
            themeMode={convertToTxtTheme(state.themeMode)}
            fontSize={state.fontSize}
            chapterUnits={chapterUnits}
            currentChapterIndex={state.currentChapterIndex}
            isFirstChapter={isFirstChapter}
            isLastChapter={isLastChapter}
            onBack={handleBack}
            onProgressChange={handleProgressChange}
            onThemeChange={handleReaderThemeChange}
            onFontSizeChange={(size) => updateSetting("fontSize", size)}
            onPrevChapter={() => switchChapter("prev")}
            onNextChapter={() => switchChapter("next")}
          />
        );
      case "pdf":
        return (
          <PdfReader
            src={currentFileUrl}
            fileName={currentFileName}
            title={title}
            themeMode={convertToPdfTheme(state.themeMode)}
            readingMode={state.readingMode}
            chapterUnits={chapterUnits}
            currentChapterIndex={state.currentChapterIndex}
            isFirstChapter={isFirstChapter}
            isLastChapter={isLastChapter}
            onBack={handleBack}
            onProgressChange={handleProgressChange}
            onThemeChange={handleReaderThemeChange}
            onReadingModeChange={(mode) => updateSetting("readingMode", mode)}
            onPrevChapter={() => switchChapter("prev")}
            onNextChapter={() => switchChapter("next")}
          />
        );
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <BiFile className="h-16 w-16 text-zinc-300" />
            <p className="text-zinc-500">暂不支持该格式: .{fileExtension}</p>
            <a
              href={currentFileUrl}
              download
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
            >
              下载文件
            </a>
          </div>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {/* 内容区域 */}
      <div className="h-full w-full">{renderViewer()}</div>

      {/* 设置面板 */}
      <SettingsPanel
        isOpen={state.isSettingOpen}
        onClose={() => setState({ isSettingOpen: false })}
        themeMode={state.themeMode}
        fontSize={state.fontSize}
        readingMode={state.readingMode}
        currentChapterIndex={state.currentChapterIndex}
        chapterUnits={chapterUnits}
        fileExtension={fileExtension}
        onThemeChange={(theme) => updateSetting("themeMode", theme)}
        onFontSizeChange={(size) => updateSetting("fontSize", size)}
        onReadingModeChange={(mode) => updateSetting("readingMode", mode)}
        onChapterSelect={handleChapterSelect}
      />
    </div>
  );
}

export { default as EbookPlayTemplate } from "./index";
export type {
  EbookPlayTemplateProps,
  ChapterUnit,
  ThemeMode,
  FontSize,
  ReadingMode,
} from "./types";

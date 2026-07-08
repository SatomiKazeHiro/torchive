import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSet, useToggle } from "ahooks";
import type { SectionItem, TransformedWorkData } from "../types";
import { generateSectionItems } from "../utils";

interface UseMixtureStateOptions {
  /** 转换后的作品数据 */
  transformedWorkData: TransformedWorkData | null;
  /** 初始文件路径 */
  initialFilePath?: string;
}

interface UseMixtureStateReturn {
  // 数据
  work: TransformedWorkData["work"] | null;
  entities: TransformedWorkData["entities"];
  sectionItems: SectionItem[];

  // 当前文件状态
  currentFilePath: string | null;
  setCurrentFilePath: (path: string | null) => void;
  currentSection: SectionItem | null;
  currentFileList: string[];
  currentFileIndex: number;

  // 展开状态管理
  expandedKeys: Set<string>;
  handleToggleSection: (key: string) => void;

  // UI 状态
  isFullWidth: boolean;
  toggleFullWidth: () => void;

  // 导航方法
  goToPrev: () => void;
  goToNext: () => void;

  // 派生状态
  hasMultipleFiles: boolean;
  workName: string;
  title: string;
  containerClass: string;
}

/**
 * Mixture 播放器状态管理 Hook
 *
 * 集中管理：
 * - 当前文件路径
 * - 章节展开状态
 * - UI 状态（全宽）
 * - 文件导航
 *
 * 使用 ahooks：
 * - useSet: 管理展开章节集合
 * - useToggle: 管理布尔开关状态
 */
export function useMixtureState({
  transformedWorkData,
  initialFilePath,
}: UseMixtureStateOptions): UseMixtureStateReturn {
  const location = useLocation();

  // 从 location state 或 props 获取初始路径
  const initialPath = initialFilePath || (location.state as { filePath?: string })?.filePath;

  // 当前文件路径
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(initialPath || null);

  // 使用 ahooks useSet 管理展开的章节（自动处理 Set 操作）
  const [expandedKeys, { add, remove }] = useSet<string>();

  // 使用 ahooks useToggle 管理全宽状态
  const [isFullWidth, { toggle: toggleFullWidth }] = useToggle(true);

  // 作品数据
  const work = transformedWorkData?.work || null;
  // useMemo 防止 entities 默认值在每次渲染时创建新对象引用，导致下游 useMemo 失效
  const entities = useMemo(
    () => transformedWorkData?.entities || { assets: [], section: [], orphanAssets: [] },
    [transformedWorkData?.entities],
  );
  const workName = work?.work || "";

  // 生成章节列表
  const sectionItems = useMemo(() => generateSectionItems(entities), [entities]);

  // 初始化：默认展开第一个章节，或包含当前文件的章节
  useEffect(() => {
    if (sectionItems.length === 0) return;

    const firstItem = sectionItems[0];

    // 如果当前文件在某个章节中，展开该章节
    if (currentFilePath) {
      for (const item of sectionItems) {
        if (item.files.includes(currentFilePath)) {
          add(item.key);
          return;
        }
      }
    }

    // 默认展开第一个章节
    add(firstItem.key);

    // 如果没有当前文件，自动选择第一个文件
    if (!currentFilePath && firstItem.files.length > 0) {
      setCurrentFilePath(firstItem.files[0]);
    }
    // add/currentFilePath 为 ahooks 状态操作/状态值，引用稳定，故有意忽略
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionItems]); // 只在 sectionItems 变化时执行

  // 切换章节展开状态
  const handleToggleSection = useCallback(
    (key: string) => {
      if (expandedKeys.has(key)) {
        remove(key);
      } else {
        add(key);
      }
    },
    [expandedKeys, add, remove],
  );

  // 查找当前文件所在的章节
  const currentSection = useMemo(() => {
    if (!currentFilePath) return null;
    return sectionItems.find((item) => item.files.includes(currentFilePath)) || null;
  }, [currentFilePath, sectionItems]);

  // 当前章节的文件列表
  const currentFileList = useMemo(() => currentSection?.files || [], [currentSection]);

  // 当前文件在列表中的索引
  const currentFileIndex = useMemo(
    () => (currentFilePath ? currentFileList.findIndex((p) => p === currentFilePath) : -1),
    [currentFileList, currentFilePath],
  );

  // 导航到上一个文件
  const goToPrev = useCallback(() => {
    if (currentFileIndex > 0) {
      setCurrentFilePath(currentFileList[currentFileIndex - 1]);
    }
  }, [currentFileIndex, currentFileList]);

  // 导航到下一个文件
  const goToNext = useCallback(() => {
    if (currentFileIndex < currentFileList.length - 1) {
      setCurrentFilePath(currentFileList[currentFileIndex + 1]);
    }
  }, [currentFileIndex, currentFileList]);

  // 派生状态
  const title = work?.detail?.title || workName || "";
  const containerClass = isFullWidth ? "w-full" : "mx-auto max-w-7xl";
  const hasMultipleFiles = !!(currentSection && currentSection.files.length > 1);

  return {
    work,
    entities,
    sectionItems,
    currentFilePath,
    setCurrentFilePath,
    currentSection,
    currentFileList,
    currentFileIndex,
    expandedKeys,
    handleToggleSection,
    isFullWidth,
    toggleFullWidth,
    goToPrev,
    goToNext,
    hasMultipleFiles,
    workName,
    title,
    containerClass,
  };
}

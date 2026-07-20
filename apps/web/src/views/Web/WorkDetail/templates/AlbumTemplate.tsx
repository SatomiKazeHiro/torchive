import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiArrowToLeft, BiBook, BiFolder, BiGridAlt, BiListUl } from "react-icons/bi";

import { Empty } from "@/components";
import { transformEntities, generateCoverUrl } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { shortHash } from "@/utils/shortHash";
import { filterImageFiles } from "@/utils/fileHelper";

import WorkDetailShell from "../components/WorkDetailShell";
import PosterCover from "../components/PosterCover";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const LOAD_MORE_COUNT = 30;

interface ChapterUnit {
  key: string;
  name: string;
  files: string[];
  cover: string | null;
}

function generateChapterUnits(entities: EntitiesJson): ChapterUnit[] {
  const units: ChapterUnit[] = [];
  const imageAssets = filterImageFiles(entities.assets);
  if (imageAssets.length) {
    const sorted = sortFiles(imageAssets);
    units.push({ key: "unit_assets", name: "本篇", files: sorted, cover: sorted[0] });
  }
  entities.section?.forEach((sec, index) => {
    const imageFiles = filterImageFiles(sec.files);
    if (imageFiles.length) {
      const sorted = sortFiles(imageFiles);
      units.push({ key: `unit_section_${index}`, name: sec.name, files: sorted, cover: sorted[0] });
    }
  });
  const imageOrphans = filterImageFiles(entities.orphanAssets);
  if (imageOrphans.length) {
    const sorted = sortFiles(imageOrphans);
    units.push({
      key: "unit_orphan",
      name: "其他",
      files: sorted,
      cover: sorted[0] || null,
    });
  }
  return units;
}

function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px", threshold: 0 },
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className ?? ""}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <BiBook className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setIsLoaded(true)}
          draggable={false}
        />
      )}
    </div>
  );
}

export default function AlbumTemplate({ work, domain, category, domainName }: WorkTemplateProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const entities = useMemo(() => transformEntities(work), [work]);
  const chapterUnits = useMemo(() => generateChapterUnits(entities), [entities]);
  const title = work.detail?.title || work.work;
  const cover = generateCoverUrl(work);

  const [selectedUnit, setSelectedUnit] = useState<ChapterUnit | null>(null);
  const [loadedCount, setLoadedCount] = useState(LOAD_MORE_COUNT);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // 只有一个单元时自动选中
  useEffect(() => {
    if (chapterUnits.length === 1 && !selectedUnit) {
      setSelectedUnit(chapterUnits[0]);
    }
  }, [chapterUnits, selectedUnit]);

  const handleRead = (filePath?: string) => {
    const assetParam = filePath ? `?asset=${shortHash(filePath, 8)}` : "";
    navigate(`/${domain}/${category}/${id}/play${assetParam}`);
  };

  const backToList = () => {
    setSelectedUnit(null);
    setLoadedCount(LOAD_MORE_COUNT);
  };

  const selectUnit = (unit: ChapterUnit) => {
    setSelectedUnit(unit);
    setLoadedCount(LOAD_MORE_COUNT);
  };

  return (
    <WorkDetailShell
      work={work}
      domain={domain}
      category={category}
      domainName={domainName}
      primaryLabel="开始阅读"
      cover={<PosterCover coverUrl={cover} title={title} />}
    >
      {chapterUnits.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {selectedUnit
            ? renderImageList({
                unit: selectedUnit,
                chapterUnits,
                loadedCount,
                onLoadMore: () => setLoadedCount((c) => c + LOAD_MORE_COUNT),
                onBack: backToList,
                onSelect: handleRead,
              })
            : renderChapterGrid({
                units: chapterUnits,
                viewMode,
                onChangeView: setViewMode,
                onSelect: selectUnit,
                onRead: handleRead,
              })}
        </div>
      ) : (
        <Empty
          bordered
          size="lg"
          iconVariant="flat"
          icon={<BiFolder className="text-faint h-12 w-12" strokeWidth={1} />}
          description="暂无数据"
        />
      )}
    </WorkDetailShell>
  );
}

function renderChapterGrid({
  units,
  viewMode,
  onChangeView,
  onSelect,
  onRead,
}: {
  units: ChapterUnit[];
  viewMode: "grid" | "list";
  onChangeView: (m: "grid" | "list") => void;
  onSelect: (u: ChapterUnit) => void;
  onRead: (file: string) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-md flex-1 leading-8">章节列表</span>
        <div className="ml-2 flex shrink-0 items-center gap-0.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
          <button
            className={`rounded p-1 transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
            onClick={() => onChangeView("grid")}
            title="网格视图"
          >
            <BiGridAlt className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1 transition-colors ${viewMode === "list" ? "bg-zinc-800 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"}`}
            onClick={() => onChangeView("list")}
            title="列表视图"
          >
            <BiListUl className="h-4 w-4" />
          </button>
        </div>
      </div>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {units.map((unit, index) => (
            <div key={unit.key} className="group cursor-pointer" onClick={() => onSelect(unit)}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                {unit.cover ? (
                  <img
                    src={unit.cover}
                    alt={unit.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                    <span className="text-2xl font-bold text-zinc-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                )}
                <div className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {unit.files.length}P
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-center text-sm font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-white">
                {unit.name}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {units.map((unit) => (
            <button
              key={unit.key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              onClick={() => onRead(unit.files[0])}
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {unit.name}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{unit.files.length}P</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function renderImageList({
  unit,
  chapterUnits,
  loadedCount,
  onLoadMore,
  onBack,
  onSelect,
}: {
  unit: ChapterUnit;
  chapterUnits: ChapterUnit[];
  loadedCount: number;
  onLoadMore: () => void;
  onBack: () => void;
  onSelect: (file: string) => void;
}) {
  const files = unit.files;
  const displayed = files.slice(0, loadedCount);
  const hasMore = files.length > loadedCount;

  return (
    <div className="p-4">
      {chapterUnits.length > 1 && (
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <BiArrowToLeft className="h-4 w-4" />
            <span className="ml-1">返回章节列表</span>
          </button>
          <span className="text-sm text-zinc-500">
            {unit.name} · 共 {files.length} 页
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {displayed.map((file, idx) => {
          const pageNum = idx + 1;
          const fileName = file.split("/").pop() || file;
          return (
            <div
              key={`${file}-${idx}`}
              className="group cursor-pointer"
              onClick={() => onSelect(file)}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                <LazyImage src={file} alt={`第${pageNum}页`} className="h-full w-full" />
                <div className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  P{pageNum}
                </div>
              </div>
              <p className="mt-1.5 line-clamp-1 text-center text-xs text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                {fileName}
              </p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            加载更多（还剩 {files.length - loadedCount} 页）
          </button>
        </div>
      )}
      {!hasMore && files.length > LOAD_MORE_COUNT && (
        <div className="mt-8 mb-4 text-center text-sm text-zinc-400">
          已加载全部 {files.length} 页
        </div>
      )}
    </div>
  );
}

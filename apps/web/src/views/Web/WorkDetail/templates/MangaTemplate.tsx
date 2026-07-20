import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiBook, BiFolder } from "react-icons/bi";

import { Empty } from "@/components";
import { transformEntities, generateCoverUrl } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { shortHash } from "@/utils/shortHash";
import { filterImageFiles } from "@/utils/fileHelper";

import WorkDetailShell from "../components/WorkDetailShell";
import PosterCover from "../components/PosterCover";
import TabsPanel, { type FileTab } from "../components/TabsPanel";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const LOAD_MORE_COUNT = 30;

function generateTabs(entities: EntitiesJson): FileTab[] {
  const tabs: FileTab[] = [];
  const imageAssets = filterImageFiles(entities.assets);
  if (imageAssets.length) {
    tabs.push({ key: "tab_assets_main", label: "本篇", files: sortFiles(imageAssets) });
  }
  entities.section?.forEach((sec, i) => {
    const imageFiles = filterImageFiles(sec.files);
    if (imageFiles.length) {
      tabs.push({
        key: `tab_section_${i}_${sec.name.replace(/\s+/g, "_")}`,
        label: sec.name,
        files: sortFiles(imageFiles),
      });
    }
  });
  const imageOrphans = filterImageFiles(entities.orphanAssets);
  if (imageOrphans.length) {
    tabs.push({
      key: "tab_orphan_others",
      label: "其他",
      files: sortFiles(imageOrphans),
    });
  }
  return tabs;
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
      { rootMargin: "50px 0px", threshold: 0 },
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className ?? ""}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <BiBook className="h-6 w-6 text-slate-300 dark:text-slate-600" />
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

function ImageGrid({ files, onSelect }: { files: string[]; onSelect: (file: string) => void }) {
  const [loadedCount, setLoadedCount] = useState(LOAD_MORE_COUNT);

  if (files.length === 0) {
    return (
      <Empty
        size="lg"
        iconVariant="flat"
        icon={<BiFolder className="text-faint h-12 w-12" strokeWidth={1} />}
        description="暂无内容"
      />
    );
  }

  const displayed = files.slice(0, loadedCount);
  const hasMore = files.length > loadedCount;

  return (
    <div className="p-4">
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
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <LazyImage src={file} alt={fileName} className="h-full w-full" />
                <div className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  P{pageNum}
                </div>
              </div>
              <p className="mt-1.5 line-clamp-1 text-center text-xs text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
                {fileName}
              </p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setLoadedCount((c) => c + LOAD_MORE_COUNT)}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            加载更多 ({files.length - loadedCount} 张 remaining)
          </button>
        </div>
      )}
      {!hasMore && files.length > LOAD_MORE_COUNT && (
        <div className="mt-8 mb-4 text-center text-sm text-slate-400">
          已加载全部 {files.length} 张图片
        </div>
      )}
    </div>
  );
}

export default function MangaTemplate({ work, domain, category, domainName }: WorkTemplateProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const entities = useMemo(() => transformEntities(work), [work]);
  const tabs = useMemo(() => generateTabs(entities), [entities]);
  const title = work.detail?.title || work.work;
  const cover = generateCoverUrl(work);

  const handleRead = (file: string) =>
    navigate(`/${domain}/${category}/${id}/play?asset=${shortHash(file, 8)}`);

  return (
    <WorkDetailShell
      work={work}
      domain={domain}
      category={category}
      domainName={domainName}
      primaryLabel="开始阅读"
      cover={<PosterCover coverUrl={cover} title={title} />}
    >
      <TabsPanel
        tabs={tabs}
        showTabsWhenSingle={false}
        renderTabContent={(tab) => <ImageGrid files={tab.files} onSelect={handleRead} />}
      />
    </WorkDetailShell>
  );
}

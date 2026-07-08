import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiFolder, BiPlay } from "react-icons/bi";

import { Empty, Pagination } from "@/components";
import { transformEntities } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { filterVideoFiles, getFileDisplayName, isImageFile } from "@/utils/fileHelper";

import WorkDetailShell from "../components/WorkDetailShell";
import PosterCover from "../components/PosterCover";
import TabsPanel, { type FileTab } from "../components/TabsPanel";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const PAGE_SIZE = 12;

function findVideoCover(videoFile: string, allFiles: string[]): string | null {
  const videoName = getFileDisplayName(videoFile);
  for (const file of allFiles) {
    if (!isImageFile(file)) continue;
    const imageName = getFileDisplayName(file);
    if (imageName.includes(videoName) || videoName.includes(imageName)) return file;
  }
  return null;
}

function generateTabs(entities: EntitiesJson): Array<FileTab & { allFiles: string[] }> {
  const tabs: Array<FileTab & { allFiles: string[] }> = [];
  const videoAssets = filterVideoFiles(entities.assets);
  if (videoAssets.length) {
    tabs.push({
      key: "tab_assets_main",
      label: "正片",
      files: sortFiles(videoAssets),
      allFiles: [...entities.assets],
    });
  }
  entities.section?.forEach((sec, i) => {
    const videoFiles = filterVideoFiles(sec.files);
    if (videoFiles.length) {
      tabs.push({
        key: `tab_section_${i}_${sec.name.replace(/\s+/g, "_")}`,
        label: sec.name,
        files: sortFiles(videoFiles),
        allFiles: sec.files,
      });
    }
  });
  const videoOrphans = filterVideoFiles(entities.orphanAssets);
  if (videoOrphans.length) {
    tabs.push({
      key: "tab_orphan_others",
      label: "其他",
      files: sortFiles(videoOrphans),
      allFiles: [...entities.orphanAssets],
    });
  }
  return tabs;
}

export default function VideoTemplate({
  work,
  domain,
  category,
  domainName,
}: WorkTemplateProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const entities = useMemo(() => transformEntities(work), [work]);
  const tabs = useMemo(() => generateTabs(entities), [entities]);
  const title = work.detail?.title || work.work;

  const handlePlay = (file: string) =>
    navigate(`/${domain}/${category}/${id}/play`, { state: { filePath: file } });

  return (
    <WorkDetailShell
      work={work}
      domain={domain}
      category={category}
      domainName={domainName}
      primaryLabel="立即播放"
      cover={<PosterCover coverUrl={work.detail?.cover ?? ""} title={title} />}
    >
      <TabsPanel
        tabs={tabs}
        renderTabContent={(tab) => (
          <VideoGrid files={tab.files} allFiles={tab.allFiles} onPlay={handlePlay} />
        )}
      />
    </WorkDetailShell>
  );
}

function VideoGrid({
  files,
  allFiles,
  onPlay,
}: {
  files: string[];
  allFiles: string[];
  onPlay: (file: string) => void;
}) {
  const [page, setPage] = useState(1);

  if (files.length === 0) {
    return (
      <Empty
        size="lg"
        iconVariant="flat"
        icon={<BiFolder className="h-12 w-12 text-faint" strokeWidth={1} />}
        description="暂无内容"
      />
    );
  }

  const start = (page - 1) * PAGE_SIZE;
  const pageFiles = files.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {pageFiles.map((file, idx) => {
          const episodeNum = start + idx + 1;
          const coverFile = findVideoCover(file, allFiles);
          const fileName = file.split("/").pop() || file;
          return (
            <div
              key={`${file}-${idx}`}
              className="group cursor-pointer"
              onClick={() => onPlay(file)}
            >
              <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                {coverFile ? (
                  <img
                    src={coverFile}
                    alt={fileName}
                    className="h-full w-full object-cover transition-transform duration-300"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                    <span className="text-2xl font-bold text-slate-400">
                      {String(episodeNum).padStart(2, "0")}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                    <BiPlay className="h-6 w-6 text-slate-900" />
                  </div>
                </div>
                <div className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {String(episodeNum).padStart(2, "0")}
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-left text-sm text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200">
                {fileName}
              </p>
            </div>
          );
        })}
      </div>
      {files.length > PAGE_SIZE && (
        <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={files.length}
            onChange={setPage}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
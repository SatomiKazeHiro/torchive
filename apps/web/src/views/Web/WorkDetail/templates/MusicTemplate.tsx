import { ReactNode, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiMusic } from "react-icons/bi";

import { transformEntities } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { shortHash } from "@/utils/shortHash";
import { filterAudioFiles } from "@/utils/fileHelper";

import WorkDetailShell from "../components/WorkDetailShell";
import TabsPanel, { type FileTab } from "../components/TabsPanel";
import FileListPanel from "../components/FileListPanel";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const PAGE_SIZE = 10;

function getFileIcon(): ReactNode {
  return <BiMusic className="h-4 w-4 text-slate-400" />;
}

function generateTabs(entities: EntitiesJson): FileTab[] {
  const tabs: FileTab[] = [];
  const audioAssets = filterAudioFiles(entities.assets);
  if (audioAssets.length) {
    tabs.push({ key: "tab_assets_main", label: "播放列表", files: sortFiles(audioAssets) });
  }
  entities.section?.forEach((sec, i) => {
    const audioFiles = filterAudioFiles(sec.files);
    if (audioFiles.length) {
      tabs.push({
        key: `tab_section_${i}_${sec.name.replace(/\s+/g, "_")}`,
        label: sec.name,
        files: sortFiles(audioFiles),
      });
    }
  });
  const audioOrphans = filterAudioFiles(entities.orphanAssets);
  if (audioOrphans.length) {
    tabs.push({
      key: "tab_orphan_others",
      label: "其他",
      files: sortFiles(audioOrphans),
    });
  }
  return tabs;
}

function VinylCover({ coverUrl, title }: { coverUrl: string; title: string }) {
  const hasCover = Boolean(coverUrl);
  return (
    <div className="group relative aspect-square w-[200px] md:w-[240px]">
      <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-900">
        {[3, 6, 9, 12, 15, 18].map((pct) => (
          <div
            key={pct}
            className="absolute rounded-full border border-slate-600"
            style={{
              inset: `${pct}%`,
              borderColor: `rgba(148,163,184,${0.35 - (pct / 18) * 0.25})`,
            }}
          />
        ))}
        <div className="absolute inset-[30%] overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700/50">
          {hasCover ? (
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
              <BiMusic className="h-12 w-12 text-slate-400" strokeWidth={1} />
            </div>
          )}
        </div>
        <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 ring-1 ring-slate-700" />
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)]" />
    </div>
  );
}

export default function MusicTemplate({ work, domain, category, domainName }: WorkTemplateProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const entities = useMemo(() => transformEntities(work), [work]);
  const tabs = useMemo(() => generateTabs(entities), [entities]);
  const title = work.detail?.title || work.work;

  const handlePlay = (file: string) =>
    navigate(`/${domain}/${category}/${id}/play?asset=${shortHash(file, 8)}`);

  return (
    <WorkDetailShell
      work={work}
      domain={domain}
      category={category}
      domainName={domainName}
      primaryLabel="播放全部"
      cover={<VinylCover coverUrl={work.detail?.cover ?? ""} title={title} />}
    >
      <TabsPanel
        tabs={tabs}
        renderTabContent={(tab) => (
          <FileListPanel
            files={tab.files}
            pageSize={PAGE_SIZE}
            onPlay={handlePlay}
            renderIcon={getFileIcon}
          />
        )}
      />
    </WorkDetailShell>
  );
}

import { ReactNode, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiFile, BiMoviePlay } from "react-icons/bi";

import { transformEntities } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { shortHash } from "@/utils/shortHash";

import WorkDetailShell from "../components/WorkDetailShell";
import PosterCover from "../components/PosterCover";
import TabsPanel, { type FileTab } from "../components/TabsPanel";
import FileListPanel from "../components/FileListPanel";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const PAGE_SIZE = 10;
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogg", "mov", "mkv"]);

function getFileIcon(file: string): ReactNode {
  const ext = file.split(".").pop()?.toLowerCase() || "";
  if (VIDEO_EXTENSIONS.has(ext)) return <BiMoviePlay className="h-4 w-4 text-slate-400" />;
  return <BiFile className="h-4 w-4 text-slate-400" />;
}

function generateTabs(entities: EntitiesJson): FileTab[] {
  const tabs: FileTab[] = [];
  if (entities.assets?.length) {
    tabs.push({ key: "tab_assets_main", label: "正片", files: sortFiles(entities.assets) });
  }
  entities.section?.forEach((sec, i) => {
    if (sec.files?.length) {
      tabs.push({
        key: `tab_section_${i}_${sec.name.replace(/\s+/g, "_")}`,
        label: sec.name,
        files: sortFiles(sec.files),
      });
    }
  });
  if (entities.orphanAssets?.length) {
    tabs.push({ key: "tab_orphan_others", label: "其他", files: sortFiles(entities.orphanAssets) });
  }
  return tabs;
}

export default function MixtureTemplate({ work, domain, category, domainName }: WorkTemplateProps) {
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
      primaryLabel="查看详情"
      cover={<PosterCover coverUrl={work.detail?.cover ?? ""} title={title} />}
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

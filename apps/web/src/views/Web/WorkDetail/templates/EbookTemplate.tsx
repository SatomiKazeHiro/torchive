import { ReactNode, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BiBook, BiFile } from "react-icons/bi";

import { transformEntities } from "@/mappers/work";
import { sortFiles } from "@/utils/sort";
import { shortHash } from "@/utils/shortHash";
import { filterEbookFiles } from "@/utils/fileHelper";

import WorkDetailShell from "../components/WorkDetailShell";
import PosterCover from "../components/PosterCover";
import TabsPanel, { type FileTab } from "../components/TabsPanel";
import FileListPanel from "../components/FileListPanel";

import type { EntitiesJson } from "@/types/db-instance";
import type { WorkTemplateProps } from "../types";

const PAGE_SIZE = 10;
const EBOOK_EXT = new Set(["epub", "mobi", "azw", "azw3"]);

function getFileIcon(file: string): ReactNode {
  const ext = file.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return <BiBook className="h-4 w-4 text-red-400" />;
  if (EBOOK_EXT.has(ext)) return <BiBook className="text-deep-black h-4 w-4" />;
  return <BiFile className="h-4 w-4 text-slate-400" />;
}

function generateTabs(entities: EntitiesJson): FileTab[] {
  const tabs: FileTab[] = [];
  const ebookAssets = filterEbookFiles(entities.assets);
  if (ebookAssets.length) {
    tabs.push({ key: "tab_assets_main", label: "目录", files: sortFiles(ebookAssets) });
  }
  entities.section?.forEach((sec, i) => {
    const ebookFiles = filterEbookFiles(sec.files);
    if (ebookFiles.length) {
      tabs.push({
        key: `tab_section_${i}_${sec.name.replace(/\s+/g, "_")}`,
        label: sec.name,
        files: sortFiles(ebookFiles),
      });
    }
  });
  const ebookOrphans = filterEbookFiles(entities.orphanAssets);
  if (ebookOrphans.length) {
    tabs.push({
      key: "tab_orphan_others",
      label: "其他",
      files: sortFiles(ebookOrphans),
    });
  }
  return tabs;
}

export default function EbookTemplate({ work, domain, category, domainName }: WorkTemplateProps) {
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
      primaryLabel="开始阅读"
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

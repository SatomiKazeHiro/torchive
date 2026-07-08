import { Poster } from "@/components";

interface PosterCoverProps {
  coverUrl: string;
  title: string;
  widthClass?: string;
}

/** 标准海报封面：160px / 200px 响应式宽度 + 3:4 比例 */
export default function PosterCover({
  coverUrl,
  title,
  widthClass = "w-[160px] md:w-[200px]",
}: PosterCoverProps) {
  return (
    <div
      className={`${widthClass} overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50`}
    >
      <Poster src={coverUrl} alt={title} ratio="3/4" />
    </div>
  );
}
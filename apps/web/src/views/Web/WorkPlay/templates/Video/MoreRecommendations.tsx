import { Link, useNavigate } from "react-router-dom";
import { navigateToWorkDetailByWork } from "@/utils/navigation";
import { mapWorkToBrief } from "@/mappers/work";
import { Poster } from "@/components";

export interface MoreRecommendationsProps {
  /** 域名 */
  domain: string;
  /** 推荐作品列表 */
  recommendedWorks: Work[];
}

/**
 * 更多推荐组件
 */
export default function MoreRecommendations({
  domain,
  recommendedWorks,
}: MoreRecommendationsProps) {
  const navigate = useNavigate();

  if (recommendedWorks.length === 0) {
    return null;
  }

  return (
    <div className="shrink-0 rounded-lg border border-zinc-200 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white">更多推荐</h3>
        <Link
          to={`/${domain}`}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          全部
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {recommendedWorks.slice(0, 3).map((recWork) => {
          const brief = mapWorkToBrief(recWork);
          return (
            <a
              key={recWork.hash_id}
              onClick={() => navigateToWorkDetailByWork(navigate, recWork)}
              className="group block cursor-pointer"
            >
              <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-50 transition-all group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900">
                <Poster src={brief.cover} alt={brief.label} ratio="3/4" />
              </div>
              <p
                className="mt-1 truncate text-xs text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200"
                title={brief.label}
              >
                {brief.label}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

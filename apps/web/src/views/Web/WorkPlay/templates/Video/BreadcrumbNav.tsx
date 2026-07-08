import { BiHeart, BiSolidHeart, BiBookmark, BiSolidBookmark } from "react-icons/bi";
import { Breadcrumb } from "@/components";
import { buildBreadcrumbItems } from "@/views/Web/utils/breadcrumb";
import FavoriteAction from "@/features/user-library/FavoriteAction";
import WatchLaterAction from "@/features/user-library/WatchLaterAction";

export interface BreadcrumbNavProps {
  /** 域名 */
  domain: string;
  /** 分类 */
  category: string;
  /** 域名显示名称 */
  domainName: string;
  /** 作品数据 */
  work: Work;
}

/**
 * Video 播放页面包屑导航
 *
 * 基于原子 Breadcrumb 组件 + buildBreadcrumbItems 封装的业务层组件。
 */
export default function BreadcrumbNav({
  domain,
  category,
  domainName,
  work,
}: BreadcrumbNavProps) {
  return (
    <Breadcrumb
      items={buildBreadcrumbItems({ domain, category, domainName, showHome: true })}
      extra={
        <>
          <FavoriteAction
            work={work}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
            activeSlot={<BiSolidHeart className="h-4 w-4 text-red-500" />}
            inactiveSlot={<BiHeart className="h-4 w-4" />}
          />
          <WatchLaterAction
            work={work}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-deep-black dark:hover:bg-zinc-800"
            activeSlot={<BiSolidBookmark className="h-4 w-4 text-deep-black" />}
            inactiveSlot={<BiBookmark className="h-4 w-4" />}
          />
        </>
      }
    />
  );
}

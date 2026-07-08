import { useEffect, useMemo, useState } from "react";
import { BiLayer, BiCategory, BiCollection, BiFile, BiHdd, BiImage, BiTime } from "react-icons/bi";
import { Skeleton, Empty } from "@/components";
import { getDomains, getCategoriesPage, getWorksPage } from "@/api/web";
import { generateCoverUrl } from "@/mappers/work";
import { formatSize } from "@/utils/format";
import { AdminPageHeader } from "../components";
import { adminStyles } from "../styles";

interface DashboardStats {
  domainCount: number;
  categoryCount: number;
  workCount: number;
  totalFiles: number;
  totalSize: number;
  loading: boolean;
}

function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    domainCount: 0,
    categoryCount: 0,
    workCount: 0,
    totalFiles: 0,
    totalSize: 0,
    loading: true,
  });

  const [domainStats, setDomainStats] = useState<
    Array<{ name: string; workCount: number; size: number }>
  >([]);
  const [recentWorks, setRecentWorks] = useState<Work[]>([]);

  const maxDomainWorkCount = useMemo(
    () => Math.max(...domainStats.map((domain) => domain.workCount), 1),
    [domainStats],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取主题统计
        const domainsRes = await getDomains(true);
        const domains = domainsRes.data;

        // 获取分类统计
        const categoriesRes = await getCategoriesPage({ limit: 1000, withStats: true });
        const categories = categoriesRes.data;

        // 获取资源列表（最近10个）
        const worksRes = await getWorksPage({ limit: 5 });
        const works = worksRes.data;

        // 计算总统计
        const domainCount = domains.length;
        const categoryCount = categories.length;
        const workCount = domains.reduce((sum, d) => sum + (d.stats?.workCount || 0), 0);
        const totalFiles = domains.reduce((sum, d) => sum + (d.stats?.totalAmount || 0), 0);
        const totalSize = domains.reduce((sum, d) => sum + (d.stats?.totalSize || 0), 0);

        setStats({
          domainCount,
          categoryCount,
          workCount,
          totalFiles,
          totalSize,
          loading: false,
        });

        // 主题分布数据
        setDomainStats(
          domains
            .filter((d) => d.state === 1)
            .map((d) => ({
              name: d.name,
              workCount: d.stats?.workCount || 0,
              size: d.stats?.totalSize || 0,
            }))
            .sort((a, b) => b.workCount - a.workCount),
        );

        setRecentWorks(works);
      } catch (error) {
        console.error("获取仪表盘数据失败:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      name: "主题",
      value: stats.domainCount,
      icon: BiLayer,
    },
    {
      name: "分类",
      value: stats.categoryCount,
      icon: BiCategory,
    },
    {
      name: "资源",
      value: stats.workCount,
      icon: BiCollection,
    },
    {
      name: "文件",
      value: stats.totalFiles,
      icon: BiFile,
    },
    {
      name: "占用空间",
      value: formatSize(stats.totalSize),
      icon: BiHdd,
    },
  ];

  return (
    <div id="admin-dashboard" className={adminStyles.page}>
      <div className={adminStyles.pageInner}>
        {/* 页面标题 */}
        <AdminPageHeader title="仪表盘" description="系统数据概览与资源分布统计" />

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`${adminStyles.surface} p-4`}>
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="mt-2 h-4 w-20" />
                </div>
              ))
            : statCards.map((stat) => (
                <div
                  key={stat.name}
                  className={`${adminStyles.surface} group p-4 transition-colors hover:bg-ghost-gray/40 dark:hover:bg-zinc-800/40`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-midtone-gray dark:text-zinc-400">
                        {stat.name}
                      </p>
                      <p className="mt-2 text-[18px] leading-[1.33] font-semibold tracking-[-0.45px] text-deep-black dark:text-zinc-100">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-subtle-ash bg-white text-rich-black transition-colors group-hover:bg-deep-black group-hover:text-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                      <stat.icon className="text-lg" />
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 主题资源分布 */}
          <div className={`${adminStyles.surface} p-4`}>
            <h2 className="mb-4 text-sm font-semibold text-rich-black dark:text-zinc-100">
              主题资源分布
            </h2>
            <div className="space-y-3">
              {stats.loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_5rem_4.75rem] items-center gap-3"
                    >
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="ml-auto h-4 w-10" />
                      <Skeleton className="ml-auto h-4 w-12" />
                    </div>
                  ))
                : domainStats.map((domain) => (
                    <div
                      key={domain.name}
                      className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_5rem_4.75rem] items-center gap-3"
                    >
                      <span className="truncate text-sm font-medium text-rich-black dark:text-zinc-300">
                        {domain.name}
                      </span>
                      <div className="min-w-0">
                        <div className="h-2 overflow-hidden rounded-[9999px] bg-ghost-gray dark:bg-zinc-800">
                          <div
                            className="h-full rounded-[9999px] bg-deep-black dark:bg-zinc-100"
                            style={{
                              width: `${Math.min((domain.workCount / maxDomainWorkCount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-right text-xs tabular-nums text-midtone-gray dark:text-zinc-400">
                        {domain.workCount}
                      </span>
                      <span className="text-right font-mono text-xs tabular-nums text-midtone-gray dark:text-zinc-400">
                        {formatSize(domain.size)}
                      </span>
                    </div>
                  ))}
              {domainStats.length === 0 && !stats.loading && (
                <Empty size="sm" description="暂无数据" icon={null} />
              )}
            </div>
          </div>

          {/* 最近更新 */}
          <div className={`${adminStyles.surface} p-4`}>
            <h2 className="mb-4 text-sm font-semibold text-rich-black dark:text-zinc-100">
              最近更新
            </h2>
            <div className="space-y-1">
              {stats.loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-1 h-3 w-20" />
                      </div>
                    </div>
                  ))
                : recentWorks.map((work) => (
                    <div
                      key={work.hash_id}
                      className="group flex items-center gap-3 rounded-[10px] px-2 py-3 transition-colors hover:bg-ghost-gray dark:hover:bg-zinc-800/60"
                    >
                      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[10px] border border-subtle-ash bg-ghost-gray dark:border-zinc-700 dark:bg-zinc-800">
                        {generateCoverUrl(work) ? (
                          <img
                            src={generateCoverUrl(work)}
                            alt={work.detail?.title || work.work}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
                                "hidden",
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`flex h-full w-full items-center justify-center text-midtone-gray ${
                            generateCoverUrl(work) ? "hidden" : ""
                          }`}
                        >
                          <BiImage className="text-lg" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-rich-black dark:text-zinc-100">
                          {work.detail?.title || work.work}
                        </p>
                        <p className="text-xs text-midtone-gray dark:text-zinc-400">
                          {work.domain} · {work.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-midtone-gray dark:text-zinc-500">
                        <BiTime className="text-sm" />
                        {new Date(work.detail?.create_time).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  ))}
              {recentWorks.length === 0 && !stats.loading && (
                <Empty size="sm" description="暂无数据" icon={null} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;

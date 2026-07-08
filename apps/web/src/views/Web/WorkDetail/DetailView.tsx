import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BiFile, BiFolder } from "react-icons/bi";
import { navigateToWorkDetailByWork } from "@/utils/navigation";
import { getWork, getLatestWork, getCategories, getDomains } from "@/api/web";
import { mapWorkToBrief } from "@/mappers/work";
import { Card, Button, Poster } from "@/components";
import { MixtureTemplate, MusicTemplate, EbookTemplate, VideoTemplate, MangaTemplate, AlbumTemplate } from "./templates";
import { DEFAULT_WORK_PAGE_TEMPLATE } from "./types";

function WorkDetailView() {
  const { domain, category, id } = useParams<{
    domain: string;
    category: string;
    id: string;
  }>();
  const navigate = useNavigate();

  const [work, setWork] = useState<Work | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedWorks, setRecommendedWorks] = useState<Work[]>([]);

  // 域名显示名称 - 从服务器获取的 domains 中查找
  const domainName = useMemo(() => {
    if (!domain || domains.length === 0) return domain || "";
    const matchedDomain = domains.find((d) => d.domain === domain);
    return matchedDomain?.name || domain;
  }, [domain, domains]);

  // 获取作品数据、分类信息和域名列表
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !domain || !category) return;
      setLoading(true);
      setError(null);
      try {
        // 并行获取：作品详情、分类列表、域名列表
        const [workRes, categoriesRes, domainsRes] = await Promise.all([
          getWork(id),
          getCategories(domain),
          getDomains(),
        ]);

        setWork(workRes.data);
        setDomains(domainsRes.data);

        // 查找匹配的分类
        const matchedCategory = categoriesRes.data.find((cat) => cat.category === category);
        if (matchedCategory) {
          setCategoryInfo(matchedCategory);
        }
      } catch (err) {
        setError("获取数据失败，请稍后重试");
        console.error("Failed to fetch work detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, domain, category]);

  // 获取推荐作品
  useEffect(() => {
    if (!domain) return;
    getLatestWork(domain, category).then((res) => {
      setRecommendedWorks(res.data.filter((w) => w.hash_id !== id).slice(0, 6));
    });
  }, [domain, category, id]);

  // 确定使用的模板
  const workPageTemplate: WorkPageTemplate = useMemo(() => {
    const template = categoryInfo?.work_page_template;
    if (template && ["mixture", "video", "manga", "album", "music", "ebook"].includes(template)) {
      return template as WorkPageTemplate;
    }
    return DEFAULT_WORK_PAGE_TEMPLATE;
  }, [categoryInfo]);

  // 渲染对应模板的内容区域（上+中）
  const renderTemplateContent = () => {
    if (!work || !domain || !category) return null;

    const templateProps = {
      work,
      domain,
      category,
      domainName,
    };

    switch (workPageTemplate) {
      case "music":
        return <MusicTemplate {...templateProps} />;
      case "ebook":
        return <EbookTemplate {...templateProps} />;
      case "video":
        return <VideoTemplate {...templateProps} />;
      case "manga":
        return <MangaTemplate {...templateProps} />;
      case "album":
        return <AlbumTemplate {...templateProps} />
      case "mixture":
      default:
        return <MixtureTemplate {...templateProps} />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 dark:border-slate-700 dark:border-t-slate-400" />
          <span className="text-[14px]">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <Card className="w-full max-w-sm py-12 text-center" bordered={false} shadow="sm">
          <BiFile
            className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700"
            strokeWidth={1}
          />
          <p className="mb-6 text-[14px] text-slate-600 dark:text-slate-400">
            {error || "作品不存在"}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div id="work-detail-page" className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 模板内容区域（上+中） */}
      {renderTemplateContent()}

      {/* ==================== 下部：推荐区域 ==================== */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-[15px] font-medium tracking-wider text-slate-900 uppercase dark:text-white">
            更多推荐
          </h3>
          <Link
            to={`/${domain}`}
            className="text-[13px] text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-slate-100"
          >
            查看全部
          </Link>
        </div>

        {recommendedWorks.length > 0 ? (
          <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {recommendedWorks.map((recWork) => {
              const workBrief = mapWorkToBrief(recWork);

              return (
                <a
                  key={recWork.hash_id}
                  onClick={() => navigateToWorkDetailByWork(navigate, recWork)}
                  className="group block cursor-pointer"
                >
                  <div
                    className={`overflow-hidden rounded-lg border bg-slate-50 transition-colors duration-200 group-hover:border-slate-300 dark:bg-slate-800/50 dark:group-hover:border-slate-700 ${workBrief.cover ? "border-slate-200 dark:border-slate-800" : "border-slate-100 dark:border-slate-800"}`}
                  >
                    <Poster src={workBrief.cover} alt={workBrief.label} ratio="3/4" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-slate-600 transition-colors group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200">
                    {workBrief.label}
                  </p>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
            <BiFolder
              className="mx-auto mb-4 h-12 w-12 text-slate-200 dark:text-slate-800"
              strokeWidth={1}
            />
            <p className="text-[14px] text-slate-400 dark:text-slate-500">暂无推荐作品</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkDetailView;

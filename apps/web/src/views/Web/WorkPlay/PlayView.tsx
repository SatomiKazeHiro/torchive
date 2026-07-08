import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getWork, getCategories, getDomains, getLatestWork, createUserHistory } from "@/api/web";
import { useUser } from "@/contexts/useUser";
import { transformEntities } from "@/mappers/work";
import { cn } from "@/components/utils/common";
import Navbar from "@/features/navigation/NavBar";
import MixturePlayTemplate from "./templates/Mixture";
import VideoPlayTemplate from "./templates/Video";
import MangaPlayTemplate from "./templates/Manga";
import MusicPlayTemplate from "./templates/Music";
import AlbumPlayTemplate from "./templates/Album";
import type { TransformedWorkData } from "./templates/Mixture";

// Ebook 模板含 react-pdf，按需懒加载
const EbookPlayTemplate = lazy(() => import("./templates/Ebook"));

/**
 * 播放页面入口
 *
 * 负责：
 * 1. 获取作品数据（work、domains、category 等）
 * 2. 使用 transformEntities 处理 entities 数据
 * 3. 渲染公共 NavBar 顶部导航
 * 4. 根据模板类型选择对应的播放模板组件
 * 5. 将处理后的数据通过 props 传递给模板组件
 */
function PlayView() {
  const { domain, category, id } = useParams<{
    domain: string;
    category: string;
    id: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  // 从路由 state 获取初始文件路径
  const initialFilePath = (location.state as { filePath?: string })?.filePath;

  // 原始数据状态
  const [work, setWork] = useState<Work | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedWorks, setRecommendedWorks] = useState<Work[]>([]);

  // 域名显示名称
  const domainName = useMemo(() => {
    if (!domain || domains.length === 0) return domain || "";
    const matchedDomain = domains.find((d) => d.domain === domain);
    return matchedDomain?.name || domain;
  }, [domain, domains]);

  // 使用 transformEntities 处理 work 数据
  const transformedWorkData: TransformedWorkData | null = useMemo(() => {
    if (!work) return null;
    return {
      work,
      entities: transformEntities(work),
    };
  }, [work]);

  // 获取作品数据
  const fetchData = async () => {
    if (!id || !domain || !category) {
      setError("参数错误");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [workRes, categoriesRes, domainsRes] = await Promise.all([
        getWork(id),
        getCategories(domain),
        getDomains(),
      ]);

      setWork(workRes.data);
      setDomains(domainsRes.data);

      const matchedCategory = categoriesRes.data.find((cat) => cat.category === category);
      if (matchedCategory) {
        setCategoryInfo(matchedCategory);
      }

      // 记录观看历史（已登录用户）
      if (user && id) {
        createUserHistory({
          uid: user.uid,
          work_hash_id: id,
          params: initialFilePath,
        }).catch(() => {
          // 静默失败，不影响播放体验
        });
      }
    } catch (err) {
      setError("获取数据失败，请稍后重试");
      console.error("Failed to fetch work:", err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchData();
    // fetchData 引用每次渲染变化（依赖 useCallback 内 state），故只跟随路由参数触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, domain, category]);

  // 获取推荐作品
  useEffect(() => {
    if (!domain) return;
    getLatestWork(domain, category).then((res) => {
      setRecommendedWorks(res.data.filter((w) => w.hash_id !== id).slice(0, 6));
    });
  }, [domain, category, id]);

  // 处理搜索
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  };

  // 根据分类配置决定模板类型
  const templateType = categoryInfo?.work_page_template || "mixture";

  // 渲染模板内容
  const renderTemplate = () => {
    const commonProps = {
      transformedWorkData,
      domain: domain || "",
      category: category || "",
      domainName,
      loading,
      error,
      onRetry: fetchData,
      recommendedWorks,
      initialFilePath,
    };

    switch (templateType) {
      case "music":
        return <MusicPlayTemplate {...commonProps} />;
      case "ebook":
        return <EbookPlayTemplate {...commonProps} />;
      case "video":
        return <VideoPlayTemplate {...commonProps} />;
      case "manga":
        return <MangaPlayTemplate {...commonProps} />;
      case "album":
        return <AlbumPlayTemplate {...commonProps} />;
      case "mixture":
      default:
        return <MixturePlayTemplate {...commonProps} />;
    }
  };

  // 是否显示顶部导航栏（漫画/电子书模式全屏沉浸，不显示）
  const showNavbar = templateType !== "manga" && templateType !== "ebook";

  return (
    <div className="min-h-screen bg-page">
      {/* 公共顶部导航 - 漫画模式下隐藏 */}
      {showNavbar && (
        <Navbar
          logo={<span className="text-xl font-bold">Torchive</span>}
          leftLinks={[
            { name: "首页", to: "/" },
            ...(domain ? [{ name: domainName || domain, to: `/${domain}` }] : []),
          ]}
          onSearch={handleSearch}
          mode="normal"
        />
      )}

      {/* 模板内容区域 */}
      <div className={cn("overflow-hidden", showNavbar ? "h-[calc(100vh-64px)]" : "h-screen")}>
        <Suspense fallback={<TemplateLoading />}>
          {renderTemplate()}
        </Suspense>
      </div>
    </div>
  );
}

function TemplateLoading() {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-800 dark:border-t-zinc-400" />
        <span className="text-sm">加载中...</span>
      </div>
    </div>
  );
}

export default PlayView;

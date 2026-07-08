import { useEffect, lazy, Suspense, useMemo } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { createUserHistory } from "@/api/web";
import { useUser } from "@/contexts/useUser";
import { transformEntities } from "@/mappers/work";
import { useWorkWithContext } from "@/hooks/useWorkWithContext";
import { shortHash } from "@/utils/shortHash";
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
 * 1. 通过 useWorkWithContext 获取作品数据（work、domains、category、推荐）
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
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  // 从路由 state 获取初始文件路径(向后兼容旧链接)
  const stateFilePath = (location.state as { filePath?: string })?.filePath;

  const { work, categoryInfo, recommendedWorks, loading, error, domainName, refetch } =
    useWorkWithContext({ id, domain, category });

  // 使用 transformEntities 处理 work 数据
  const transformedWorkData: TransformedWorkData | null = work
    ? { work, entities: transformEntities(work) }
    : null;

  // URL ?asset=<shortHash> → 全路径(work 内 local 查表)
  // 5 个非 Video 模板的初值都从这里走,Video 模板有自己的 hook
  const { initialFilePath, initialAsset } = useMemo(() => {
    if (!transformedWorkData) {
      return { initialFilePath: stateFilePath, initialAsset: undefined };
    }
    const entities = transformedWorkData.entities;
    const hashToPath = new Map<string, string>();
    for (const p of entities.assets ?? []) hashToPath.set(shortHash(p, 8), p);
    for (const sec of entities.section ?? []) {
      for (const p of sec.files ?? []) hashToPath.set(shortHash(p, 8), p);
    }
    for (const p of entities.orphanAssets ?? []) hashToPath.set(shortHash(p, 8), p);

    const urlAsset = searchParams.get("asset") ?? undefined;
    const urlHash = hashToPath.get(urlAsset ?? "");
    const resolvedFromUrl = urlHash ?? undefined;
    const resolvedFromState = stateFilePath ?? undefined;
    // initialAsset 是 URL 上的原值(短 hash),仅用于首次创建观看历史
    const initialAssetValue = urlAsset ?? resolvedFromState;
    // initialFilePath 是模板真正消费的完整路径
    const initialFilePathValue = resolvedFromUrl ?? resolvedFromState;
    return {
      initialFilePath: initialFilePathValue,
      initialAsset: initialAssetValue,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformedWorkData]);

  // 记录观看历史（已登录用户，静默失败,仅首次进入时记录）
  useEffect(() => {
    if (!user || !id || !initialAsset) return;
    createUserHistory({
      uid: user.uid,
      work_hash_id: id,
      params: initialAsset,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

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
      onRetry: refetch,
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
    <div className="bg-page min-h-screen">
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
        <Suspense fallback={<TemplateLoading />}>{renderTemplate()}</Suspense>
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

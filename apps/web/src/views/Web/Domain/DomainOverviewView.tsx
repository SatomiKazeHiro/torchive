import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { navigateToWorkDetailByWork } from "@/utils/navigation";
import { getWorkList, getDomains, getCategories } from "@/api/web";
import { generateCoverUrl } from "@/mappers/work";
import { Pagination, PosterV2, Empty } from "@/components";

const PAGE_SIZE = 15;

function DomainOverviewView() {
  const navigate = useNavigate();
  // 路径参数唯一驱动 domain/category；query 只承担 page
  const { domain: pathDomain, category: pathCategory } = useParams<{
    domain: string;
    category?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedDomain = pathDomain;
  // null = 该 domain 下全部(category 可反选);有值 = 锁定到具体分类
  const selectedCategory = pathCategory ?? null;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchWorks = useCallback(async (page: number, domain: string, category: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWorkList({
        page,
        limit: PAGE_SIZE,
        domain,
        category: category ?? undefined,
        order: { create_time: "DESC" },
      });
      setWorks(response.data);
      setTotal(response.meta.total);
      setTotalPages(Math.ceil(response.meta.total / PAGE_SIZE));
    } catch (err) {
      setError("获取数据失败，请稍后重试");
      console.error("Failed to fetch works:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchDomains = async () => {
      setDomainsLoading(true);
      try {
        const response = await getDomains();
        setDomains(response.data);
      } catch (err) {
        console.error("Failed to fetch domains:", err);
      } finally {
        setDomainsLoading(false);
      }
    };
    fetchDomains();
  }, []);

  useEffect(() => {
    if (!selectedDomain) {
      setCategories([]);
      return;
    }
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await getCategories(selectedDomain);
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, [selectedDomain]);

  useEffect(() => {
    if (!selectedDomain) return;
    fetchWorks(currentPage, selectedDomain, selectedCategory);
  }, [currentPage, selectedDomain, selectedCategory, fetchWorks]);

  // 切 domain/category → navigate 改 path,自动丢掉 page(走默认值 1)
  const handleDomainChange = (domainId: string) => {
    navigate(`/${domainId}`);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    // null = 反选,等价"该 domain 全部"
    navigate(categoryId === null ? `/${selectedDomain}` : `/${selectedDomain}/${categoryId}`);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPaginationChange = (page: number) => {
    handlePageChange(page);
  };

  return (
    <div id="domain-overview-page" className="min-h-screen bg-white dark:bg-zinc-950">
      {/* 过滤器 */}
      <div className={`bg-white transition-all dark:bg-zinc-900`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-2 overflow-x-auto py-3">
            <span className="mr-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              主题：
            </span>
            {domainsLoading ? (
              <span className="text-sm text-zinc-500">加载中...</span>
            ) : (
              domains.map((domain) => (
                <button
                  key={domain.domain}
                  onClick={() => handleDomainChange(domain.domain)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDomain === domain.domain
                      ? "border border-zinc-800 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-transparent bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  }`}
                >
                  {domain.name || domain.domain}
                </button>
              ))
            )}
          </div>

          {selectedDomain && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto border-t border-zinc-100 py-2.5 dark:border-zinc-800">
              <span className="mr-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                分类：
              </span>
              {categoriesLoading ? (
                <span className="text-sm text-zinc-500">加载中...</span>
              ) : (
                categories.map((category) => {
                  const isActive = selectedCategory === category.category;
                  // 再点已选中的分类 = 反选(回退到该 domain 全部)
                  const next = isActive ? null : category.category;
                  return (
                    <button
                      key={category.category}
                      onClick={() => handleCategoryChange(next)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "border border-zinc-800 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                          : "border border-transparent bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {category.name || category.category}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 内容网格区域 */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-500">加载中...</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <svg
                className="h-6 w-6 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">{error}</p>
            <button
              onClick={() => {
                if (!selectedDomain) return;
                fetchWorks(currentPage, selectedDomain, selectedCategory);
              }}
              className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {works.length === 0 ? (
              <Empty bordered size="lg" description="暂无数据" icon={null} />
            ) : (
              <>
                <div className="grid grid-cols-5 gap-5">
                  {/* {works.map((work) => (
                    <a
                      key={work.hash_id}
                      className="group block cursor-pointer"
                      title={work.detail?.title || work.work}
                      onClick={() => navigateToWorkDetailByWork(navigate, work)}
                    >
                      <Poster
                        src={work.detail?.cover ? generateCoverUrl(work) : ""}
                        alt={work.detail?.title || work.work}
                      />
                      <div className="mt-2.5 line-clamp-2 text-sm font-medium text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-400">
                        {work.detail?.title || work.work}
                      </div>
                    </a>
                  ))} */}
                  {works.map((work) => {
                    const title = work.detail?.title || work.work;
                    const cover = generateCoverUrl(work);
                    return (
                      <div className="w-full">
                        <a
                          key={work.hash_id}
                          className="group block cursor-pointer"
                          title={title}
                          onClick={() => navigateToWorkDetailByWork(navigate, work)}
                        >
                          <PosterV2 src={cover} alt={title} />
                          <div className="mt-2 line-clamp-2 text-sm text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                            {title}
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10">
                  <Pagination
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={onPaginationChange}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DomainOverviewView;

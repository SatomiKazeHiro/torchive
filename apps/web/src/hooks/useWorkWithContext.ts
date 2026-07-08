import { useCallback, useEffect, useMemo, useState } from "react";

import { getCategories, getDomains, getLatestWork, getWork } from "@/api/web";

export interface UseWorkWithContextParams {
  id?: string;
  domain?: string;
  category?: string;
  withRecommended?: boolean;
  recommendedLimit?: number;
}

export interface UseWorkWithContextResult {
  work: Work | null;
  categoryInfo: Category | null;
  domains: Domain[];
  recommendedWorks: Work[];
  loading: boolean;
  error: string | null;
  domainName: string;
  refetch: () => void;
}

export function useWorkWithContext({
  id,
  domain,
  category,
  withRecommended = true,
  recommendedLimit = 6,
}: UseWorkWithContextParams): UseWorkWithContextResult {
  const [work, setWork] = useState<Work | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<Category | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [recommendedWorks, setRecommendedWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!id || !domain || !category) {
      setError("参数错误");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [workRes, categoriesRes, domainsRes] = await Promise.all([
          getWork(id),
          getCategories(domain),
          getDomains(),
        ]);
        if (cancelled) return;
        setWork(workRes.data);
        setDomains(domainsRes.data);
        const matched = categoriesRes.data.find((c) => c.category === category);
        if (matched) setCategoryInfo(matched);
      } catch (err) {
        if (cancelled) return;
        setError("获取数据失败，请稍后重试");
        console.error("Failed to fetch work:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, domain, category, reloadKey]);

  useEffect(() => {
    if (!withRecommended || !domain) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getLatestWork(domain, category);
        if (cancelled) return;
        setRecommendedWorks(res.data.filter((w) => w.hash_id !== id).slice(0, recommendedLimit));
      } catch {
        // 推荐作品拉取失败不影响主流程
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [withRecommended, domain, category, id, recommendedLimit, reloadKey]);

  const domainName = useMemo(() => {
    if (!domain || domains.length === 0) return domain ?? "";
    return domains.find((d) => d.domain === domain)?.name ?? domain;
  }, [domain, domains]);

  return {
    work,
    categoryInfo,
    domains,
    recommendedWorks,
    loading,
    error,
    domainName,
    refetch,
  };
}

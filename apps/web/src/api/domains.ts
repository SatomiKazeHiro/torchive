import { webHttp, TsResponse } from "./shared";

export function getDomains(withStats?: boolean) {
  return webHttp.post<TsResponse<Domain>>("/domains/page", {
    limit: 100,
    withStats,
  });
}

export function createDomain(data: Omit<Domain, "exist">) {
  return webHttp.post<Domain>("/domains", data as Record<string, unknown>);
}

export function updateDomain(domain: string, data: Partial<Omit<Domain, "domain">>) {
  return webHttp.patch<Domain>(`/domains/${domain}`, data as Record<string, unknown>);
}

export function deleteDomain(domain: string) {
  return webHttp.del<void>(`/domains/${domain}`);
}
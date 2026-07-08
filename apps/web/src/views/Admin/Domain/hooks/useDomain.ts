import { useRequest } from "ahooks";
import { getDomains, createDomain, updateDomain, deleteDomain } from "@/api/web";
import type { Domain } from "@/types/db-instance";
import type { DomainFormData } from "../types";

export function useDomain() {
  const {
    data: domainsData,
    loading,
    refresh,
  } = useRequest(async () => {
    const res = await getDomains(true); // withStats = true
    return res.data;
  });

  const domains = domainsData || [];

  const handleCreate = async (data: DomainFormData) => {
    await createDomain({
      ...data,
    });
    refresh();
  };

  const handleUpdate = async (domainId: string, data: Partial<DomainFormData>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { domain, ...updateData } = data;
    await updateDomain(domainId, updateData);
    refresh();
  };

  const handleDelete = async (domainId: string) => {
    await deleteDomain(domainId);
    refresh();
  };

  const toggleState = async (domain: Domain, newState: number) => {
    await updateDomain(domain.domain, { state: newState });
    refresh();
  };

  return {
    domains,
    loading,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    toggleState,
  };
}

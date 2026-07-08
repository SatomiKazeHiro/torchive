import { useEffect, useState } from "react";
import { getDomains, getLatestWork } from "@/api/web";
import HorizontalScroller, { HorizontalScrollerItem } from "@/features/common/HorizontalScroller";
import { mapWorkToBrief } from "@/mappers/work";

type DomainsRresouece = HorizontalScrollerItem[][];

export default function DomainList() {
  const [domainItems, setDomains] = useState<Domain[]>([]);
  const [domainRresouece, setDomainsRresouece] = useState<DomainsRresouece>([]);

  const fetchData = async () => {
    const domainsRes = await getDomains();
    const domains = domainsRes.data;
    setDomains(domains);

    const worksPros = [];
    const works: DomainsRresouece = Array.from({ length: domains.length }).map(() => []);

    for (let index = 0; index < domains.length; index++) {
      const domainItem = domains[index];
      worksPros.push(
        getLatestWork(domainItem.domain).then((res) => {
          const list = res.data || [];
          works[index] = list.map((i) => mapWorkToBrief(i));
        }),
      );
    }
    await Promise.allSettled(worksPros);
    setDomainsRresouece(works);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return domainItems.map((domainItem, index) => (
    <HorizontalScroller
      key={domainItem.domain}
      title={domainItem.name || domainItem.domain}
      link={`/${domainItem.domain}`}
      items={domainRresouece[index]}
    />
  ));
}

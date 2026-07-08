import { ReactNode, useEffect, useState } from "react";
import { BiFolder } from "react-icons/bi";
import { Tabs, Empty } from "@/components";

export interface FileTab {
  key: string;
  label: string;
  files: string[];
}

interface TabsPanelProps<T extends FileTab = FileTab> {
  tabs: T[];
  /** 当只有 1 个 tab 时是否仍显示标签头；默认 true。Manga 设为 false。 */
  showTabsWhenSingle?: boolean;
  renderTabContent: (tab: T) => ReactNode;
}

export default function TabsPanel<T extends FileTab = FileTab>({
  tabs,
  showTabsWhenSingle = true,
  renderTabContent,
}: TabsPanelProps<T>) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key || "");

  // tabs 列表变化（数据切换）时，若当前 activeTab 不在新列表里，重置
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((t) => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  if (tabs.length === 0) {
    return (
      <Empty
        bordered
        size="lg"
        iconVariant="flat"
        icon={<BiFolder className="h-12 w-12 text-faint" strokeWidth={1} />}
        description="暂无数据"
      />
    );
  }

  // 单 tab 且不需要显示 tabs 头：直接渲染内容
  if (tabs.length === 1 && !showTabsWhenSingle) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {renderTabContent(tabs[0])}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <Tabs
        type="line"
        size="md"
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarClassName="px-4 pt-2 border-b border-slate-100 dark:border-slate-800"
        contentClassName="p-0"
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: renderTabContent(tab),
        }))}
      />
    </div>
  );
}
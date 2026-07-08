import React from 'react';
import Layout from './Layout';

// ==================== 示例 1: 基础用法（仅 Header）====================
const BasicExample = () => {
  return (
    <Layout
      header={
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            页面标题
          </span>
          <button className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
            操作
          </button>
        </div>
      }
    >
      <div className="p-4 space-y-2">
        <p className="text-zinc-700 dark:text-zinc-300">
          这是内容区域，可以放置各种组件和数据。
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Layout 组件会自动处理头部和内容的布局，内容区域支持滚动。
        </p>
      </div>
    </Layout>
  );
};

// ==================== 示例 2: 完整布局（Header + Footer）====================
const CompleteExample = () => {
  return (
    <Layout
      showHeader
      showFooter
      header={
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            应用名称
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>© 2024</span>
          <span>v1.0.0</span>
        </div>
      }
    >
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
          <div className="h-16 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
          <div className="h-16 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
          <div className="h-16 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700" />
        </div>
      </div>
    </Layout>
  );
};

// ==================== 示例 3: 无 Header（纯内容）====================
const ContentOnlyExample = () => {
  return (
    <Layout showHeader={false}>
      <div className="p-4 text-zinc-700 dark:text-zinc-300">
        这是一个没有 Header 的纯内容布局，适合弹窗或嵌入式场景。
      </div>
    </Layout>
  );
};

// ==================== 导出示例 ====================
export { BasicExample, CompleteExample, ContentOnlyExample };
export default Layout;

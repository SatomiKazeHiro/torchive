import React from 'react';

/**
 * Layout 组件 - 现代简约扁平风格
 * 
 * @param {Object} props
 * @param {boolean} props.showHeader - 是否显示头部，默认 true
 * @param {boolean} props.showFooter - 是否显示底部，默认 false
 * @param {string} props.headerClass - 头部自定义类名
 * @param {string} props.footerClass - 底部自定义类名
 * @param {string} props.contentClass - 内容区自定义类名
 * @param {React.ReactNode} props.header - 头部内容（render prop 方式）
 * @param {React.ReactNode} props.footer - 底部内容（render prop 方式）
 * @param {React.ReactNode} props.children - 内容区
 */
const Layout = ({
  showHeader = true,
  showFooter = false,
  headerClass = '',
  footerClass = '',
  contentClass = '',
  header,
  footer,
  children,
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header */}
      {showHeader && header && (
        <div
          className={[
            'flex-shrink-0 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800',
            headerClass,
          ].join(' ')}
        >
          {header}
        </div>
      )}

      {/* Content */}
      <div className={['flex-1 overflow-auto', contentClass].join(' ')}>
        {children}
      </div>

      {/* Footer */}
      {showFooter && footer && (
        <div
          className={[
            'flex-shrink-0 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800',
            footerClass,
          ].join(' ')}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Layout;

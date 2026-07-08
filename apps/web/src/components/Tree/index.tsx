import React, { useCallback, useMemo } from "react";
import { useControllableValue, useSet } from "ahooks";
import { flatten } from "es-toolkit";
import { BiChevronRight, BiChevronDown, BiFolder, BiFolderOpen, BiFile } from "react-icons/bi";

// ==================== Tree 树形控件 ====================

export interface TreeNodeData {
  /** 节点唯一标识 */
  key: string;
  /** 节点标题 */
  title: React.ReactNode;
  /** 子节点 */
  children?: TreeNodeData[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否可选中 */
  selectable?: boolean;
  /** 是否勾选 */
  checked?: boolean;
  /** 是否半选 */
  indeterminate?: boolean;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 自定义展开图标 */
  switcherIcon?: React.ReactNode;
  /** 是否叶子节点 */
  isLeaf?: boolean;
  /** 附加数据 */
  [key: string]: unknown;
}

export interface TreeProps {
  /** 树形数据 */
  treeData?: TreeNodeData[];
  /** 默认展开的节点 */
  defaultExpandedKeys?: string[];
  /** 展开的节点（受控） */
  expandedKeys?: string[];
  /** 展开回调 */
  onExpand?: (expandedKeys: string[], info: { expanded: boolean; node: TreeNodeData }) => void;
  /** 默认选中的节点 */
  defaultSelectedKeys?: string[];
  /** 选中的节点（受控） */
  selectedKeys?: string[];
  /** 选中回调 */
  onSelect?: (selectedKeys: string[], info: { selected: boolean; selectedNodes: TreeNodeData[]; node: TreeNodeData }) => void;
  /** 默认勾选的节点 */
  defaultCheckedKeys?: string[];
  /** 勾选的节点（受控） */
  checkedKeys?: string[];
  /** 勾选回调 */
  onCheck?: (checkedKeys: string[], info: { checked: boolean; checkedNodes: TreeNodeData[]; node: TreeNodeData }) => void;
  /** 是否显示复选框 */
  checkable?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否显示连线 */
  showLine?: boolean;
  /** 是否展示图标 */
  showIcon?: boolean;
  /** 是否默认展开所有 */
  defaultExpandAll?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可搜索 */
  searchable?: boolean;
  /** 搜索关键词 */
  searchValue?: string;
  /** 自定义类名 */
  className?: string;
  /** 节点点击回调 */
  onClick?: (node: TreeNodeData) => void;
  /** 节点双击回调 */
  onDoubleClick?: (node: TreeNodeData) => void;
  /** 自定义标题渲染 */
  titleRender?: (node: TreeNodeData) => React.ReactNode;
  /** 自定义图标渲染 */
  iconRender?: (node: TreeNodeData) => React.ReactNode;
}

// 使用 es-toolkit flatten 替代手写的 flattenTree 函数
function flattenTree(nodes: TreeNodeData[]): TreeNodeData[] {
  return flatten(
    nodes.map((node) => [
      node,
      ...(node.children ? flattenTree(node.children) : []),
    ])
  );
}

// 辅助函数：检查数组是否为空
const isEmptyArray = <T,>(arr?: T[]): boolean => !arr || arr.length === 0;

export const Tree: React.FC<TreeProps> = ({
  treeData = [],
  defaultExpandedKeys = [],
  expandedKeys,
  onExpand,
  defaultSelectedKeys = [],
  selectedKeys,
  onSelect,
  defaultCheckedKeys = [],
  checkedKeys,
  onCheck,
  checkable = false,
  draggable = false,
  showLine = false,
  showIcon = true,
  defaultExpandAll = false,
  multiple = false,
  searchable = false,
  searchValue = "",
  className = "",
  onClick,
  onDoubleClick,
  titleRender,
  iconRender,
}) => {
  // 使用 useMemo 缓存扁平化数据
  const flattenedData = useMemo(() => flattenTree(treeData), [treeData]);

  // 使用 ahooks useControllableValue 管理展开状态
  const [currentExpandedKeys, setCurrentExpandedKeys] = useControllableValue<string[]>({
    value: expandedKeys,
    defaultValue: defaultExpandAll
      ? flattenedData.map((node) => node.key)
      : defaultExpandedKeys,
  });
  // 确保始终是数组
  const safeExpandedKeys = currentExpandedKeys || [];

  // 使用 ahooks useSet 管理展开状态（更高效的集合操作）
  const [expandedKeysSet, { add: addExpandedKey, remove: removeExpandedKey }] = useSet(safeExpandedKeys);

  // 使用 ahooks useControllableValue 管理选中状态
  const [currentSelectedKeys, setCurrentSelectedKeys] = useControllableValue<string[]>({
    value: selectedKeys,
    defaultValue: defaultSelectedKeys,
  });
  // 确保始终是数组（useMemo 防止引用每次渲染变化导致下游 useCallback 失效）
  const safeSelectedKeys = useMemo(() => currentSelectedKeys || [], [currentSelectedKeys]);

  // 使用 ahooks useControllableValue 管理勾选状态
  const [currentCheckedKeys, setCurrentCheckedKeys] = useControllableValue<string[]>({
    value: checkedKeys,
    defaultValue: defaultCheckedKeys,
  });
  // 确保始终是数组
  const safeCheckedKeys = useMemo(() => currentCheckedKeys || [], [currentCheckedKeys]);

  // 展开/收起节点
  const handleExpand = useCallback(
    (node: TreeNodeData, expanded: boolean) => {
      if (expanded) {
        addExpandedKey(node.key);
      } else {
        removeExpandedKey(node.key);
      }
      const newKeys = Array.from(expandedKeysSet);
      setCurrentExpandedKeys(newKeys);
      onExpand?.(newKeys, { expanded, node });
    },
    [expandedKeysSet, addExpandedKey, removeExpandedKey, onExpand, setCurrentExpandedKeys]
  );

  // 选择节点
  const handleSelect = useCallback(
    (node: TreeNodeData, selected: boolean) => {
      let newSelectedKeys: string[];

      if (multiple) {
        const selectedSet = new Set(safeSelectedKeys);
        if (selected) {
          selectedSet.add(node.key);
        } else {
          selectedSet.delete(node.key);
        }
        newSelectedKeys = Array.from(selectedSet);
      } else {
        newSelectedKeys = selected ? [node.key] : [];
      }

      setCurrentSelectedKeys(newSelectedKeys);

      const selectedNodes = flattenedData.filter((n) =>
        newSelectedKeys.includes(n.key)
      );
      onSelect?.(newSelectedKeys, { selected, selectedNodes, node });
      onClick?.(node);
    },
    [safeSelectedKeys, multiple, flattenedData, onSelect, onClick, setCurrentSelectedKeys]
  );

  // 勾选节点
  const handleCheck = useCallback(
    (node: TreeNodeData, checked: boolean) => {
      const checkedSet = new Set(safeCheckedKeys);
      if (checked) {
        checkedSet.add(node.key);
      } else {
        checkedSet.delete(node.key);
      }
      const newCheckedKeys = Array.from(checkedSet);

      setCurrentCheckedKeys(newCheckedKeys);

      const checkedNodes = flattenedData.filter((n) =>
        newCheckedKeys.includes(n.key)
      );
      onCheck?.(newCheckedKeys, { checked, checkedNodes, node });
    },
    [safeCheckedKeys, flattenedData, onCheck, setCurrentCheckedKeys]
  );

  // 渲染单个节点
  const renderTreeNode = (node: TreeNodeData, level: number = 0) => {
    // 使用辅助函数检查子节点
    const hasChildren = !isEmptyArray(node.children);
    const isExpanded = expandedKeysSet.has(node.key);
    const isSelected = safeSelectedKeys.includes(node.key);
    const isChecked = safeCheckedKeys.includes(node.key);
    const isDisabled = node.disabled;

    // 搜索高亮
    const isMatch =
      searchable &&
      searchValue &&
      String(node.title).toLowerCase().includes(searchValue.toLowerCase());

    // 计算缩进
    const indentWidth = level * 20;

    return (
      <div key={node.key} className="select-none">
        {/* 节点行 */}
        <div
          className={`
            flex items-center py-1.5 pr-2 rounded-lg
            transition-all duration-200
            ${isSelected ? "bg-subtle" : "hover:bg-subtle"}
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${isMatch ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}
          `}
          style={{ paddingLeft: `${16 + indentWidth}px` }}
          onClick={() => !isDisabled && handleSelect(node, !isSelected)}
          onDoubleClick={() => !isDisabled && onDoubleClick?.(node)}
          draggable={draggable && !isDisabled}
        >
          {/* 展开/收起图标 */}
          <span
            className={`
              flex-shrink-0 w-5 h-5 flex items-center justify-center rounded
              ${hasChildren ? "hover:bg-edge" : ""}
              ${hasChildren ? "cursor-pointer" : ""}
            `}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                handleExpand(node, !isExpanded);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                node.switcherIcon || <BiChevronDown size={18} className="text-muted" />
              ) : (
                node.switcherIcon || <BiChevronRight size={18} className="text-muted" />
              )
            ) : showLine ? (
              <span className="w-4 border-t border-edge" />
            ) : (
              <span className="w-4" />
            )}
          </span>

          {/* 复选框 */}
          {checkable && (
            <span className="flex-shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(e) => handleCheck(node, e.target.checked)}
                className="w-4 h-4 rounded border-edge text-accent focus:ring-accent cursor-pointer align-middle"
              />
            </span>
          )}

          {/* 图标 */}
          {showIcon && (
            <span className="flex-shrink-0 mr-2 text-muted">
              {iconRender
                ? iconRender(node)
                : node.icon || (hasChildren && isExpanded ? (
                    <BiFolderOpen size={18} />
                  ) : hasChildren ? (
                    <BiFolder size={18} />
                  ) : (
                    <BiFile size={18} />
                  ))}
            </span>
          )}

          {/* 标题 */}
          <span
            className={`
              flex-1 text-sm truncate
              ${isSelected ? "text-accent font-medium" : "text-secondary"}
            `}
          >
            {titleRender ? titleRender(node) : node.title}
          </span>
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className={showLine ? "border-l border-edge ml-[25px]" : ""}>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`overflow-auto ${className}`}>
      {treeData.map((node) => renderTreeNode(node))}
    </div>
  );
};

// ==================== DirectoryTree 目录树 ====================

export interface DirectoryTreeProps extends Omit<TreeProps, "showIcon"> {
  /** 默认展开所有文件夹 */
  defaultExpandAll?: boolean;
}

export const DirectoryTree: React.FC<DirectoryTreeProps> = (props) => {
  return <Tree {...props} showIcon defaultExpandAll={props.defaultExpandAll} />;
};

export default Tree;

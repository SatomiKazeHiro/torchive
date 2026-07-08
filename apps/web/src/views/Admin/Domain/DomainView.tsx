import { useState, useCallback } from "react";
import { BiSearch } from "react-icons/bi";
import { Input, Table } from "@/components";
import type { Domain } from "@/types/db-instance";

import { useDomain, useDomainColumns } from "./hooks";
import { DomainFormModal } from "./components";
import { AdminPageHeader, AdminEmptyState } from "../components";
import { useTableSearch } from "../hooks/useTableSearch";
import { adminStyles } from "../styles";
import type { DomainFormData, DomainPageTemplate } from "./types";

/**
 * 主题管理页面
 *
 * 仅用于展示和编辑主题配置，不涉及数据实体的增删操作
 */
function DomainView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  const { domains, loading, handleUpdate, toggleState } = useDomain();

  const { keyword: searchKeyword, setKeyword: setSearchKeyword, filtered: filteredDomains } =
    useTableSearch(domains, (d) => [d.domain, d.name]);

  const handleOpenEdit = useCallback((domain: Domain) => {
    setEditingDomain(domain);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingDomain(null);
  }, []);

  const handleSubmit = useCallback(
    async (formData: DomainFormData) => {
      if (editingDomain) {
        await handleUpdate(editingDomain.domain, formData);
      }
    },
    [editingDomain, handleUpdate],
  );

  const columns = useDomainColumns({
    onEdit: handleOpenEdit,
    onToggleState: toggleState,
  });

  return (
    <div id="admin-domain" className={adminStyles.page}>
      <div className={adminStyles.pageInner}>
        <AdminPageHeader
          title="主题管理"
          description="查看和编辑系统主题配置，可修改主题名称、页面模板和展示状态。修改会直接影响前台展示。"
        />

        {/* 搜索与工具栏 */}
        <section className={adminStyles.toolbar}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-rich-black dark:text-zinc-300">
                全部主题
              </span>
              <span className={adminStyles.countBadge}>{domains.length}</span>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="搜索主题 ID 或名称..."
                value={searchKeyword}
                onChange={(value) => setSearchKeyword(value)}
                prefixIcon={<BiSearch className="text-midtone-gray" />}
                className="w-full"
                allowClear
              />
            </div>
          </div>
        </section>

        {/* 数据表格区域 */}
        <section>
          <Table
            columns={columns}
            dataSource={filteredDomains}
            rowKey="domain"
            loading={loading}
            size="md"
            className={adminStyles.table}
            emptyText={
              <AdminEmptyState title="暂无匹配主题" hint="尝试调整搜索关键词" />
            }
          />
        </section>
      </div>

      {/* 编辑弹窗 */}
      <DomainFormModal
        isOpen={isModalOpen}
        mode="edit"
        initialData={
          editingDomain
            ? {
                domain: editingDomain.domain,
                name: editingDomain.name,
                page_template: (editingDomain.page_template as DomainPageTemplate) || "",
                state: editingDomain.state,
              }
            : undefined
        }
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default DomainView;

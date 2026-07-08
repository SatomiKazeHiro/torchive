import { useState, useMemo, useCallback, useEffect } from "react";
import { BiSearch, BiFilter } from "react-icons/bi";
import { Input, Table, Select, Pagination } from "@/components";

import { useCategories, useCategoryColumns } from "./hooks";
import { CategoryFormModal } from "./components";
import { AdminPageHeader, AdminEmptyState } from "../components";
import { useTableSearch } from "../hooks/useTableSearch";
import { adminStyles } from "../styles";
import type { CategoryFormData, CategoryWithCount } from "./types";

function CategoryView() {
  const [selectedDomain, setSelectedDomain] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);

  const {
    categories,
    domains,
    loading,
    currentPage,
    pageSize,
    total,
    handlePageChange,
    updateCategory,
    toggleState,
    setCurrentPage,
    refresh,
  } = useCategories();

  // 主题筛选
  const domainFilteredCategories = useMemo(() => {
    if (!selectedDomain) return categories;
    return categories.filter((c) => c.domain === selectedDomain);
  }, [categories, selectedDomain]);

  // 关键词搜索
  const {
    keyword: searchKeyword,
    setKeyword: setSearchKeyword,
    filtered: keywordFilteredCategories,
  } = useTableSearch(domainFilteredCategories, (c) => [c.name, c.category, c.hash_id]);

  const filteredCategories = keywordFilteredCategories;

  // 筛选/搜索变化时回到第 1 页并重新拉取，避免分页与筛选不同步
  useEffect(() => {
    setCurrentPage(1);
    refresh(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain, searchKeyword]);

  const paginatedCategories = useMemo(() => {
    if (selectedDomain || searchKeyword.trim()) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return filteredCategories.slice(start, end);
    }
    return categories;
  }, [filteredCategories, categories, currentPage, pageSize, selectedDomain, searchKeyword]);

  const displayTotal = useMemo(() => {
    if (selectedDomain || searchKeyword.trim()) {
      return filteredCategories.length;
    }
    return total;
  }, [filteredCategories.length, total, selectedDomain, searchKeyword]);

  const domainOptions = useMemo(
    () => [
      { value: "", label: "全部主题" },
      ...domains.map((d) => ({ value: d.domain, label: d.name })),
    ],
    [domains],
  );

  const handleOpenEdit = useCallback((category: CategoryWithCount) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  const handleSubmit = useCallback(
    async (formData: CategoryFormData) => {
      if (editingCategory) {
        await updateCategory(editingCategory.hash_id, {
          name: formData.name,
          page_template: formData.page_template,
          work_page_template: formData.work_page_template,
          state: formData.state,
        });
      }
    },
    [editingCategory, updateCategory],
  );

  const columns = useCategoryColumns({
    domains,
    onEdit: handleOpenEdit,
    onToggleState: toggleState,
  });

  return (
    <div id="admin-category" className={adminStyles.page}>
      <div className={adminStyles.pageInner}>
        <AdminPageHeader
          title="分类管理"
          description="查看和编辑各主题下的分类配置，可修改分类名称、页面模板和展示状态。"
        />

        {/* 筛选与搜索工具栏 */}
        <section className={adminStyles.toolbar}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className={adminStyles.filterIcon}>
                  <BiFilter className="text-base" />
                </div>
                <span className="text-sm font-medium text-rich-black dark:text-zinc-300">主题</span>
              </div>
              <div className="w-full sm:w-44">
                <Select
                  options={domainOptions}
                  value={selectedDomain}
                  onChange={setSelectedDomain}
                  placeholder="全部主题"
                />
              </div>
              <span className={adminStyles.countBadge}>共 {displayTotal} 个分类</span>
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="搜索分类名称或标识..."
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
            dataSource={paginatedCategories}
            rowKey="hash_id"
            loading={loading}
            size="md"
            className={adminStyles.table}
            emptyText={
              <AdminEmptyState title="暂无匹配分类" hint="尝试调整筛选条件或搜索关键词" />
            }
          />

          {displayTotal > 0 && (
            <div className="mt-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={displayTotal}
                onChange={handlePageChange}
                showTotal={true}
              />
            </div>
          )}
        </section>
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        mode="edit"
        initialData={editingCategory || undefined}
        domains={domains}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default CategoryView;

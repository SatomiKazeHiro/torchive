import { useState, useCallback } from "react";
import { BiSearch, BiFilter, BiReset } from "react-icons/bi";
import { debounce } from "es-toolkit";
import { Select, Input, Table, Button, Pagination } from "@/components";
import { useMedia, useMediaColumns } from "./hooks";
import { MediaFormModal } from "./components";
import { AdminPageHeader, AdminEmptyState } from "../components";
import { adminStyles } from "../styles";
import type { FilterState, MediaFormData } from "./types";
import { STATE_OPTIONS } from "./types";

function MediaView() {
  const [filters, setFilters] = useState<FilterState>({
    domain: "",
    category: "",
    state: "",
    keyword: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const {
    works,
    total,
    loading,
    domainOptions,
    categoryOptions,
    getDomainName,
    getCategoryName,
    refresh,
  } = useMedia(filters, currentPage, pageSize);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);

  const handleOpenEdit = useCallback((work: Work) => {
    setEditingWork(work);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingWork(null);
  }, []);

  const handleSearchChange = debounce((value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
    setCurrentPage(1);
  }, 300);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "domain" ? { category: "" } : {}),
    }));
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      domain: "",
      category: "",
      state: "",
      keyword: "",
    });
    setCurrentPage(1);
  }, []);

  const columns = useMediaColumns({
    getDomainName,
    getCategoryName,
    onEdit: handleOpenEdit,
    onRefresh: refresh,
  });

  const editFormData: Partial<MediaFormData> | undefined = editingWork
    ? {
        hash_id: editingWork.hash_id,
        domain: editingWork.domain,
        category: editingWork.category,
        work: editingWork.work,
        state: editingWork.state,
        title: editingWork.detail?.title || "",
        intro: editingWork.detail?.intro || "",
      }
    : undefined;

  const MediaTable = Table<Work>;

  return (
    <div id="admin-media" className={adminStyles.page}>
      <div className={adminStyles.pageInner}>
        <AdminPageHeader
          title="媒体管理"
          description="查看和编辑媒体资源信息，可修改标题、简介和发布状态。"
        />

        {/* 筛选与操作区域 */}
        <section className={adminStyles.toolbar}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-rich-black dark:text-zinc-300">
                <div className={adminStyles.filterIcon}>
                  <BiFilter className="text-base" />
                </div>
                <span className="hidden sm:inline">筛选</span>
              </div>

              <div className="min-w-[140px]">
                <Select
                  options={domainOptions}
                  value={filters.domain}
                  onChange={(value) => handleFilterChange("domain", value)}
                  placeholder="全部主题"
                  className="w-full"
                />
              </div>

              <div className="min-w-[140px]">
                <Select
                  options={categoryOptions}
                  value={filters.category}
                  onChange={(value) => handleFilterChange("category", value)}
                  placeholder="全部分类"
                  disabled={!filters.domain}
                  className="w-full"
                />
              </div>

              <div className="min-w-[120px]">
                <Select
                  options={STATE_OPTIONS}
                  value={filters.state}
                  onChange={(value) => handleFilterChange("state", value)}
                  placeholder="全部状态"
                  className="w-full"
                />
              </div>

              {(filters.domain || filters.category || filters.state || filters.keyword) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="rounded-[9999px] text-midtone-gray hover:bg-ghost-gray hover:text-deep-black dark:text-zinc-400 dark:hover:bg-zinc-800"
                  icon={<BiReset />}
                >
                  重置
                </Button>
              )}
            </div>

            <div className="w-full lg:w-72">
              <Input
                placeholder="搜索标题、ID..."
                defaultValue={filters.keyword}
                onChange={handleSearchChange}
                prefixIcon={<BiSearch className="text-midtone-gray" />}
                className="w-full"
                allowClear
              />
            </div>
          </div>
        </section>

        {/* 数据表格区域 */}
        <section>
          <MediaTable
            columns={columns}
            dataSource={works}
            loading={loading}
            rowKey="hash_id"
            size="md"
            className={adminStyles.table}
            emptyText={
              <AdminEmptyState
                title="暂无匹配数据"
                hint="尝试调整筛选条件或搜索关键词"
                action={
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    清除所有筛选
                  </Button>
                }
              />
            }
          />

          {total > 0 && (
            <div className="mt-4">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(page) => setCurrentPage(page)}
                showTotal={true}
              />
            </div>
          )}
        </section>
      </div>

      <MediaFormModal
        isOpen={isEditModalOpen}
        mode="edit"
        initialData={editFormData}
        domainOptions={domainOptions}
        onClose={handleCloseEdit}
        onSuccess={refresh}
      />
    </div>
  );
}

export default MediaView;

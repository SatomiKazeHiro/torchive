import { useState, useEffect } from "react";
import { Modal, Input, Select, Switch, Form, FormItem } from "@/components";
import type { CategoryFormData, ModalMode, CategoryWithCount } from "../types";
import { PAGE_TEMPLATE_OPTIONS, WORK_PAGE_TEMPLATE_OPTIONS } from "@/constants/option";

interface CategoryFormModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialData?: Partial<CategoryWithCount>;
  domains: Domain[];
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

const defaultFormData: CategoryFormData = {
  hash_id: "",
  domain: "",
  category: "",
  name: "",
  page_template: "",
  work_page_template: "",
  state: 1,
};

export function CategoryFormModal({
  isOpen,
  mode,
  initialData,
  domains,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = mode === "edit";

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultFormData,
          ...initialData,
          page_template: (initialData.page_template || "") as CategoryFormData["page_template"],
          work_page_template: (initialData.work_page_template || "") as CategoryFormData["work_page_template"],
          domain: initialData.domain || domains[0]?.domain || "",
        });
      } else {
        setFormData({
          ...defaultFormData,
          domain: domains[0]?.domain || "",
        });
      }
    }
  }, [isOpen, initialData, domains]);

  const handleSubmit = async () => {
    if (!formData.domain || !formData.category || !formData.name) {
      return;
    }

    setSubmitting(true);
    try {
      // 空值转为 undefined（后端会用默认值）
      const submitData: CategoryFormData = {
        ...formData,
        page_template: formData.page_template || "",
        work_page_template: formData.work_page_template || "",
      };

      if (!isEditMode) {
        // 新增模式 - 生成 hash_id
        submitData.hash_id = `${formData.domain}_${formData.category}`;
      }
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("保存分类失败:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title={isEditMode ? "编辑分类" : "新增分类"}
      type={isEditMode ? "info" : "success"}
      width="md"
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={submitting}
      okText="保存"
      className="rounded-[14px] border-subtle-ash shadow-[0_0_0_1px_oklab(0.145_-0.00000143796_0.00000340492_/_0.1)] dark:border-zinc-800"
      contentClassName="text-midtone-gray dark:text-zinc-300"
    >
      <Form layout="vertical" className="mt-2">
        {/* 所属主题 */}
        {/* <FormItem label="所属主题" required>
          <Select
            options={domainOptions}
            value={formData.domain}
            onChange={(value) => setFormData({ ...formData, domain: value })}
            disabled={isEditMode}
            placeholder="请选择主题"
          />
        </FormItem> */}

        {/* 分类标识 */}
        <FormItem label="分类标识" required>
          <Input
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            disabled={isEditMode}
            placeholder="如: series"
            className={isEditMode ? "bg-ghost-gray dark:bg-zinc-800/50" : ""}
          />
          <p className="mt-1.5 text-xs text-midtone-gray dark:text-zinc-400">
            创建后不可修改，格式如：series, movie, ova
          </p>
        </FormItem>

        {/* 显示名称 */}
        <FormItem label="显示名称" required>
          <Input
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="如: 番剧"
          />
        </FormItem>

        {/* 页面模板 */}
        <FormItem label="页面模板">
          <Select
            options={PAGE_TEMPLATE_OPTIONS}
            value={formData.page_template}
            onChange={(value) => setFormData({ ...formData, page_template: value })}
            allowClear
            placeholder="默认使用「网格卡片」展示"
          />
        </FormItem>

        {/* 作品页面模板 */}
        <FormItem label="作品页面模板">
          <Select
            options={WORK_PAGE_TEMPLATE_OPTIONS}
            value={formData.work_page_template}
            onChange={(value) => setFormData({ ...formData, work_page_template: value })}
            allowClear
            placeholder="默认使用「混合」展示"
          />
        </FormItem>

        {/* 状态 */}
        <FormItem label="状态">
          <Switch
            checked={formData.state === 1}
            onChange={(checked) => setFormData({ ...formData, state: checked ? 1 : 0 })}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </FormItem>
      </Form>
    </Modal>
  );
}

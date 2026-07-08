import { useState, useEffect, useMemo } from "react";
import { debounce } from "es-toolkit";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button } from "@/components";
import { updateWork, getCategoriesPage } from "@/api/web";
import type { MediaFormData, ModalMode } from "../types";
import { EDIT_STATE_OPTIONS } from "../types";

interface MediaFormModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialData?: Partial<MediaFormData>;
  domainOptions: { value: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

const defaultFormData: MediaFormData = {
  hash_id: "",
  domain: "",
  category: "",
  work: "",
  state: 1,
  title: "",
  intro: "",
};

export function MediaFormModal({
  isOpen,
  mode,
  initialData,
  domainOptions,
  onClose,
  onSuccess,
}: MediaFormModalProps) {
  const [formData, setFormData] = useState<MediaFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditMode = mode === "edit";

  // 加载分类列表
  const loadCategories = async (domain: string) => {
    if (!domain) {
      setCategories([]);
      return;
    }
    try {
      const res = await getCategoriesPage({
        limit: 100,
        domain,
      });
      setCategories(res.data);
    } catch {
      setCategories([]);
    }
  };

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultFormData,
          ...initialData,
        });
        loadCategories(initialData.domain || "");
      } else {
        setFormData(defaultFormData);
        setCategories([]);
      }
    }
  }, [isOpen, initialData]);

  // 分类选项
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "请选择分类" },
      ...categories.map((c) => ({ value: c.category, label: c.name })),
    ],
    [categories],
  );

  // 保存（当前后端 updateWork 仅支持 state 字段，其他字段仅展示用）
  const handleSave = debounce(
    async () => {
      setIsSubmitting(true);
      const toastId = toast.loading("保存中...");

      try {
        await updateWork(formData.hash_id, {
          state: formData.state,
        });

        toast.success("保存成功", { id: toastId });
        onClose();
        onSuccess();
      } catch (err) {
        console.error("保存失败:", err);
        toast.error("保存失败", { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
    },
    300,
    { edges: ["leading"] },
  );

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      title={isEditMode ? "编辑媒体" : "新增媒体"}
      type="info"
      width="md"
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={isSubmitting}
      okText="保存"
      className="rounded-[14px] border-subtle-ash shadow-[0_0_0_1px_oklab(0.145_-0.00000143796_0.00000340492_/_0.1)] dark:border-zinc-800"
      contentClassName="text-midtone-gray dark:text-zinc-300"
      footer={
        <div className="flex justify-end">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSave} loading={isSubmitting}>
              保存
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 顶部说明：当前仅状态可编辑，其余字段为展示用 */}
        <div className="rounded-[10px] border border-subtle-ash bg-ghost-gray px-3 py-2 text-xs text-midtone-gray dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
          当前仅「状态」可修改，其他字段需要到详情页调整
        </div>

        {/* 媒体 ID（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            媒体 ID
          </label>
          <Input value={formData.hash_id} disabled />
        </div>

        {/* 作品名称（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            作品名称
          </label>
          <Input
            value={formData.work}
            disabled
            placeholder="请输入作品名称"
          />
        </div>

        {/* 显示标题（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            显示标题
          </label>
          <Input
            value={formData.title}
            disabled
            placeholder="请输入显示标题"
          />
        </div>

        {/* 所属主题（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            所属主题
          </label>
          <Select
            options={domainOptions.filter((d) => d.value !== "")}
            value={formData.domain}
            disabled
            placeholder="请选择主题"
          />
        </div>

        {/* 所属分类（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            所属分类
          </label>
          <Select
            options={categoryOptions}
            value={formData.category}
            disabled
            placeholder="请选择分类"
          />
        </div>

        {/* 状态（可编辑） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            状态 <span className="text-callout-red">*</span>
          </label>
          <Select
            options={EDIT_STATE_OPTIONS}
            value={String(formData.state)}
            onChange={(value) => setFormData({ ...formData, state: Number(value) })}
            placeholder="请选择状态"
          />
        </div>

        {/* 简介（只读） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-rich-black dark:text-zinc-300">
            简介
          </label>
          <textarea
            value={formData.intro}
            disabled
            rows={3}
            className="w-full resize-none rounded-[10px] border border-subtle-ash bg-ghost-gray px-3 py-2 text-midtone-gray transition-all placeholder:text-midtone-gray/70 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400"
            placeholder="请输入简介"
          />
        </div>
      </div>
    </Modal>
  );
}

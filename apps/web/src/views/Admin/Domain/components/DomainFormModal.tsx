import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Modal, Input, Select, Switch, Form, FormItem } from "@/components";
import type { DomainFormData, DomainPageTemplate } from "../types";
import { DOMAIN_PAGE_TEMPLATES } from "../types";

/**
 * 保留字：与 App.tsx 顶级路由同名，避免在路由层 (`/:domain`) shadow 保留路由。
 * 当前 modal 只在 edit 模式被打开，create 流程未接通；本校验为前向兼容。
 */
const RESERVED_DOMAINS = new Set(["user", "admin", "components", "play", "index"]);

interface DomainFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: Partial<DomainFormData>;
  onClose: () => void;
  onSubmit: (data: DomainFormData) => Promise<void>;
}

const DEFAULT_FORM_DATA: DomainFormData = {
  domain: "",
  name: "",
  page_template: "",
  state: 1,
};

export function DomainFormModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
}: DomainFormModalProps) {
  const [formData, setFormData] = useState<DomainFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          domain: initialData.domain || "",
          name: initialData.name || "",
          page_template: initialData.page_template || "",
          state: initialData.state ?? 1,
        });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    }
  }, [isOpen, mode, initialData]);

  // 表单验证规则
  const formRules = useMemo(
    () => ({
      domain: [{ required: true, message: "请输入主题 ID" }],
      name: [{ required: true, message: "请输入主题名称" }],
    }),
    [],
  );

  const handleSubmit = async () => {
    if (!formData.domain.trim()) {
      toast.error("请输入主题 ID");
      return;
    }
    if (RESERVED_DOMAINS.has(formData.domain.toLowerCase())) {
      toast.error("保留字，不能作为主题 ID");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("请输入主题名称");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(mode === "edit" ? "保存中..." : "创建中...");

    try {
      await onSubmit(formData);
      toast.success(mode === "edit" ? "主题更新成功" : "主题创建成功", { id: toastId });
      onClose();
    } catch (err: unknown) {
      console.error("保存失败:", err);
      const errorMessage = err instanceof Error ? err.message : "保存失败";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      title={mode === "edit" ? "编辑主题" : "新增主题"}
      type={mode === "edit" ? "info" : "success"}
      width="md"
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText="保存"
      className="rounded-[14px] border-subtle-ash shadow-[0_0_0_1px_oklab(0.145_-0.00000143796_0.00000340492_/_0.1)] dark:border-zinc-800"
      contentClassName="text-midtone-gray dark:text-zinc-300"
    >
      <Form layout="vertical" className="mt-2">
        {/* 主题 ID */}
        <FormItem label="主题 ID" required rules={formRules.domain}>
          <Input
            value={formData.domain}
            onChange={(value) => setFormData({ ...formData, domain: value })}
            disabled={mode === "edit" || isSubmitting}
            placeholder="如: anime"
            className={mode === "edit" ? "bg-ghost-gray dark:bg-zinc-800/50" : ""}
          />
          <p className="mt-1.5 text-xs text-midtone-gray dark:text-zinc-400">
            唯一标识，创建后不可修改
          </p>
        </FormItem>

        {/* 主题名称 */}
        <FormItem label="主题名称" required rules={formRules.name}>
          <Input
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            disabled={isSubmitting}
            placeholder="如: 动画"
          />
        </FormItem>

        {/* 页面模板 */}
        <FormItem label="页面模板">
          <Select
            options={DOMAIN_PAGE_TEMPLATES}
            value={formData.page_template}
            onChange={(value) =>
              setFormData({ ...formData, page_template: value as DomainPageTemplate })
            }
            allowClear
            placeholder="默认（网格卡片）"
          />
        </FormItem>

        {/* 状态 */}
        <FormItem label="状态">
          <Switch
            checked={formData.state === 1}
            onChange={(checked) => setFormData({ ...formData, state: checked ? 1 : 0 })}
            disabled={isSubmitting}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </FormItem>
      </Form>
    </Modal>
  );
}

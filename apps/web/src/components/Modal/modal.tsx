import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import Modal from "./index";
import type { ModalProps, ModalType } from "./index";

export interface ModalOptions extends Omit<ModalProps, "open" | "children"> {
  content?: ReactNode;
  duration?: number; // 仅对非交互式弹窗有效，这里暂不实现自动关闭，通常用 Toast
}

// 容器管理
const createModalContainer = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  return container;
};

function createImperativeModal(
  options: ModalOptions & { content?: ReactNode },
  defaultType: ModalType = "info",
) {
  const container = createModalContainer();
  const root = createRoot(container);
  let currentConfig = { ...options, open: true, type: options.type || defaultType };

  const destroy = () => {
    render({ open: false });
    setTimeout(() => {
      root.unmount();
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }, 300);
  };

  const handleOk = async () => {
    try {
      if (options.onOk) {
        await options.onOk();
      }
      destroy();
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleCancel = () => {
    options.onCancel?.();
    destroy();
  };

  function render(props: Partial<ModalProps>) {
    root.render(
      <Modal {...currentConfig} {...props} onOk={handleOk} onCancel={handleCancel}>
        {options.content}
      </Modal>,
    );
  }

  render({});

  return {
    destroy,
    update: (newOptions: Partial<ModalOptions>) => {
      currentConfig = { ...currentConfig, ...newOptions };
      render({});
    },
  };
}

// 命令式 API
export const confirm = (options: ModalOptions) =>
  createImperativeModal({ ...options, type: "confirm" }, "confirm");

export const info = (options: ModalOptions) =>
  createImperativeModal({ ...options, showCancel: false }, "info");

export const success = (options: ModalOptions) =>
  createImperativeModal({ ...options, showCancel: false }, "success");

export const warning = (options: ModalOptions) =>
  createImperativeModal({ ...options, showCancel: false }, "warning");

export const error = (options: ModalOptions) =>
  createImperativeModal({ ...options, showCancel: false }, "error");
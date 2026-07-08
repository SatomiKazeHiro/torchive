import { createRoot } from "react-dom/client";
import Drawer from "./index";
import type { DrawerProps } from "./index";

export interface DrawerOptions extends Omit<DrawerProps, "open" | "children"> {
  content?: React.ReactNode;
}

function createImperativeDrawer(options: DrawerOptions) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const destroy = () => {
    render({ open: false });
    setTimeout(() => {
      root.unmount();
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }, 300);
  };

  function render(props: Partial<DrawerProps>) {
    root.render(
      <Drawer
        {...options}
        {...props}
        onClose={() => {
          options.onClose?.();
          destroy();
        }}
      >
        {options.content}
      </Drawer>
    );
  }

  render({ open: true });

  return {
    destroy,
    update: (newOptions: Partial<DrawerOptions>) => {
      render({ ...options, ...newOptions, open: true });
    },
  };
}

export const drawer = {
  open: (options: DrawerOptions) => createImperativeDrawer(options),
};
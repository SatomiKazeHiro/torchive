import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  trigger?: "hover" | "click";
  duration?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
  className = "",
  trigger = "hover",
  duration,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    // Simple positioning logic (can be improved with floating-ui)
    switch (position) {
      case "top":
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
    }

    setCoords({ top, left });
  };

  const show = () => {
    updatePosition();
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    if (trigger !== "hover") return;
    // Clear any existing timeout to avoid flickering
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      show();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hide();
    } else if (trigger === "click" && isVisible) {
      hide();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (trigger !== "click") return;
    e.stopPropagation();

    if (isVisible) {
      hide();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      show();
      if (duration) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(hide, duration);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  interface TriggerChildProps {
  ref?: React.Ref<HTMLElement>;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: unknown;
}
const childProps = children.props as TriggerChildProps;

  // Use cloneElement to attach ref and events
  const triggerEl = React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      // Keep existing ref if present
      triggerRef.current = node;
      const { ref } = childProps;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleMouseEnter();
      childProps.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleMouseLeave();
      childProps.onMouseLeave?.(e);
    },
    onClick: (e: React.MouseEvent) => {
      handleClick(e);
      childProps.onClick?.(e);
    },
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <>
      {triggerEl}
      {isVisible &&
        createPortal(
          <div
            className={`fixed z-[9999] pointer-events-none whitespace-nowrap rounded bg-accent px-2 py-1 text-xs text-on-accent shadow-md ${className}`}
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                position === "top"
                  ? "translate(-50%, -100%)"
                  : position === "bottom"
                  ? "translate(-50%, 0)"
                  : position === "left"
                  ? "translate(-100%, -50%)"
                  : "translate(0, -50%)",
            }}
          >
            {content}
            {/* Arrow */}
            <div
              className={`absolute h-2 w-2 rotate-45 bg-accent ${
                position === "top"
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                  : position === "bottom"
                  ? "top-[-4px] left-1/2 -translate-x-1/2"
                  : position === "left"
                  ? "right-[-4px] top-1/2 -translate-y-1/2"
                  : "left-[-4px] top-1/2 -translate-y-1/2"
              }`}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

export default Tooltip;

"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown, ArrowUp, ChevronFirst, ChevronLast, Clipboard,
  Copy, Lock, LockOpen, Scissors, SquareStack, Trash2,
} from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";

interface ContextMenuProps {
  x: number;
  y: number;
  componentId: string;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  danger?: boolean;
  dividerAfter?: boolean;
}

export default function ContextMenu({ x, y, componentId, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const deleteComponent = useBuilderStore((s) => s.deleteComponent);
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const copyComponents = useBuilderStore((s) => s.copyComponents);
  const pasteComponents = useBuilderStore((s) => s.pasteComponents);
  const moveLayer = useBuilderStore((s) => s.moveLayer);
  const toggleLock = useBuilderStore((s) => s.toggleLock);
  const selectComponent = useBuilderStore((s) => s.selectComponent);
  const components = useBuilderStore((s) => s.components);
  const clipboard = useBuilderStore((s) => s.clipboard);

  // Find if component is locked
  const findById = useCallback(
    (id: string): { locked?: boolean } | null => {
      const search = (arr: typeof components): typeof components[number] | null => {
        for (const c of arr) {
          if (c.id === id) return c;
          const found = search(c.children);
          if (found) return found;
        }
        return null;
      };
      return search(components);
    },
    [components],
  );

  const comp = findById(componentId);
  const isLocked = comp?.locked ?? false;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const items: MenuItem[] = [
    {
      label: "Cut",
      icon: Scissors,
      shortcut: "Ctrl+X",
      action: () => {
        selectComponent(componentId);
        copyComponents();
        deleteComponent(componentId);
        onClose();
      },
    },
    {
      label: "Copy",
      icon: Copy,
      shortcut: "Ctrl+C",
      action: () => {
        selectComponent(componentId);
        copyComponents();
        onClose();
      },
    },
    {
      label: "Paste",
      icon: Clipboard,
      shortcut: "Ctrl+V",
      action: () => {
        pasteComponents();
        onClose();
      },
    },
    {
      label: "Duplicate",
      icon: SquareStack,
      shortcut: "Ctrl+D",
      action: () => {
        duplicateComponent(componentId);
        onClose();
      },
      dividerAfter: true,
    },
    {
      label: "Bring to Front",
      icon: ChevronFirst,
      action: () => { moveLayer(componentId, "front"); onClose(); },
    },
    {
      label: "Bring Forward",
      icon: ArrowUp,
      action: () => { moveLayer(componentId, "forward"); onClose(); },
    },
    {
      label: "Send Backward",
      icon: ArrowDown,
      action: () => { moveLayer(componentId, "backward"); onClose(); },
    },
    {
      label: "Send to Back",
      icon: ChevronLast,
      action: () => { moveLayer(componentId, "back"); onClose(); },
      dividerAfter: true,
    },
    {
      label: isLocked ? "Unlock" : "Lock",
      icon: isLocked ? LockOpen : Lock,
      action: () => { toggleLock(componentId); onClose(); },
      dividerAfter: true,
    },
    {
      label: "Delete",
      icon: Trash2,
      shortcut: "Del",
      danger: true,
      action: () => {
        deleteComponent(componentId);
        onClose();
      },
    },
  ];

  // Ensure menu stays within viewport
  const adjustedX = typeof window !== "undefined" ? Math.min(x, window.innerWidth - 240) : x;
  const adjustedY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - 400) : y;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed z-[100] min-w-[200px] overflow-hidden rounded-xl border border-[#1A315E] bg-[#0B1D40] py-1.5 shadow-[0_16px_48px_rgba(11,29,64,0.5)]"
        style={{ left: adjustedX, top: adjustedY }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item, i) => {
          const Icon = item.icon;
          const disabled = item.label === "Paste" && !clipboard;
          return (
            <div key={item.label}>
              <button
                type="button"
                disabled={disabled}
                onClick={item.action}
                className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-[12px] font-semibold transition-colors ${
                  disabled
                    ? "cursor-not-allowed text-gray-600"
                    : item.danger
                      ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-4 text-[10px] font-medium text-gray-500">
                    {item.shortcut}
                  </span>
                )}
              </button>
              {item.dividerAfter && (
                <div className="mx-3 my-1 h-px bg-white/10" />
              )}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

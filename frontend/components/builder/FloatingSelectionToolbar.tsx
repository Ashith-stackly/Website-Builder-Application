"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Trash2,
  ClipboardCopy,
  ChevronUp,
  ChevronDown,
  BringToFront,
  SendToBack,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";
import { useBuilderStore } from "@/store/builderStore";
import type { BuilderComponent } from "@/types/builder";

/**
 * Framer/Webflow-style floating context toolbar for the selected block.
 * Every action calls an EXISTING builderStore action — no logic added.
 * Rendered inside the Canvas over the selected element wrapper.
 */

interface Props {
  component: BuilderComponent;
  /** Optional extra actions surfaced from the canvas (e.g. "Edit inline"). */
  className?: string;
}

const spring = { type: "spring" as const, stiffness: 460, damping: 30 };

export default function FloatingSelectionToolbar({ component, className = "" }: Props) {
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const deleteComponent = useBuilderStore((s) => s.deleteComponent);
  const copyComponents = useBuilderStore((s) => s.copyComponents);
  const moveComponentUp = useBuilderStore((s) => s.moveComponentUp);
  const moveComponentDown = useBuilderStore((s) => s.moveComponentDown);
  const moveLayer = useBuilderStore((s) => s.moveLayer);
  const toggleLock = useBuilderStore((s) => s.toggleLock);
  const hideComponent = useBuilderStore((s) => s.hideComponent);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const locked = Boolean(component.locked);
  const hidden = Boolean(component.hidden);

  const id = component.id;

  const primary = [
    { icon: ChevronUp, label: "Move up", onClick: () => moveComponentUp(id) },
    { icon: ChevronDown, label: "Move down", onClick: () => moveComponentDown(id) },
    { divider: true },
    { icon: Copy, label: "Duplicate", onClick: () => duplicateComponent(id) },
    { icon: ClipboardCopy, label: "Copy", onClick: () => copyComponents() },
    { divider: true },
    { icon: locked ? Unlock : Lock, label: locked ? "Unlock" : "Lock", onClick: () => toggleLock(id), active: locked },
    { icon: hidden ? EyeOff : Eye, label: hidden ? "Show" : "Hide", onClick: () => hideComponent(id), active: hidden },
  ] as const;

  const overflow = [
    { icon: BringToFront, label: "Bring to front", onClick: () => moveLayer(id, "front") },
    { icon: SendToBack, label: "Send to back", onClick: () => moveLayer(id, "back") },
    { icon: ChevronUp, label: "Bring forward", onClick: () => moveLayer(id, "forward") },
    { icon: ChevronDown, label: "Send backward", onClick: () => moveLayer(id, "backward") },
  ] as const;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={spring}
      onClick={(e) => e.stopPropagation()}
      className={`pointer-events-auto flex items-center gap-0.5 rounded-xl border border-[#dbe3ef] bg-white/95 px-1 py-1 shadow-[0_12px_36px_rgba(15,35,75,0.20)] backdrop-blur ${className}`}
      role="toolbar"
      aria-label="Selected block actions"
    >
      {primary.map((item, i) =>
        "divider" in item ? (
          <span key={`d-${i}`} className="mx-0.5 h-5 w-px bg-[#e6ecf5]" />
        ) : (
          <ToolbarButton key={item.label} {...item} />
        ),
      )}

      <span className="mx-0.5 h-5 w-px bg-[#e6ecf5]" />

      {/* Layer-order overflow */}
      <div className="relative">
        <ToolbarButton
          icon={MoreVertical}
          label="Layer order"
          onClick={() => setOverflowOpen((v) => !v)}
          active={overflowOpen}
        />
        <AnimatePresence>
          {overflowOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-[#dbe3ef] bg-white p-1 shadow-[0_16px_44px_rgba(15,35,75,0.2)]"
            >
              {overflow.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => { o.onClick(); setOverflowOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#0B1D40] transition-colors hover:bg-[#f4f7fc]"
                >
                  <o.icon className="h-4 w-4 text-[#566583]" /> {o.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span className="mx-0.5 h-5 w-px bg-[#e6ecf5]" />

      {/* Delete (destructive, always last) */}
      <ToolbarButton icon={Trash2} label="Delete" onClick={() => deleteComponent(id)} danger />
    </motion.div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        aria-label={label}
        className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
          danger
            ? "text-rose-500 hover:bg-rose-50"
            : active
              ? "bg-blue-50 text-blue-600"
              : "text-[#566583] hover:bg-[#f4f7fc] hover:text-[#0B1D40]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </motion.button>
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0B1D40] px-2 py-1 text-[10px] font-semibold text-white shadow-lg"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

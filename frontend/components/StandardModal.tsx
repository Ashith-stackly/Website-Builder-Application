"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
  badge?: ReactNode;
}

export default function StandardModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = "max-w-3xl",
  footer,
  badge,
}: StandardModalProps) {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    let container = document.getElementById("blockpages-modal-portal");
    if (!container) {
      container = document.createElement("div");
      container.id = "blockpages-modal-portal";
      document.body.appendChild(container);
    }
    setPortalContainer(container);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !portalContainer) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0B182B]/80 backdrop-blur-sm p-4 pt-[80px] animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative z-[100000]`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#F6F4EB]">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1D40] flex items-center gap-3">
            {badge ? (
              badge
            ) : icon ? (
              <span className="bg-[#517AA5] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm shrink-0">
                {icon}
              </span>
            ) : null}
            <span>{title}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close popup"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {children}
        </div>

        {footer && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, portalContainer);
}

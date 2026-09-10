"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";

interface BlockEditorBackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Shared "← Back to Canvas" button used across all block editor canvases
 * (Image, Button, Video, Divider, Icon) for consistent navigation.
 */
export default function BlockEditorBackButton({
  onClick,
  label = "Back to Canvas",
  className = "",
}: BlockEditorBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-[#0B1D40] shadow-sm transition-colors hover:bg-gray-50 cursor-pointer ${className}`}
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

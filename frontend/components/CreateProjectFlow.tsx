"use client";

import React, { useState, useRef } from "react";
import { FaPlay } from "react-icons/fa6";
import ProjectCreationWizard from "@/components/project/ProjectCreationWizard";

export default function CreateProjectFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      triggerRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0A2357] px-8 py-4 font-bold text-white shadow-xl transition hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2357]"
      >
        Get Started
        <span className="rounded-full bg-white p-1 text-[10px] text-[#0A2357]">
          <FaPlay />
        </span>
      </button>

      <ProjectCreationWizard isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
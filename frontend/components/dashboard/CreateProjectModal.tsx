"use client";

import React from "react";
import ProjectCreationWizard from "@/components/project/ProjectCreationWizard";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  return (
    <ProjectCreationWizard
      isOpen={isOpen}
      onClose={onClose}
      onProjectCreated={onProjectCreated}
    />
  );
}

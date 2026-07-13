"use client";

import dynamic from "next/dynamic";

const BuilderLayout = dynamic(() => import("@/components/builder/BuilderLayout"), {
  ssr: false,
});

export default function BuilderPage() {
  return <BuilderLayout />;
}

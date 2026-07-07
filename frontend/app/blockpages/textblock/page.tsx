"use client";
 
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import TextCanvas from "./Canvas";
import TextRightSidebar from "./RightSidebar";
import type { TextBlockState, TextTemplateType } from "./types";
 
const initialTextBlockState: TextBlockState = {
  selectedTarget: "main",
  isTextEditable: false,
  textStyles: {
    color: "",
    fontSize: "",
    fontFamily: "",
  },
  section: {
    alignment: "left",
    backgroundColor: "#f8fafc",
    headerBg: "#06224C",
    headerText: "#ffffff",
    footerBg: "#06224C",
    footerText: "#ffffff",
    shadow: false,
  },
};
 
export default function TextBlockPage() {
  const searchParams = useSearchParams();
  const template: TextTemplateType = searchParams.get("template") === "portfolio" ? "portfolio" : "ecommerce";
  const [textBlockState, setTextBlockState] = useState<TextBlockState>(initialTextBlockState);
  const [pastStates, setPastStates] = useState<TextBlockState[]>([]);
  const [futureStates, setFutureStates] = useState<TextBlockState[]>([]);
 
  const pushState = (nextState: TextBlockState) => {
    setPastStates((current) => [...current, textBlockState]);
    setFutureStates([]);
    setTextBlockState(nextState);
  };
 
  const undo = () => {
    setPastStates((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFutureStates((currentFuture) => [textBlockState, ...currentFuture]);
      setTextBlockState(previous);
      return currentPast.slice(0, -1);
    });
  };
 
  const redo = () => {
    setFutureStates((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const [next, ...remaining] = currentFuture;
      setPastStates((currentPast) => [...currentPast, textBlockState]);
      setTextBlockState(next);
      return remaining;
    });
  };
 
  return (
    <main className="flex min-h-screen flex-col bg-[#e9eef6] text-slate-900">
      <section className="flex min-h-[calc(100vh-64px)] flex-1 gap-0 sm:gap-2 overflow-hidden p-0 sm:p-2">
        <TextCanvas
          state={textBlockState}
          onStateChange={pushState}
          canUndo={pastStates.length > 0}
          canRedo={futureStates.length > 0}
          onUndo={undo}
          onRedo={redo}
          template={template}
        />
        <div className="hidden xl:block">
          <TextRightSidebar state={textBlockState} onStateChange={pushState} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
 
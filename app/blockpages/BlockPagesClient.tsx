"use client";
 
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ButtonCanvas from "./buttonblock/Canvas";
import ButtonRightSidebar from "./buttonblock/RightSidebar";
import type { BlockData } from "./buttonblock/types";
import { BuilderProvider } from "./imageblock/BuilderContext";
import LeftSidebar, { type BlockPageType } from "./imageblock/LeftSidebar";
import ImageMainCanvas from "./imageblock/MainCanvas";
import ImageRightSidebar from "./imageblock/RightSidebar";
import TextCanvas from "./textblock/Canvas";
import TextRightSidebar from "./textblock/RightSidebar";
import type { TextBlockState, TextTemplateType } from "./textblock/types";
 
const initialButtonBlock: BlockData = {
  id: "button-default",
  type: "button",
  props: {
    width: "600 px",
    borderRadius: "18 px",
  },
};
 
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
 
export default function BlockPagesClient() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template");
  const initialTemplate: TextTemplateType = requestedTemplate === "portfolio" ? "portfolio" : "ecommerce";
  const shouldOpenTextEditor = requestedTemplate === "portfolio" || requestedTemplate === "ecommerce";
  const [activeBlockPage, setActiveBlockPage] = useState<BlockPageType>(shouldOpenTextEditor ? "text" : "image");
  const [textTemplate, setTextTemplate] = useState<TextTemplateType>(initialTemplate);
  const [buttonBlocks, setButtonBlocks] = useState<BlockData[]>([initialButtonBlock]);
  const [selectedButtonBlockId, setSelectedButtonBlockId] = useState<string | null>(initialButtonBlock.id);
  const [pastButtonStates, setPastButtonStates] = useState<BlockData[][]>([]);
  const [futureButtonStates, setFutureButtonStates] = useState<BlockData[][]>([]);
  const [textBlockState, setTextBlockState] = useState<TextBlockState>(initialTextBlockState);
  const [pastTextStates, setPastTextStates] = useState<TextBlockState[]>([]);
  const [futureTextStates, setFutureTextStates] = useState<TextBlockState[]>([]);
 
  const [isImageEditingMode, setIsImageEditingMode] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
 
  const [isButtonEditingMode, setIsButtonEditingMode] = useState(false);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [customButtons, setCustomButtons] = useState<Record<string, Record<string, any>>>({});
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
 
  useEffect(() => {
    try {
      const storedImages = localStorage.getItem("stackly-custom-images");
      if (storedImages) {
        const parsed = JSON.parse(storedImages);
        const validImages: Record<string, string> = {};
        let hasChanges = false;
        for (const key in parsed) {
          if (typeof parsed[key] === "string" && parsed[key].startsWith("blob:")) {
            hasChanges = true;
          } else {
            validImages[key] = parsed[key];
          }
        }
        setCustomImages(validImages);
        if (hasChanges) {
          localStorage.setItem("stackly-custom-images", JSON.stringify(validImages));
        }
      }
    } catch (e) {
      console.error("Failed to load custom images", e);
    }
 
    try {
      const storedButtons = localStorage.getItem("stackly-custom-buttons");
      if (storedButtons) {
        setCustomButtons(JSON.parse(storedButtons));
      }
    } catch (e) {
      console.error("Failed to load custom buttons", e);
    }
  }, []);
 
  const pushButtonState = (nextBlocks: BlockData[]) => {
    setPastButtonStates((current) => [...current, buttonBlocks]);
    setFutureButtonStates([]);
    setButtonBlocks(nextBlocks);
  };
 
  const undoButton = () => {
    setPastButtonStates((currentPast) => {
      if (currentPast.length === 0) {
        return currentPast;
      }
 
      const previous = currentPast[currentPast.length - 1];
      setFutureButtonStates((currentFuture) => [buttonBlocks, ...currentFuture]);
      setButtonBlocks(previous);
      setSelectedButtonBlockId(previous[0]?.id ?? null);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoButton = () => {
    setFutureButtonStates((currentFuture) => {
      if (currentFuture.length === 0) {
        return currentFuture;
      }
 
      const [next, ...remaining] = currentFuture;
      setPastButtonStates((currentPast) => [...currentPast, buttonBlocks]);
      setButtonBlocks(next);
      setSelectedButtonBlockId(next[0]?.id ?? null);
      return remaining;
    });
  };
 
  const updateButtonBlock = (id: string, props: Record<string, unknown>) => {
    if (!id) {
      return;
    }
 
    pushButtonState(
      buttonBlocks.map((block) =>
        block.id === id
          ? {
            ...block,
            props: {
              ...block.props,
              ...props,
            },
          }
          : block,
      ),
    );
  };
 
  const removeButtonBlock = (id: string) => {
    const nextBlocks = buttonBlocks.filter((block) => block.id !== id);
    pushButtonState(nextBlocks);
    setSelectedButtonBlockId(nextBlocks[0]?.id ?? null);
  };
 
  const selectedButtonBlock =
    buttonBlocks.find((block) => block.id === selectedButtonBlockId) ?? buttonBlocks[0] ?? null;
 
  const pushTextState = (nextState: TextBlockState) => {
    setPastTextStates((current) => [...current, textBlockState]);
    setFutureTextStates([]);
    setTextBlockState(nextState);
  };
 
  const undoText = () => {
    setPastTextStates((currentPast) => {
      if (currentPast.length === 0) {
        return currentPast;
      }
 
      const previous = currentPast[currentPast.length - 1];
      setFutureTextStates((currentFuture) => [textBlockState, ...currentFuture]);
      setTextBlockState(previous);
      return currentPast.slice(0, -1);
    });
  };
 
  const redoText = () => {
    setFutureTextStates((currentFuture) => {
      if (currentFuture.length === 0) {
        return currentFuture;
      }
 
      const [next, ...remaining] = currentFuture;
      setPastTextStates((currentPast) => [...currentPast, textBlockState]);
      setTextBlockState(next);
      return remaining;
    });
  };
 
  return (
    <BuilderProvider>
      <section className="flex min-h-[calc(100vh-64px)] flex-1 gap-4 overflow-hidden bg-[#e9eef6] p-4">
        <div className="contents lg:block lg:overflow-hidden lg:rounded-xl lg:shadow-[0_18px_45px_rgba(11,29,64,0.12)]">
          <LeftSidebar
            activeBlockPage={activeBlockPage}
            isImageEditingMode={isImageEditingMode}
            editingImageId={editingImageId}
            isButtonEditingMode={isButtonEditingMode}
            editingButtonId={editingButtonId}
            onUpdateButtonStyle={(newProps) => {
              if (selectedButtonBlock) {
                updateButtonBlock(selectedButtonBlock.id, newProps);
              }
            }}
            onImageSelected={(url) => {
              if (editingImageId) {
                setCustomImages((prev) => {
                  const next = { ...prev, [editingImageId]: url };
                  localStorage.setItem("stackly-custom-images", JSON.stringify(next));
                  return next;
                });
              }
              setEditingImageId(null);
              setIsImageEditingMode(false);
            }}
            onCloseMobileImageSelect={() => setEditingImageId(null)}
            onSelectBlockPage={(page) => {
              if (page === "image" && activeBlockPage === "text") {
                setIsImageEditingMode((prev) => !prev);
                setIsButtonEditingMode(false);
                return;
              }
              if (page === "button" && activeBlockPage === "text") {
                setIsButtonEditingMode((prev) => !prev);
                setIsImageEditingMode(false);
                return;
              }
              setActiveBlockPage(page);
              if (page === "text") {
                setTextTemplate("ecommerce");
                setIsImageEditingMode(false);
                setIsButtonEditingMode(false);
              }
            }}
          />
        </div>
 
        {activeBlockPage === "button" ? (
          <div className="flex min-w-0 flex-1 gap-4 relative">
            <div className="flex-1 min-w-0">
              <ButtonCanvas
                blocks={buttonBlocks}
                selectedBlockId={selectedButtonBlockId}
                onSelectBlock={setSelectedButtonBlockId}
                onRemoveBlock={removeButtonBlock}
                canUndo={pastButtonStates.length > 0}
                canRedo={futureButtonStates.length > 0}
                onUndo={undoButton}
                onRedo={redoButton}
                editingButtonId={editingButtonId}
                onButtonSelected={(props) => {
                  if (editingButtonId) {
                    setCustomButtons((prev) => {
                      const next = { ...prev, [editingButtonId]: props };
                      localStorage.setItem("stackly-custom-buttons", JSON.stringify(next));
                      return next;
                    });
                  }
                  setActiveBlockPage("text");
                  setEditingButtonId(null);
                  setIsButtonEditingMode(false);
                }}
                onOpenMobileSidebar={() => setShowMobileSidebar(true)}
              />
            </div>
 
            {/* Mobile/Tablet Backdrop */}
            {showMobileSidebar && (
              <div
                className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
                onClick={() => setShowMobileSidebar(false)}
              />
            )}
 
            {/* Sidebar Container: Bottom sheet on mobile, relative flow on desktop */}
            <div className={`
              fixed bottom-0 left-0 w-full h-[60vh] z-[100] transition-transform duration-300
              ${showMobileSidebar ? "translate-y-0" : "translate-y-full"}
              lg:translate-y-0 lg:static lg:h-auto lg:w-[286px] lg:shrink-0 lg:block
              bg-white lg:bg-transparent rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] lg:shadow-none lg:rounded-none overflow-hidden
            `}>
              <ButtonRightSidebar
                selectedBlock={selectedButtonBlock}
                onUpdateBlock={updateButtonBlock}
                onClose={() => setShowMobileSidebar(false)}
              />
            </div>
          </div>
        ) : activeBlockPage === "text" ? (
          <div className="flex min-w-0 flex-1 gap-4">
            <TextCanvas
              state={textBlockState}
              onStateChange={pushTextState}
              canUndo={pastTextStates.length > 0}
              canRedo={futureTextStates.length > 0}
              onUndo={undoText}
              onRedo={redoText}
              template={textTemplate}
              isImageEditingMode={isImageEditingMode}
              customImages={customImages}
              onEditImage={(imageId) => {
                setEditingImageId(imageId);
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setActiveBlockPage("image");
                }
              }}
              isButtonEditingMode={isButtonEditingMode}
              customButtons={customButtons}
              onEditButton={(buttonId) => {
                setEditingButtonId(buttonId);
                setActiveBlockPage("button");
              }}
            />
            <div className="hidden w-[286px] shrink-0 lg:block">
              <TextRightSidebar state={textBlockState} onStateChange={pushTextState} />
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 gap-4">
            <ImageMainCanvas
              editingImageId={editingImageId}
              onImageSelected={(url) => {
                if (editingImageId) {
                  setCustomImages((prev) => {
                    const next = { ...prev, [editingImageId]: url };
                    localStorage.setItem("stackly-custom-images", JSON.stringify(next));
                    return next;
                  });
                }
                setActiveBlockPage("text");
                setEditingImageId(null);
                setIsImageEditingMode(false);
              }}
            />
            <div className="hidden w-[286px] shrink-0 lg:block">
              <ImageRightSidebar />
            </div>
          </div>
        )}
      </section>
    </BuilderProvider>
  );
}
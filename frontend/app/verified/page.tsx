"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { assetPath } from "@/lib/paths";
import ResetFlowBackButton from "@/components/ResetFlowBackButton";

const resetFlowCardStyle = {
  background:
    "linear-gradient(180deg, #4A76F3 0%, #2C4FAD 50%, #0A193F 100%)",
  boxShadow: "4px 4px 4px 0 rgba(0,0,0,0.25)",
} as const;

function VerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const contact = searchParams.get("contact") || "";
  const createNewPasswordUrl = contact
    ? `/create-new-password?contact=${encodeURIComponent(contact)}`
    : "/create-new-password";

  const handleContinue = useCallback(() => {
    router.push(createNewPasswordUrl);
  }, [router, createNewPasswordUrl]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target === continueButtonRef.current ||
        continueButtonRef.current?.contains(target)
      ) {
        return;
      }
      if (target.closest("button[aria-label='Go back']")) return;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();
      handleContinue();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleContinue]);

  return (
    <div className="reset-flow-page relative min-h-[100dvh] flex flex-col justify-start lg:justify-center items-stretch overflow-y-auto px-0 py-0 lg:px-6 lg:py-6 max-lg:bg-transparent bg-white">
      <ResetFlowBackButton onClick={() => router.push("/forgot-password")} />
      <div className="flex w-full flex-1 flex-col items-stretch justify-center max-lg:max-w-none max-w-[480px] lg:mx-auto min-h-0">
        <div
          className="reset-flow-card relative flex w-full flex-1 flex-col justify-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10 text-center lg:flex-none lg:min-h-0 lg:rounded-xl"
          style={resetFlowCardStyle}
        >
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src={assetPath("/tick.webp")}
              alt="Verified"
              className="w-[96px] h-[96px] object-contain"
            />
          </div>
          <h1
            className="text-[20px] sm:text-[24px] font-bold mb-2"
            style={{ color: "#FFFFFF" }}
          >
            Verified !
          </h1>
          <p
            className="text-[12px] sm:text-[13px] leading-relaxed mb-6 italic"
            style={{ color: "#FFFFFF" }}
          >
            You have successfully verified
          </p>
          <form
            className="flex justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleContinue();
            }}
          >
            <button
              ref={continueButtonRef}
              type="submit"
              className="reset-flow-primary-btn w-full max-w-[200px] mx-auto cursor-pointer rounded-[1000px] text-[14px] sm:text-[15px] font-bold shadow-md flex items-center justify-center"
              style={{ height: "40px" }}
            >
              Start
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense fallback={null}>
      <VerifiedContent />
    </Suspense>
  );
}

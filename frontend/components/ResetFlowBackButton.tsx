"use client";

type ResetFlowBackButtonProps = {
  onClick: () => void;
  ariaLabel?: string;
};

export default function ResetFlowBackButton({
  onClick,
  ariaLabel = "Go back",
}: ResetFlowBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute z-20 cursor-pointer text-2xl text-white lg:text-black left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))]"
    >
      ←
    </button>
  );
}

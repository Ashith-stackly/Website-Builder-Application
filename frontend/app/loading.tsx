export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden bg-transparent pointer-events-none"
    >
      <div className="w-full h-full bg-gradient-to-r from-[#2d8cf0] via-[#5a78c7] to-[#7d93f7] animate-pulse" />
    </div>
  );
}

import Footer from "@/components/Footer";
import BlockPagesClient from "./BlockPagesClient";

export default function BlockPages() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f0f2f5] text-slate-900">
      <BlockPagesClient />
      <Footer />
    </main>
  );
}

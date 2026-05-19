import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function HeroComponent({ component }: { component: BuilderComponent }) {
  const [title = "Create a website in minutes", description = "Design and export a clean page.", action = "Start Building"] = component.content.split("|");

  return (
    <section className="w-full overflow-hidden border border-[#dbe3ef]" style={toReactStyle(component.styles)}>
      <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <h1 className="text-[34px] font-bold leading-tight text-[#0B1D40]">{title}</h1>
          <p className="mt-4 max-w-[560px] text-base font-medium leading-7 text-[#566583]">{description}</p>
          <button className="mt-6 rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#152B52]" type="button">
            {action}
          </button>
        </div>
        <div className="min-h-[180px] rounded-lg border border-[#dbe3ef] bg-white p-4 shadow-sm">
          <div className="mb-3 h-3 w-24 rounded-full bg-[#dbe3ef]" />
          <div className="grid gap-3">
            <div className="h-16 rounded bg-[#f7f9fc]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded bg-[#f7f9fc]" />
              <div className="h-20 rounded bg-[#f7f9fc]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

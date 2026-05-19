import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function NavigationComponent({ component }: { component: BuilderComponent }) {
  const [brand = "Stackly Studio", links = "Home,About,Services,Contact", action = "Get Started"] = component.content.split("|");

  return (
    <nav className="flex w-full flex-wrap items-center justify-between gap-4 border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <span className="text-lg font-bold text-[#0B1D40]">{brand}</span>
      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#566583]">
        {links.split(",").map((link) => (
          <span className="transition hover:text-[#0B1D40]" key={link.trim()}>
            {link.trim()}
          </span>
        ))}
      </div>
      <button className="rounded-md bg-[#0B1D40] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#152B52]" type="button">
        {action}
      </button>
    </nav>
  );
}

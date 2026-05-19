import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function FeaturesComponent({ component }: { component: BuilderComponent }) {
  const features = component.content
    .split("\n")
    .map((item) => item.split("|"))
    .filter(([title]) => title?.trim());

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-4 md:grid-cols-3">
        {features.map(([title, description], index) => (
          <article className="rounded-lg border border-[#dbe3ef] bg-[#f7f9fc] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md" key={`${title}-${index}`}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-[#0B1D40] text-sm font-bold text-white">
              {index + 1}
            </div>
            <h3 className="text-base font-bold text-[#0B1D40]">{title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-[#566583]">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

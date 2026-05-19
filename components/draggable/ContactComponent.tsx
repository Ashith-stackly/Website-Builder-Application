import type { BuilderComponent } from "@/types/builder";
import { toReactStyle } from "./componentStyles";

export default function ContactComponent({ component }: { component: BuilderComponent }) {
  const [title = "Ready to launch?", description = "Leave your email and we will help you go live.", placeholder = "Email address", action = "Contact Us"] = component.content.split("|");

  return (
    <section className="w-full border border-[#dbe3ef] shadow-sm" style={toReactStyle(component.styles)}>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <h2 className="text-2xl font-bold text-[#0B1D40]">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#566583]">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="min-w-0 flex-1 rounded-md border border-[#dbe3ef] px-4 py-3 text-sm font-semibold text-[#0B1D40] outline-none focus:ring-2 focus:ring-blue-100" placeholder={placeholder} readOnly />
          <button className="rounded-md bg-[#0B1D40] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#152B52]" type="button">
            {action}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { AlignCenter, AlignLeft, AlignRight, SlidersHorizontal } from "lucide-react";
import type { BuilderComponent, ComponentStyles } from "@/types/builder";

const styleFields: Array<{ key: keyof ComponentStyles; label: string; type?: string; placeholder?: string }> = [
  { key: "fontSize", label: "Font Size", placeholder: "16px" },
  { key: "color", label: "Text Color", type: "color" },
  { key: "backgroundColor", label: "Background", type: "color" },
  { key: "padding", label: "Padding", placeholder: "12px" },
  { key: "margin", label: "Margin", placeholder: "0 0 12px" },
  { key: "borderRadius", label: "Border Radius", placeholder: "6px" },
  { key: "width", label: "Width", placeholder: "100%" },
  { key: "height", label: "Height", placeholder: "auto" },
];

const contentInputClass =
  "w-full rounded-xl border border-[#0B1D40] bg-transparent px-4 py-2.5 text-[14px] font-semibold text-[#0B1D40] outline-none transition focus:ring-2 focus:ring-blue-100";

const imagePresets = [
  "/showcase.webp",
  "/landing-optimized/portfolio03.webp",
  "/landing-optimized/ecommerce.webp",
  "/landing-optimized/business09.webp",
  "/landing-optimized/construction02.webp",
  "/landing-optimized/foodd03.webp",
];

function ContentField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
      <input className={contentInputClass} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" value={value} />
    </label>
  );
}

export default function PropertyEditor({
  component,
  onUpdate,
}: {
  component: BuilderComponent | null;
  onUpdate: (id: string, updates: Partial<BuilderComponent>) => void;
}) {
  const updateStyle = (styles: ComponentStyles) => {
    if (!component) return;
    onUpdate(component.id, { styles: { ...component.styles, ...styles } });
  };

  const updateContentPart = (index: number, value: string) => {
    if (!component) return;
    const parts = component.content.split("|");
    parts[index] = value;
    onUpdate(component.id, { content: parts.join("|") });
  };

  const renderContentEditor = () => {
    if (!component) return null;

    const parts = component.content.split("|");

    if (component.type === "navigation") {
      return (
        <div className="space-y-4">
          <ContentField label="Brand Name" onChange={(value) => updateContentPart(0, value)} placeholder="Stackly Studio" value={parts[0] || ""} />
          <ContentField label="Menu Links" onChange={(value) => updateContentPart(1, value)} placeholder="Home,About,Services,Contact" value={parts[1] || ""} />
          <ContentField label="Button Text" onChange={(value) => updateContentPart(2, value)} placeholder="Get Started" value={parts[2] || ""} />
          <p className="text-xs font-medium leading-5 text-[#566583]">Separate menu items with commas.</p>
        </div>
      );
    }

    if (component.type === "hero") {
      return (
        <div className="space-y-4">
          <ContentField label="Headline" onChange={(value) => updateContentPart(0, value)} placeholder="Create a website in minutes" value={parts[0] || ""} />
          <label className="block">
            <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">Description</span>
            <textarea
              className={`${contentInputClass} min-h-[86px] resize-none`}
              onChange={(event) => updateContentPart(1, event.target.value)}
              placeholder="Design, edit, and export a clean landing page."
              value={parts[1] || ""}
            />
          </label>
          <ContentField label="Button Text" onChange={(value) => updateContentPart(2, value)} placeholder="Start Building" value={parts[2] || ""} />
        </div>
      );
    }

    if (component.type === "contact") {
      return (
        <div className="space-y-4">
          <ContentField label="Title" onChange={(value) => updateContentPart(0, value)} placeholder="Ready to launch?" value={parts[0] || ""} />
          <ContentField label="Subtitle" onChange={(value) => updateContentPart(1, value)} placeholder="Leave your email and we will help you go live." value={parts[1] || ""} />
          <ContentField label="Input Placeholder" onChange={(value) => updateContentPart(2, value)} placeholder="Email address" value={parts[2] || ""} />
          <ContentField label="Button Text" onChange={(value) => updateContentPart(3, value)} placeholder="Contact Us" value={parts[3] || ""} />
        </div>
      );
    }

    if (component.type === "features") {
      return (
        <div className="space-y-3">
          <textarea
            className={`${contentInputClass} min-h-[150px] resize-none font-medium leading-6`}
            onChange={(event) => onUpdate(component.id, { content: event.target.value })}
            value={component.content}
          />
          <p className="text-xs font-medium leading-5 text-[#566583]">Use one feature per line. Format: Title|Description</p>
        </div>
      );
    }

    if (component.type === "gallery") {
      return (
        <div className="space-y-3">
          <textarea
            className={`${contentInputClass} min-h-[150px] resize-none font-medium leading-6`}
            onChange={(event) => onUpdate(component.id, { content: event.target.value })}
            value={component.content}
          />
          <p className="text-xs font-medium leading-5 text-[#566583]">Use one image per line. Format: /image.webp|Caption</p>
          <div className="grid grid-cols-2 gap-2">
            {imagePresets.slice(1, 5).map((image) => (
              <button
                className="truncate rounded-lg border border-[#0B1D40] px-2 py-2 text-[10px] font-bold text-[#0B1D40] transition hover:bg-black/5"
                key={image}
                onClick={() => {
                  const nextLine = `${image}|Image`;
                  onUpdate(component.id, { content: component.content ? `${component.content}\n${nextLine}` : nextLine });
                }}
                type="button"
              >
                Add {image.split("/").pop()?.replace(".webp", "")}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (component.type === "image") {
      return (
        <div className="space-y-3">
          <ContentField label="Image Path or URL" onChange={(value) => onUpdate(component.id, { content: value })} placeholder="/showcase.webp" value={component.content} />
          <div className="grid grid-cols-2 gap-2">
            {imagePresets.map((image) => (
              <button
                className={`truncate rounded-lg border px-2 py-2 text-[10px] font-bold transition ${component.content === image ? "border-blue-500 bg-blue-50 text-blue-700" : "border-[#0B1D40] text-[#0B1D40] hover:bg-black/5"}`}
                key={image}
                onClick={() => onUpdate(component.id, { content: image })}
                type="button"
              >
                {image.split("/").pop()?.replace(".webp", "")}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const label = component.type === "input" ? "Placeholder Text" : "Text";

    return (
      <label className="block">
        <span className="mb-2 block text-[13px] font-bold text-[#0B1D40]">{label}</span>
        <textarea
          className={`${contentInputClass} min-h-[92px] resize-none`}
          onChange={(event) => onUpdate(component.id, { content: event.target.value })}
          value={component.content}
        />
      </label>
    );
  };

  return (
    <aside className="relative hidden h-full w-[286px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#f4d8cc] bg-[#fff7f4] shadow-[0_18px_45px_rgba(113,63,18,0.10)] xl:flex">
      <div className="flex border-b border-[#f2d8cf] bg-white/45 px-6 pt-5">
        <button className="flex-1 border-b-[2px] border-[#0B1D40] pb-4 text-base font-bold text-[#0B1D40]" type="button">
          Settings
        </button>
        <button className="flex-1 border-b-[2px] border-gray-300 pb-4 text-base font-bold text-[#566583]" type="button">
          Styles
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-8 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!component ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm font-medium leading-6 text-[#566583]">
            <SlidersHorizontal className="mb-3 h-8 w-8 text-[#0B1D40]" />
            Select a canvas block to edit its content and styles.
          </div>
        ) : (
          <>
            <div>
              <h4 className="mb-3 text-[15px] font-bold text-[#0B1D40]">Content</h4>
              {renderContentEditor()}
            </div>

            <div>
              <h4 className="mb-3 text-[15px] font-bold text-[#0B1D40]">Alignment</h4>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#0B1D40]">
                {[
                  { value: "left", icon: AlignLeft },
                  { value: "center", icon: AlignCenter },
                  { value: "right", icon: AlignRight },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = component.styles.textAlign === item.value;
                  return (
                    <button
                      className={`flex items-center justify-center border-r border-[#0B1D40] py-2.5 last:border-r-0 ${isActive ? "bg-[#0B1D40] text-white" : "text-[#0B1D40] hover:bg-black/5"}`}
                      key={item.value}
                      onClick={() => updateStyle({ textAlign: item.value as ComponentStyles["textAlign"] })}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {styleFields.map((field) => (
                <label className="block" key={field.key}>
                  <span className="mb-2 block text-[15px] font-bold text-[#0B1D40]">{field.label}</span>
                  <input
                    className="w-full rounded-xl border border-[#0B1D40] bg-transparent px-4 py-2.5 text-center text-[15px] font-bold text-[#0B1D40] outline-none transition focus:ring-2 focus:ring-blue-100"
                    onChange={(event) => updateStyle({ [field.key]: event.target.value })}
                    placeholder={field.placeholder}
                    type={field.type || "text"}
                    value={component.styles[field.key] || (field.type === "color" ? "#000000" : "")}
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

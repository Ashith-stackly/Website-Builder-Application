"use client";

import { Send } from "lucide-react";
import InlineText from "@/components/builder/InlineText";
import type { BuilderComponent, FormProps } from "@/types/builder";
import { getTargetTextStyles, getTextStyles, toReactStyle } from "./componentStyles";
import { useBuilderStore } from "@/store/builderStore";

export const formDefaults: FormProps = {
  heading: "Get in Touch",
  description: "Fill out the form below and we'll get back to you shortly.",
  fields: [
    { name: "name", type: "text", label: "Full Name", placeholder: "John Doe", required: true },
    { name: "email", type: "email", label: "Email Address", placeholder: "john@example.com", required: true },
    { name: "phone", type: "tel", label: "Phone Number", placeholder: "+1 (555) 000-0000" },
    { name: "subject", type: "select", label: "Subject", placeholder: "Select a topic", options: ["General Inquiry", "Support", "Feedback", "Partnership"] },
    { name: "message", type: "textarea", label: "Message", placeholder: "Tell us more about your project...", required: true },
  ],
  submitLabel: "Send Message",
  successMessage: "Thank you! We'll be in touch soon.",
};

/* ── Safe reader ────────────────────────────────────────────────────── */
function readFormData(component: BuilderComponent): FormProps {
  const p = component.props as Record<string, unknown> | undefined;
  if (!p || typeof p !== "object") return formDefaults;
  return {
    heading: typeof p.heading === "string" ? p.heading : formDefaults.heading,
    description: typeof p.description === "string" ? p.description : formDefaults.description,
    fields: Array.isArray(p.fields) ? (p.fields as FormProps["fields"]) : formDefaults.fields,
    submitLabel: typeof p.submitLabel === "string" ? p.submitLabel : formDefaults.submitLabel,
    successMessage: typeof p.successMessage === "string" ? p.successMessage : formDefaults.successMessage,
  };
}

export default function FormComponent({
  component,
  onPatch,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const data = readFormData(component);
  const textStyle = getTextStyles(component.styles);
  const viewport = useBuilderStore((s) => s.viewport);

  const fieldClass =
    "w-full rounded-xl border-2 border-[#e6edf5] bg-white px-4 py-3 text-sm font-medium text-[#0B1D40] placeholder-[#94a3b8] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10";

  const gridClass = viewport === "mobile"
    ? "grid grid-cols-1 gap-4"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2";

  function saveProp(field: keyof FormProps, value: unknown) {
    onPatch?.({ props: { [field]: value } });
  }

  return (
    <div className="mx-auto w-full max-w-[640px] py-6" style={toReactStyle(component.styles)}>
      {data.heading && (
        <InlineText
          componentId={component.id}
          textKey="form.heading"
          textLabel="Form heading"
          as="h2"
          value={data.heading}
          onSave={(v) => saveProp("heading", v)}
          className="mb-2 text-center text-2xl font-extrabold"
          style={getTargetTextStyles(component, "form.heading", textStyle)}
        />
      )}
      {data.description && (
        <InlineText
          componentId={component.id}
          textKey="form.description"
          textLabel="Form description"
          as="p"
          value={data.description}
          onSave={(v) => saveProp("description", v)}
          className="mb-6 text-center text-sm font-medium text-[#566583]"
          style={getTargetTextStyles(component, "form.description", { color: "#566583" })}
        />
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* 2-col grid for text/email/tel, full-width for textarea/select */}
        <div className={gridClass}>
          {data.fields
            .filter((f) => f.type !== "textarea")
            .map((field) => (
              <div key={field.name} className={field.type === "select" ? "sm:col-span-2" : ""}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#566583]">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-red-400">*</span>}
                </label>
                {field.type === "select" ? (
                  <select className={fieldClass} defaultValue="">
                    <option value="" disabled>{field.placeholder || "Select..."}</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className={fieldClass}
                    required={field.required}
                  />
                )}
              </div>
            ))}
        </div>

        {/* Textarea fields */}
        {data.fields
          .filter((f) => f.type === "textarea")
          .map((field) => (
            <div key={field.name}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#566583]">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-400">*</span>}
              </label>
              <textarea
                placeholder={field.placeholder}
                rows={4}
                className={`${fieldClass} resize-none`}
                required={field.required}
              />
            </div>
          ))}

        <InlineText
          componentId={component.id}
          textKey="form.submitLabel"
          textLabel="Form submit button"
          as="button"
          value={data.submitLabel}
          onSave={(v) => saveProp("submitLabel", v)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1D40] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(11,29,64,0.25)] transition hover:bg-[#152B52] hover:shadow-lg active:scale-[0.98]"
        />
      </form>
    </div>
  );
}

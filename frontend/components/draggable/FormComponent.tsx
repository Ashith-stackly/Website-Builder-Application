"use client";

import { Send } from "lucide-react";
import type { BuilderComponent, FormProps } from "@/types/builder";
import { getBaseStyles } from "./componentStyles";

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

export default function FormComponent({
  component,
}: {
  component: BuilderComponent;
  children?: React.ReactNode;
  isEditing?: boolean;
  onUpdate?: (content: string | null) => void;
  onPatch?: (patch: Partial<BuilderComponent>) => void;
}) {
  const props = (component.props as unknown as FormProps) || formDefaults;
  const base = getBaseStyles(component);

  const fieldClass =
    "w-full rounded-xl border-2 border-[#e6edf5] bg-white px-4 py-3 text-sm font-medium text-[#0B1D40] placeholder-[#94a3b8] outline-none transition focus:border-[#0B1D40] focus:ring-2 focus:ring-[#0B1D40]/10";

  return (
    <div style={base} className="mx-auto w-full max-w-[640px] py-6">
      {props.heading && (
        <h2
          className="mb-2 text-center text-2xl font-extrabold"
          style={{ color: base.color || "#0B1D40" }}
        >
          {props.heading}
        </h2>
      )}
      {props.description && (
        <p className="mb-6 text-center text-sm font-medium text-[#566583]">{props.description}</p>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* 2-col grid for text/email/tel, full-width for textarea/select */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {props.fields
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
        {props.fields
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

        <button
          type="submit"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1D40] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(11,29,64,0.25)] transition hover:bg-[#152B52] hover:shadow-lg active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
          {props.submitLabel}
        </button>
      </form>
    </div>
  );
}


"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, UserRound } from "lucide-react";
import { assetPath } from "@/lib/paths";
import { defaultUserSettings, readUserSettings, saveUserSettings, UserSettings } from "@/lib/userSettings";

export default function ProfileSettingsPanel() {
  const [form, setForm] = useState<UserSettings>(defaultUserSettings);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setForm(readUserSettings()), 0);
    return () => window.clearTimeout(id);
  }, []);

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      window.alert("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...form, name: form.name.trim(), email: form.email.trim() };
    saveUserSettings(next);
    setForm(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  const avatar = form.avatar.startsWith("data:") ? form.avatar : assetPath(form.avatar);

  return (
    <section id="profile-settings" className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><UserRound className="h-5 w-5" /></span>
        <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-700">Account</p><h2 className="text-xl font-black text-[#06224C]">Profile settings</h2></div>
      </div>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-1 ring-slate-200" aria-label="Change profile picture">
            <img src={avatar} alt="Profile preview" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100"><Camera /></span>
          </button>
          <input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={selectAvatar} />
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-900">Upload avatar</button>
          <p className="mt-1 text-center text-[11px] text-slate-400">PNG, JPG or WebP · max 2 MB</p>
        </div>
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-600">Display name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="text-xs font-bold text-slate-600">Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="submit" className="rounded-xl bg-[#06224C] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-800">Save profile</button>
            {saved && <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved across Stackly</span>}
          </div>
        </div>
      </form>
    </section>
  );
}

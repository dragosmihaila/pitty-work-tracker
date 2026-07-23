"use client";

import { languages, type Language } from "@/lib/i18n";

type LanguageSwitcherProps = {
  label: string;
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageSwitcher({ label, language, onChange }: LanguageSwitcherProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
      <span className="hidden sm:inline">{label}</span>
      <select
        aria-label={label}
        className="field min-h-11 w-auto min-w-20 py-2"
        onChange={(event) => onChange(event.target.value as Language)}
        value={language}
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}


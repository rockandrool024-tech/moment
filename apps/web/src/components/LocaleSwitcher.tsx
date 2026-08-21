"use client";

import { useLocale, type Locale } from "@/lib/locale-context";
import styles from "./LocaleSwitcher.module.css";

const options: Array<{ value: Locale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
  { value: "ar", label: "ع" },
];

export function LocaleSwitcher() {
  const { locale, messages, setLocale } = useLocale();

  return (
    <div className={styles.root} role="group" aria-label={messages.language}>
      {options.map((option) => (
        <button
          key={option.value}
          className={locale === option.value ? styles.active : styles.button}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

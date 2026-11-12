"use client";

import { create } from "zustand";
import { translations, type Lang, type TranslationKey } from "./translations";

interface I18nState {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  formatDate: (d: Date | string) => string;
  formatDateTime: (d: Date | string) => string;
  formatPrice: (price: number, currency: string) => string;
}

const STORAGE_KEY = "courselearn_lang";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;
  return "en";
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: getInitialLang(),
  dir: getInitialLang() === "ar" ? "rtl" : "ltr",
  setLang: (lang: Lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
    set({ lang, dir: lang === "ar" ? "rtl" : "ltr" });
  },
  toggleLang: () => {
    const current = get().lang;
    get().setLang(current === "en" ? "ar" : "en");
  },
  t: (key: TranslationKey) => {
    const { lang } = get();
    const dict = translations[lang];
    return dict[key] || translations.en[key] || String(key);
  },
  formatDate: (d) => {
    const { lang } = get();
    const date = typeof d === "string" ? new Date(d) : d;
    const locale = lang === "ar" ? "ar-OM" : "en-OM";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },
  formatDateTime: (d) => {
    const { lang } = get();
    const date = typeof d === "string" ? new Date(d) : d;
    const locale = lang === "ar" ? "ar-OM" : "en-OM";
    return date.toLocaleString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
  formatPrice: (price, currency) => {
    const { lang } = get();
    const locale = lang === "ar" ? "ar-OM" : "en-OM";
    const formatted = price.toLocaleString(locale, {
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    if (lang === "ar" && currency === "OMR") {
      return `${formatted} ر.ع`;
    }
    return `${formatted} ${currency}`;
  },
}));

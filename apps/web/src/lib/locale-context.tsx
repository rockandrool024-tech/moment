"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "ar" | "fr";

type Messages = {
  language: string;
  brandSlogan: string;
  startStory: string;
  exploreMomentum: string;
  creatorProfile: string;
  uploadPhoto: string;
  customizeCharacter: string;
  editProfile: string;
  refreshAvatar: string;
  uploadProfileImage: string;
  uploadCancelled: string;
  uploadingProfileImage: string;
  chooseImage: string;
  imageRequirements: string;
  cancel: string;
  save: string;
  mapPrivacy: string;
  useMyLocation: string;
  locationDenied: string;
  predictions: string;
  makeYourCall: string;
  buildYourTrackRecord: string;
};

const messages: Record<Locale, Messages> = {
  en: {
    language: "Language",
    brandSlogan: "Where stories become opportunities.",
    startStory: "Start your story",
    exploreMomentum: "Explore momentum",
    creatorProfile: "Creator profile",
    uploadPhoto: "Upload photo",
    customizeCharacter: "Customize character",
    editProfile: "Edit profile",
    refreshAvatar: "Refresh avatar",
    uploadProfileImage: "Upload profile image",
    uploadCancelled: "Avatar upload cancelled.",
    uploadingProfileImage: "Uploading profile image",
    chooseImage: "Choose a JPEG, PNG or WebP image.",
    imageRequirements: "JPEG, PNG or WebP · 5 MB maximum",
    cancel: "Cancel",
    save: "Save",
    mapPrivacy: "Your precise location is never published. The map uses public, approximate places only.",
    useMyLocation: "Use my location",
    locationDenied: "Location access was declined. You can still explore the map or choose a city manually.",
    predictions: "Predictions",
    makeYourCall: "Make your call",
    buildYourTrackRecord: "Build your track record",
  },
  fr: {
    language: "Langue",
    brandSlogan: "Là où les histoires deviennent des opportunités.",
    startStory: "Commencer votre histoire",
    exploreMomentum: "Explorer la dynamique",
    creatorProfile: "Profil créateur",
    uploadPhoto: "Importer une photo",
    customizeCharacter: "Personnaliser le personnage",
    editProfile: "Modifier le profil",
    refreshAvatar: "Actualiser l’avatar",
    uploadProfileImage: "Importer la photo de profil",
    uploadCancelled: "Import de l’avatar annulé.",
    uploadingProfileImage: "Import de la photo de profil",
    chooseImage: "Choisissez une image JPEG, PNG ou WebP.",
    imageRequirements: "JPEG, PNG ou WebP · 5 Mo maximum",
    cancel: "Annuler",
    save: "Enregistrer",
    mapPrivacy: "Votre position précise n’est jamais publiée. La carte utilise uniquement des lieux publics approximatifs.",
    useMyLocation: "Utiliser ma position",
    locationDenied: "L’accès à la position a été refusé. Vous pouvez continuer à explorer la carte ou choisir une ville.",
    predictions: "Prédictions",
    makeYourCall: "Faites votre choix",
    buildYourTrackRecord: "Construire votre parcours",
  },
  ar: {
    language: "اللغة",
    brandSlogan: "حيث تتحول القصص إلى فرص.",
    startStory: "ابدأ قصتك",
    exploreMomentum: "استكشف الزخم",
    creatorProfile: "ملف المبدع",
    uploadPhoto: "تحميل صورة",
    customizeCharacter: "تخصيص الشخصية",
    editProfile: "تعديل الملف",
    refreshAvatar: "تحديث الصورة الرمزية",
    uploadProfileImage: "تحميل صورة الملف الشخصي",
    uploadCancelled: "تم إلغاء تحميل الصورة الرمزية.",
    uploadingProfileImage: "جارٍ تحميل صورة الملف الشخصي",
    chooseImage: "اختر صورة بصيغة JPEG أو PNG أو WebP.",
    imageRequirements: "JPEG أو PNG أو WebP · الحد الأقصى 5 ميغابايت",
    cancel: "إلغاء",
    save: "حفظ",
    mapPrivacy: "لا يتم نشر موقعك الدقيق أبداً. تعرض الخريطة أماكن عامة تقريبية فقط.",
    useMyLocation: "استخدم موقعي",
    locationDenied: "تم رفض الوصول إلى الموقع. يمكنك متابعة استكشاف الخريطة أو اختيار مدينة يدوياً.",
    predictions: "التوقعات",
    makeYourCall: "اتخذ قرارك",
    buildYourTrackRecord: "ابنِ سجلك الإبداعي",
  },
};

type LocaleContextValue = {
  locale: Locale;
  direction: "ltr" | "rtl";
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("perokio.locale");
    if (stored === "en" || stored === "fr" || stored === "ar") setLocaleState(stored);
  }, []);

  useEffect(() => {
    const direction = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    messages: messages[locale],
    setLocale: (nextLocale) => {
      window.localStorage.setItem("perokio.locale", nextLocale);
      setLocaleState(nextLocale);
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

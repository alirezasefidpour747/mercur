import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { defaultI18nOptions } from "../../../i18n/config";
import { languages } from "../../../i18n/languages";
import translations from "../../../i18n/translations";
import customI18nResources from "virtual:mercur/i18n";
import config from "virtual:mercur/config";

let documentLanguageListenerRegistered = false;

const syncDocumentLanguage = (code: string) => {
  if (typeof document === "undefined") {
    return;
  }

  const normalizedCode = code.toLowerCase();
  const language = languages.find(({ code: candidate }) => {
    const normalizedCandidate = candidate.toLowerCase();
    return (
      normalizedCode === normalizedCandidate ||
      normalizedCode.startsWith(`${normalizedCandidate}-`)
    );
  });

  document.documentElement.lang = code;
  document.documentElement.dir = language?.ltr === false ? "rtl" : "ltr";
};

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

const mergedTranslations = deepMerge(translations, customI18nResources);

export const I18n = () => {
  if (i18n.isInitialized) {
    return null;
  }

  if (!documentLanguageListenerRegistered) {
    i18n.on("languageChanged", syncDocumentLanguage);
    documentLanguageListenerRegistered = true;
  }

  i18n
    .use(
      new LanguageDetector(null, {
        lookupCookie: "lng",
        lookupLocalStorage: "lng",
      }),
    )
    .use(initReactI18next)
    .init({
      ...defaultI18nOptions,
      ...(config.i18n?.defaultLanguage && {
        lng: config.i18n.defaultLanguage,
      }),
      resources: mergedTranslations,
    })
    .then(() => syncDocumentLanguage(i18n.resolvedLanguage || i18n.language));

  return null;
};

export { i18n };

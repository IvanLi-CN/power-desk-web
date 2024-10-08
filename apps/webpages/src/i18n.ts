import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { initReactI18next } from "react-i18next";

i18n.use(Fetch).use(LanguageDetector).use(initReactI18next).init({
  fallbackLng: "en",
  debug: true,
});

export default i18n;

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { en } from "@/translations/en";
import { fr } from "@/translations/fr";

type Lang = "en" | "fr";
type Translations = typeof en;

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const translations = { en, fr };

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("nbk-lang").then((saved) => {
      if (saved === "en" || saved === "fr") {
        setLangState(saved);
      }
      setMounted(true);
    });
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem("nbk-lang", newLang);
  };

  if (!mounted) return null;

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

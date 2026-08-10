"use client";

import { create } from "zustand";

export type LanguageCode = "en" | "en-gb" | "hi" | "es";

export interface Translations {
  nav: {
    searchPlaceholder: string;
    search: string;
    dashboard: string;
    analytics: string;
    settings: string;
    builder: string;
    templates: string;
    projects: string;
    assets: string;
    [key: string]: string;
  };
  sidebar: {
    workspace: string;
    light: string;
    dark: string;
    system: string;
    profile: string;
    logOut: string;
  };
  dashboard: {
    newProject: string;
    quickActions: string;
    overview: string;
  };
  settings: {
    tabs: Record<string, string>;
    appearance: {
      theme: string;
      themeDesc: string;
      lightHint: string;
      darkHint: string;
      systemHint: string;
      langRegion: string;
      langDesc: string;
      language: string;
    };
  };
}

const translations: Record<LanguageCode, Translations> = {
  en: {
    nav: {
      searchPlaceholder: "Search pages, projects & actions...",
      search: "Search...",
      dashboard: "Dashboard",
      analytics: "Analytics",
      settings: "Settings",
      builder: "Builder",
      templates: "Templates",
      projects: "Projects",
      assets: "Assets",
    },
    sidebar: {
      workspace: "Personal Workspace",
      light: "Light",
      dark: "Dark",
      system: "System",
      profile: "Profile",
      logOut: "Log Out",
    },
    dashboard: {
      newProject: "New Project",
      quickActions: "Quick Actions",
      overview: "Overview & shortcut launchpads",
    },
    settings: {
      tabs: {
        profile: "Profile",
        appearance: "Appearance",
        notifications: "Notifications",
        security: "Security",
        billing: "Billing",
        danger: "Danger zone",
      },
      appearance: {
        theme: "Theme",
        themeDesc: "Customize how Stackly looks on your device",
        lightHint: "Clean & crisp daylight interface",
        darkHint: "Sleek contrast for dark environments",
        systemHint: "Syncs with your operating system preference",
        langRegion: "Language & Region",
        langDesc: "Select your preferred language for the interface",
        language: "Language",
      },
    },
  },
  "en-gb": {
    nav: {
      searchPlaceholder: "Search pages, projects & actions...",
      search: "Search...",
      dashboard: "Dashboard",
      analytics: "Analytics",
      settings: "Settings",
      builder: "Builder",
      templates: "Templates",
      projects: "Projects",
      assets: "Assets",
    },
    sidebar: {
      workspace: "Personal Workspace",
      light: "Light",
      dark: "Dark",
      system: "System",
      profile: "Profile",
      logOut: "Log Out",
    },
    dashboard: {
      newProject: "New Project",
      quickActions: "Quick Actions",
      overview: "Overview & shortcut launchpads",
    },
    settings: {
      tabs: {
        profile: "Profile",
        appearance: "Appearance",
        notifications: "Notifications",
        security: "Security",
        billing: "Billing",
        danger: "Danger zone",
      },
      appearance: {
        theme: "Theme",
        themeDesc: "Customise how Stackly looks on your device",
        lightHint: "Clean & crisp daylight interface",
        darkHint: "Sleek contrast for dark environments",
        systemHint: "Syncs with your operating system preference",
        langRegion: "Language & Region",
        langDesc: "Select your preferred language for the interface",
        language: "Language",
      },
    },
  },
  hi: {
    nav: {
      searchPlaceholder: "पृष्ठ, प्रोजेक्ट और क्रियाएं खोजें...",
      search: "खोजें...",
      dashboard: "डैशबोर्ड",
      analytics: "विश्लेषण",
      settings: "सेटिंग्स",
      builder: "बिल्डर",
      templates: "टम्प्लेट",
      projects: "प्रोजेक्ट्स",
      assets: "एसेट",
    },
    sidebar: {
      workspace: "व्यक्तिगत कार्यस्थल",
      light: "लाइट",
      dark: "डार्क",
      system: "सिस्टम",
      profile: "प्रोफ़ाइल",
      logOut: "लॉग आउट",
    },
    dashboard: {
      newProject: "नया प्रोजेक्ट",
      quickActions: "त्वरित कार्रवाई",
      overview: "अवलोकन और शॉर्टकट",
    },
    settings: {
      tabs: {
        profile: "प्रोफ़ाइल",
        appearance: "रंग-रूप",
        notifications: "सूचनाएं",
        security: "सुरक्षा",
        billing: "बिलिंग",
        danger: "खतरा क्षेत्र",
      },
      appearance: {
        theme: "थीम",
        themeDesc: "अनुकूलित करें कि स्टैकली आपके डिवाइस पर कैसा दिखता है",
        lightHint: "स्वच्छ इंटरफ़ेस",
        darkHint: "डार्क मोड",
        systemHint: "सिस्टम प्राथमिकता के साथ समन्वयित करें",
        langRegion: "भाषा और क्षेत्र",
        langDesc: "इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें",
        language: "भाषा",
      },
    },
  },
  es: {
    nav: {
      searchPlaceholder: "Buscar páginas, proyectos y acciones...",
      search: "Buscar...",
      dashboard: "Panel",
      analytics: "Analítica",
      settings: "Configuración",
      builder: "Constructor",
      templates: "Plantillas",
      projects: "Proyectos",
      assets: "Recursos",
    },
    sidebar: {
      workspace: "Espacio personal",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      profile: "Perfil",
      logOut: "Cerrar sesión",
    },
    dashboard: {
      newProject: "Nuevo proyecto",
      quickActions: "Acciones rápidas",
      overview: "Visión general y accesos directos",
    },
    settings: {
      tabs: {
        profile: "Perfil",
        appearance: "Apariencia",
        notifications: "Notificaciones",
        security: "Seguridad",
        billing: "Facturación",
        danger: "Zona de peligro",
      },
      appearance: {
        theme: "Tema",
        themeDesc: "Personaliza cómo se ve Stackly en tu dispositivo",
        lightHint: "Interfaz clara de día",
        darkHint: "Elegante contraste oscuro",
        systemHint: "Sincroniza con la preferencia del sistema",
        langRegion: "Idioma y región",
        langDesc: "Selecciona tu idioma preferido para la interfaz",
        language: "Idioma",
      },
    },
  },
};

const STORAGE_KEY = "stackly-lang";

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && translations[saved]) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return "en";
}

interface LanguageState {
  lang: LanguageCode;
  t: Translations;
  setLang: (lang: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>((set) => {
  const initialLang = getInitialLanguage();
  return {
    lang: initialLang,
    t: translations[initialLang] || translations.en,
    setLang: (lang: LanguageCode) => {
      const validLang = translations[lang] ? lang : "en";
      try {
        localStorage.setItem(STORAGE_KEY, validLang);
      } catch {
        /* ignore */
      }
      set({
        lang: validLang,
        t: translations[validLang],
      });
    },
  };
});

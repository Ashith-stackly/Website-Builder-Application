/**
 * @deprecated Legacy local storage settings types. Profile settings now fetch directly from backend APIs.
 */
export const USER_SETTINGS_KEY = "stacklyUserSettings";
export const USER_SETTINGS_EVENT = "stackly-user-settings-updated";

export type UserSettings = {
  name: string;
  email: string;
  avatar: string;
};

export const defaultUserSettings: UserSettings = {
  name: "Stackly User",
  email: "user@stackly.com",
  avatar: "/profile.webp",
};

/**
 * @deprecated Use fetchProfile() from profileApi.ts instead.
 */
export function readUserSettings(): UserSettings {
  // Legacy profile localStorage persistence has been removed.
  // Clean up legacy localStorage profile key if present.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(USER_SETTINGS_KEY);
    } catch {
      /* ignore */
    }
  }
  return defaultUserSettings;
}

/**
 * @deprecated Use updateProfile() from profileApi.ts instead.
 */
export function saveUserSettings(settings: UserSettings) {
  // Legacy profile localStorage persistence has been removed.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(USER_SETTINGS_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(USER_SETTINGS_EVENT, { detail: settings }));
  }
}

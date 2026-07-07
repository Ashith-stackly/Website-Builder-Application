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

export function readUserSettings(): UserSettings {
  if (typeof window === "undefined") return defaultUserSettings;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USER_SETTINGS_KEY) || "{}") as Partial<UserSettings>;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : defaultUserSettings.name,
      email: typeof parsed.email === "string" && parsed.email.trim() ? parsed.email : defaultUserSettings.email,
      avatar: typeof parsed.avatar === "string" && parsed.avatar ? parsed.avatar : defaultUserSettings.avatar,
    };
  } catch {
    return defaultUserSettings;
  }
}

export function saveUserSettings(settings: UserSettings) {
  window.localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(USER_SETTINGS_EVENT, { detail: settings }));
}

import type { Language } from '../locales';

const THEME_KEY = 'tmd-simulator-theme';
const LANGUAGE_KEY = 'tmd-simulator-language';

export type Theme = 'light' | 'dark';

export const storage = {
  getTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  },

  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  getLanguage(): Language | null {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored === 'ja' || stored === 'en') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  },

  setLanguage(language: Language): void {
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

export function getSystemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

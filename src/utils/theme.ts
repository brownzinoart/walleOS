export type Theme = 'light' | 'dark';
export type ThemeListener = (theme: Theme, previousTheme: Theme) => void;

const THEME_STORAGE_KEY = 'walleos-theme';
const DEFAULT_THEME: Theme = 'dark';

let currentTheme: Theme = DEFAULT_THEME;
const listeners = new Set<ThemeListener>();

function notifyListeners(previousTheme: Theme): void {
  listeners.forEach((listener) => {
    listener(currentTheme, previousTheme);
  });
}

export function getTheme(): Theme {
  return currentTheme;
}

function applyTheme(theme: Theme, persist: boolean): void {
  // Short-circuit if the requested theme is already active.
  // Mirrors the no-op behavior in chat state's setState.
  if (theme === currentTheme) {
    return;
  }

  const previous = currentTheme;
  currentTheme = theme;

  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore persistence errors
    }
  }

  notifyListeners(previous);
}

export function setTheme(theme: Theme): void {
  applyTheme(theme, true);
}

export function toggleTheme(): void {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

// Helper to detect the system's preferred color scheme.
// Returns 'dark' if a dark color scheme is preferred, otherwise 'light'.
export function getSystemPreferredTheme(): Theme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  // Fallback for non-browser environments
  return DEFAULT_THEME;
}

export function initTheme(): void {
  let themeToUse: Theme | null = null;
  let foundInStorage = false;

  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        themeToUse = stored;
        foundInStorage = true;
      }
    } catch {
      // ignore storage access errors
    }

    if (!themeToUse) {
      themeToUse = getSystemPreferredTheme();
    }
  }

  if (!themeToUse) themeToUse = DEFAULT_THEME;

  if (foundInStorage) {
    applyTheme(themeToUse, false);
  } else {
    setTheme(themeToUse);
  }
}

export function subscribeToTheme(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'sakura';
type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes = {
  indigo: {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',
  },
  emerald: {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
  },
  rose: {
    primary: '#f43f5e',
    primaryLight: '#fb7185',
    primaryDark: '#e11d48',
  },
  amber: {
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
  },
  cyan: {
    primary: '#06b6d4',
    primaryLight: '#22d3ee',
    primaryDark: '#0891b2',
  },
  purple: {
    primary: '#a855f7',
    primaryLight: '#c084fc',
    primaryDark: '#9333ea',
  },
  sakura: {
    primary: '#ff8da1',
    primaryLight: '#ffb7c5',
    primaryDark: '#e56f84',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'indigo';
  });

  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('app-mode');
    return (saved as Mode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    const colors = themes[theme];

    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--primary-light', colors.primaryLight);
    document.documentElement.style.setProperty('--primary-dark', colors.primaryDark);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-mode', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppTheme } from '../types';
import { BUILT_IN_THEMES } from '../constants';
import { generateUUID } from '../utils';
import { updateStatusBarStyle, updateStatusBarColor, isColorDark } from '../capacitorInit';

interface ThemeContextType {
  activeThemeId: string;
  customThemes: AppTheme[];
  allThemes: AppTheme[];
  setActiveTheme: (id: string) => void;
  addTheme: (theme: Omit<AppTheme, 'id' | 'isBuiltIn'>) => void;
  updateTheme: (id: string, updates: Partial<AppTheme>) => void;
  deleteTheme: (id: string) => void;
  restoreThemes: (themes: AppTheme[]) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state directly from localStorage to prevent overwriting on mount
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('mune_active_theme_id');
    return saved || 'default';
  });

  const [customThemes, setCustomThemes] = useState<AppTheme[]>(() => {
    try {
      const saved = localStorage.getItem('mune_custom_themes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse custom themes on init", e);
      return [];
    }
  });

  // Save to Storage
  useEffect(() => {
    localStorage.setItem('mune_active_theme_id', activeThemeId);
  }, [activeThemeId]);

  useEffect(() => {
    localStorage.setItem('mune_custom_themes', JSON.stringify(customThemes));
  }, [customThemes]);

  const allThemes = [...BUILT_IN_THEMES, ...customThemes];

  // Apply Theme Variables
  useEffect(() => {
    const theme = allThemes.find(t => t.id === activeThemeId) || BUILT_IN_THEMES[0];
    const root = document.documentElement;

    // Helper to convert Hex to RGB numbers (e.g. #ff0000 -> "255 0 0")
    // Tailwind v4 variable system expects pure space-separated numbers if using rgb(var(...))
    // BUT my current index.css setup uses: --color-app: rgb(var(--app-bg));
    // So --app-bg MUST be "R G B".
    // Wait, my constants.ts has Hex codes.
    // I need a hexToRgbString helper.

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r} ${g} ${b}`;
    };

    root.style.setProperty('--app-bg', hexToRgb(theme.colors.appBg));
    root.style.setProperty('--card-bg', hexToRgb(theme.colors.cardBg));
    root.style.setProperty('--card-hover', hexToRgb(theme.colors.cardHover));
    root.style.setProperty('--border-color', hexToRgb(theme.colors.border));
    
    root.style.setProperty('--text-main', hexToRgb(theme.colors.textMain));
    root.style.setProperty('--text-muted', hexToRgb(theme.colors.textMuted));
    root.style.setProperty('--text-dim', hexToRgb(theme.colors.textDim));
    
    root.style.setProperty('--primary', hexToRgb(theme.colors.primary));
    root.style.setProperty('--primary-hover', hexToRgb(theme.colors.primaryHover));
    root.style.setProperty('--primary-active', hexToRgb(theme.colors.primaryActive));
    
    root.style.setProperty('--text-accent', hexToRgb(theme.colors.textAccent));
    root.style.setProperty('--on-primary', hexToRgb(theme.colors.onPrimary));
    
    root.style.setProperty('--success', hexToRgb(theme.colors.success));
    root.style.setProperty('--error', hexToRgb(theme.colors.error));

    // Meta Theme Color
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.appBg);

    // Update status bar style based on theme brightness (Android)
    const isDark = isColorDark(theme.colors.appBg);
    updateStatusBarStyle(isDark);
    
    // Update status bar background color to match the theme's card color
    updateStatusBarColor(theme.colors.cardBg);

  }, [activeThemeId, customThemes]);

  const addTheme = (data: Omit<AppTheme, 'id' | 'isBuiltIn'>) => {
    const newTheme: AppTheme = {
      ...data,
      id: generateUUID(),
      isBuiltIn: false
    };
    setCustomThemes(prev => [...prev, newTheme]);
    setActiveThemeId(newTheme.id);
  };

  const updateTheme = (id: string, updates: Partial<AppTheme>) => {
    setCustomThemes(prev => {
      return prev.map(t => {
        if (t.id !== id) return t;
        
        return {
            ...t,
            name: updates.name || t.name,
            colors: updates.colors ? { ...t.colors, ...updates.colors } : t.colors
        };
      });
    });
  };

  const deleteTheme = (id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id));
    if (activeThemeId === id) {
      setActiveThemeId('default');
    }
  };

  const restoreThemes = (themes: AppTheme[]) => {
    // Filter out potential built-in duplicates if user modified them manually in JSON
    const validCustom = themes.filter(t => !t.isBuiltIn);
    setCustomThemes(validCustom);
  };

  return (
    <ThemeContext.Provider value={{ activeThemeId, customThemes, allThemes, setActiveTheme: setActiveThemeId, addTheme, updateTheme, deleteTheme, restoreThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

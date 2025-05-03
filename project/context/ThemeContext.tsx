import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  colors: {
    background: '#ECEFF5',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#555555',
    border: '#E0E0E0',
    primary: '#36454F',
    secondary: '#FFD800',
    accent: '#4CAF50',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  },
});

export const useTheme = () => useContext(ThemeContext);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');

  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');

  const colors = {
    // Light theme colors by default
    background: isDark ? '#121212' : '#ECEFF5',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#555555',
    border: isDark ? '#333333' : '#E0E0E0',
    primary: isDark ? '#4C566A' : '#36454F',
    secondary: '#FFD800', // Same in both themes
    accent: '#4CAF50', // Same in both themes
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
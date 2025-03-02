import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: ThemeMode;
  currentTheme: 'light' | 'dark';
  colors: typeof import('../constants/Colors').default['light'];
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'system',
  currentTheme: 'light',
  colors: require('../constants/Colors').default.light,
  setTheme: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'onetime_authenticator_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme() || 'light';
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load saved theme from storage on initial render
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeState(savedTheme as ThemeMode);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load theme from storage:', error);
        setIsInitialized(true);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme to storage when it changes
  const setTheme = async (newTheme: ThemeMode) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Determine the current theme based on theme setting and device theme
  const currentTheme = theme === 'system' ? deviceTheme : theme;
  
  // Get the colors for the current theme
  const Colors = require('../constants/Colors').default;
  const colors = Colors[currentTheme];
  
  if (!isInitialized) {
    // Return a minimal loading state or placeholder
    return null;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, currentTheme, colors, setTheme, toggleTheme }}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

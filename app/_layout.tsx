import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n'; // Initialize i18n
import { useTheme } from '../context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

// Keep the splash screen visible while initializing
SplashScreen.preventAutoHideAsync();

// Create a safe global variable to check for web platform
declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Create a wrapper component to properly use the useTheme hook
function StackNavigator() {
  const { currentTheme } = useTheme();
  const colors = currentTheme === 'dark' 
    ? require('../constants/Colors').default.dark 
    : require('../constants/Colors').default.light;
  
  useEffect(() => {
    // Handle app initialization
    const initialize = async () => {
      try {
        // Make sure i18n is loaded
        const LANGUAGE_STORAGE_KEY = 'onetime_authenticator_language';
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage);
        }

        // Hide splash screen after initialization
        await SplashScreen.hideAsync();
        
        // Handle web-specific initialization (with safe checks)
        if (Platform.OS === 'web') {
          // Safe check for window
          if (typeof window !== 'undefined') {
            try {
              // Use setTimeout to ensure this runs after other initialization
              setTimeout(() => {
                // Only access window.frameworkReady if it exists
                if (window.frameworkReady && typeof window.frameworkReady === 'function') {
                  window.frameworkReady();
                }
              }, 0);
            } catch (e) {
              console.warn('Error calling frameworkReady:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        await SplashScreen.hideAsync();
      }
    };

    initialize();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        <Stack.Screen 
          name="+not-found" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Not Found',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }} 
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <StackNavigator />
      </I18nextProvider>
    </ThemeProvider>
  );
}

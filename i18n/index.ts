import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translations
import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import it from './translations/it.json';
import pt from './translations/pt.json';
import ru from './translations/ru.json';
import zh from './translations/zh.json';
import ja from './translations/ja.json';
import ko from './translations/ko.json';
import ar from './translations/ar.json';
import hi from './translations/hi.json';
import tr from './translations/tr.json';
import nl from './translations/nl.json';
import pl from './translations/pl.json';
import sv from './translations/sv.json';
import vi from './translations/vi.json';
import th from './translations/th.json';
import id from './translations/id.json';
import uk from './translations/uk.json';
import esLA from './translations/es-LA.json';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'onetime_authenticator_language';

export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
  'es-LA': { name: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)' },
  fr: { name: 'French', nativeName: 'Français' },
  de: { name: 'German', nativeName: 'Deutsch' },
  it: { name: 'Italian', nativeName: 'Italiano' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  zh: { name: 'Chinese', nativeName: '中文' },
  ja: { name: 'Japanese', nativeName: '日本語' },
  ko: { name: 'Korean', nativeName: '한국어' },
  ar: { name: 'Arabic', nativeName: 'العربية' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  tr: { name: 'Turkish', nativeName: 'Türkçe' },
  nl: { name: 'Dutch', nativeName: 'Nederlands' },
  pl: { name: 'Polish', nativeName: 'Polski' },
  sv: { name: 'Swedish', nativeName: 'Svenska' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  th: { name: 'Thai', nativeName: 'ไทย' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  uk: { name: 'Ukrainian', nativeName: 'Українська' }
};

// Translation resources mapping
const translationResources = {
  en,
  es,
  'es-LA': esLA,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
  ja,
  ko,
  ar,
  hi,
  tr,
  nl,
  pl,
  sv,
  vi,
  th,
  id,
  uk
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: Object.keys(translationResources).reduce((acc, lang) => {
      acc[lang] = { translation: translationResources[lang as keyof typeof translationResources] };
      return acc;
    }, {} as Record<string, { translation: any }>),
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // This helps prevent issues during initial load
    },
    debug: false // Set to true for debugging i18n issues
  });

// Try to load saved language immediately
(async () => {
  try {
    // Get device language
    const deviceLanguage = Localization.locale.split('-')[0];
    
    // Load saved language preference or use device language
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const languageToUse = savedLanguage || deviceLanguage;
    
    // Check if the language is supported, otherwise fallback to English
    const isSupportedLanguage = Object.keys(LANGUAGES).includes(languageToUse);
    
    // Apply the language
    await i18n.changeLanguage(isSupportedLanguage ? languageToUse : 'en');
    console.log(`Language set to: ${i18n.language}`);
  } catch (error) {
    console.error('Failed to load language preference:', error);
    // Default to English on error
    await i18n.changeLanguage('en');
  }
})();

// Function to change language
export const changeLanguage = async (language: string) => {
  try {
    if (!language) {
      console.error('Invalid language code');
      return;
    }

    // Check if language actually changed
    if (language === i18n.language) {
      console.log('Language already set to:', language);
      return;
    }

    // Save to AsyncStorage first to ensure persistence
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // Then change the language in i18n
    await i18n.changeLanguage(language);
    
    console.log(`Language changed and saved: ${language}`);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Export the initialized i18n instance
export default i18n;

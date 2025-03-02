import React, { useState, forwardRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  FlatList, 
  Modal,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGES, changeLanguage } from '../i18n';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'onetime_authenticator_language';

const LanguageSelector = forwardRef<View, {}>((props, ref) => {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t, i18n } = useTranslation();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Update the current language when i18n.language changes
    setCurrentLanguage(i18n.language);

    // Load the saved language from storage when component mounts
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && savedLanguage !== i18n.language) {
          // If there's a mismatch between saved language and current i18n language,
          // update the i18n language
          await changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };

    loadSavedLanguage();
  }, [i18n.language]);

  const languageEntries = Object.entries(LANGUAGES).map(([code, names]) => ({
    code,
    name: names.name,
    nativeName: names.nativeName
  }));

  const handleSelectLanguage = async (langCode: string) => {
    if (langCode === currentLanguage) {
      setModalVisible(false);
      return;
    }

    setIsLoading(true);
    try {
      await changeLanguage(langCode);
      setCurrentLanguage(langCode);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  const renderLanguageItem = ({ item }: { item: { code: string, name: string, nativeName: string } }) => (
    <Pressable
      style={[
        styles.languageItem,
        item.code === currentLanguage && {
          backgroundColor: colors.tint + '15'
        }
      ]}
      onPress={() => handleSelectLanguage(item.code)}
    >
      <View style={styles.languageItemContent}>
        <Text style={[styles.languageName, { color: colors.text }]}>
          {item.nativeName}
        </Text>
        <Text style={[styles.languageNativeName, { color: colors.secondaryText }]}>
          {item.name}
        </Text>
      </View>
      
      {item.code === currentLanguage && (
        <Check size={20} color={colors.tint} />
      )}
    </Pressable>
  );

  return (
    <View ref={ref}>
      <Pressable
        style={[styles.selector, { backgroundColor: colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Text style={[styles.selectorLabel, { color: colors.text }]}>
            {t('settings.language')}
          </Text>
          <View style={styles.selectorValueContainer}>
            <Text style={[styles.selectorValue, { color: colors.secondaryText }]}>
              {LANGUAGES[currentLanguage]?.nativeName || 'English'}
            </Text>
            <ChevronDown size={16} color={colors.tabIconDefault} />
          </View>
        </View>
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color={colors.tabIconDefault} />
            </Pressable>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {t('settings.changingLanguage', 'Changing language...')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={languageEntries}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  selector: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.md,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectorValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorValue: {
    marginRight: 8,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  languageList: {
    flex: 1,
    padding: Layout.spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.sm,
  },
  languageItemContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  languageNativeName: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  }
});

export default LanguageSelector;

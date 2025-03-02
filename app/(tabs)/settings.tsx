import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Switch, 
  Alert, 
  ScrollView,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Cloud, Lock, Archive, Database, CircleAlert as AlertCircle, Info, Shield, Smartphone, QrCode, Download, ScanLine as LucideScanLine } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/LanguageSelector';
import ThemeToggle from '../../components/ThemeToggle';
import TokenImporter from '../../components/TokenImporter';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { 
  isEncryptedStorageEnabled, 
  setEncryptedStorage,
  exportAccounts,
  importAccounts
} from '../../utils/storage';

// Conditionally import native modules
let Sharing: any = null;
let FileSystem: any = null;
let DocumentPicker: any = null;

if (Platform.OS !== 'web') {
  try {
    // Using require instead of import for conditional loading
    Sharing = require('expo-sharing');
    FileSystem = require('expo-file-system');
    DocumentPicker = require('expo-document-picker');
  } catch (error) {
    console.warn('Native modules not available:', error);
  }
}

export default function SettingsScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportInput, setShowImportInput] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  
  useEffect(() => {
    (async () => {
      const isEnabled = await isEncryptedStorageEnabled();
      setEncryptionEnabled(isEnabled);
    })();
  }, []);
  
  const handleEncryptionToggle = async (value: boolean) => {
    try {
      await setEncryptedStorage(value);
      setEncryptionEnabled(value);
      
      if (value) {
        Alert.alert(
          t('settings.encryptionEnabled'),
          t('settings.encryptionEnabledDesc')
        );
      } else {
        Alert.alert(
          t('settings.encryptionDisabled'),
          t('settings.encryptionDisabledDesc')
        );
      }
    } catch (error) {
      console.error('Error toggling encryption:', error);
      Alert.alert(t('common.error'), t('settings.encryptionError'));
    }
  };
  
  const handleExportData = async () => {
    try {
      const backupPath = await exportAccounts();
      
      if (!backupPath) {
        throw new Error('Failed to export accounts');
      }
      
      if (Platform.OS === 'web') {
        // Web handling
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(backupPath)}`;
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', 'onetime_authenticator_backup.json');
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else if (Sharing && await Sharing.isAvailableAsync()) {
        // iOS/Android handling
        await Sharing.shareAsync(backupPath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Onetime Authenticator Data',
          UTI: 'public.json'
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('settings.exportFailed'));
    }
  };
  
  const handleImportData = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web handling
        setShowImportInput(true);
      } else if (DocumentPicker) {
        // iOS/Android handling
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true
        });
        
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const fileContent = await FileSystem.readAsStringAsync(asset.uri);
          const success = await importAccounts(fileContent);
          
          if (success) {
            setImportedCount(1); // We don't know exact count from file import
            setShowImportSuccess(true);
          } else {
            Alert.alert(t('settings.importFailed'), t('settings.importFailedDesc'));
          }
        }
      } else {
        Alert.alert(t('common.error'), t('settings.importUnavailable'));
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('settings.importError'), t('settings.importErrorDesc'));
    }
  };

  const handleOpenImporter = () => {
    setShowImporter(true);
  };

  const handleImportComplete = (count: number) => {
    setImportedCount(count);
    setShowImporter(false);
    setShowImportSuccess(true);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowImportSuccess(false);
    }, 3000);
  };

  const submitImport = async () => {
    if (importText) {
      try {
        const success = await importAccounts(importText);
        if (success) {
          Alert.alert(t('settings.importSuccess'), t('settings.importSuccessDesc'));
          setShowImportInput(false);
          setImportText('');
        } else {
          Alert.alert(t('settings.importFailed'), t('settings.importFailedDesc'));
        }
      } catch (error) {
        Alert.alert(t('settings.importError'), t('settings.importErrorDesc'));
      }
    } else {
      Alert.alert(t('settings.emptyData'), t('settings.emptyDataDesc'));
    }
  };
  
  if (showImportInput) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.importContainer}>
          <Text style={[styles.importTitle, { color: colors.text }]}>
            {t('settings.importTitle')}
          </Text>
          <Text style={[styles.importSubtitle, { color: colors.secondaryText }]}>
            {t('settings.importSubtitle')}
          </Text>
          <TextInput
            style={[
              styles.importInput,
              { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
              }
            ]}
            multiline={true}
            numberOfLines={10}
            value={importText}
            onChangeText={setImportText}
            placeholder={t('settings.importPlaceholder')}
            placeholderTextColor={colors.tabIconDefault}
          />
          <View style={styles.importButtons}>
            <Pressable
              style={[
                styles.importButton,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={() => {
                setShowImportInput(false);
                setImportText('');
              }}
            >
              <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.importButton,
                { backgroundColor: colors.tint }
              ]}
              onPress={submitImport}
            >
              <Text style={{ color: colors.buttonText }}>{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Import Success Notification */}
      {showImportSuccess && (
        <View style={[styles.successNotification, { backgroundColor: colors.success }]}>
          <Text style={styles.successNotificationText}>
            {importedCount === 1 
              ? t('importAccounts.importCompleteSingle')
              : t('importAccounts.importCompleteMultiple', { count: importedCount })}
          </Text>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.appearance')}
          </Text>
          
          <ThemeToggle />
          
          <LanguageSelector />
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.securitySection')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Lock size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('settings.encryptedStorage')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('settings.encryptedStorageDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={encryptionEnabled}
              onValueChange={handleEncryptionToggle}
              trackColor={{ false: '#767577', true: colors.tint + '70' }}
              thumbColor={encryptionEnabled ? colors.tint : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.backupRestore')}
          </Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleExportData}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Cloud size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('settings.cloudBackup')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('settings.cloudBackupDesc')}
                </Text>
              </View>
            </View>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleExportData}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Archive size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('settings.exportTokens')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('settings.exportTokensDesc')}
                </Text>
              </View>
            </View>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleImportData}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Database size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('settings.importTokens')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('settings.importTokensDesc')}
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.settingItem,
              { backgroundColor: colors.card },
              pressed && { opacity: 0.9 }
            ]}
            onPress={handleOpenImporter}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <LucideScanLine size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('tokenImporter.title', 'Scan & Import Tokens')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('tokenImporter.description', 'Import tokens using QR codes, files, or text')}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings.aboutSection')}
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Shield size={22} color={colors.tint} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Onetime Authenticator
                </Text>
                <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>
                  {t('settings.version')} 1.0.0
                </Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.infoBox, { backgroundColor: colors.card + '80' }]}>
            <Info size={20} color={colors.tabIconDefault} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {t('settings.aboutText')}
            </Text>
          </View>
          
          <View style={[styles.warningBox, { backgroundColor: colors.warning + '15' }]}>
            <AlertCircle size={20} color={colors.warning} style={styles.infoIcon} />
            <Text style={[styles.warningText, { color: colors.text }]}>
              {t('settings.warningText')}
            </Text>
          </View>
        </View>
      </View>

      {/* Token Importer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showImporter}
        onRequestClose={() => setShowImporter(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <TokenImporter 
            onClose={() => setShowImporter(false)}
            onImportComplete={handleImportComplete}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // More padding at bottom for tab bar
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    ...Layout.shadows.small,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  importContainer: {
    padding: 20,
  },
  importTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  importSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  importInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  importButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  importButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  successNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 100,
  },
  successNotificationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  }
});

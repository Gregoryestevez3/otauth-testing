import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Alert,
  Platform,
  Linking 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Smartphone, QrCode, CircleAlert, Info } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import AddAccountManual from '../../components/AddAccountManual';
import QRCodeScanner from '../../components/QRCodeScanner';
import { addAccount } from '../../utils/storage';
import { parseOTPAuthURL } from '../../utils/otp';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { isScannerModuleAvailable } from '../../utils/scannerUtils';

export default function AddScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const { t } = useTranslation();
  
  const [scanning, setScanning] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [isWebPlatform] = useState(Platform.OS === 'web');
  const [cameraAvailable, setCameraAvailable] = useState(false);
  
  // Check if camera is available
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        // Simple check if camera is available on this platform/device
        const isAvailable = Platform.OS !== 'web' && isScannerModuleAvailable();
        setCameraAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking camera availability:', error);
        setCameraAvailable(false);
      }
    };
    
    checkCameraAvailability();
  }, []);
  
  const startScanning = () => {
    if (isWebPlatform) {
      setShowManualAdd(true);
      return;
    }
    
    if (cameraAvailable) {
      setScanning(true);
    } else {
      Alert.alert(
        t('common.error'), 
        t('addAccount.cameraUnavailableDesc'),
        [{ text: t('common.ok'), onPress: () => setShowManualAdd(true) }]
      );
    }
  };
  
  const handleBarCodeScanned = async (data: string) => {
    setScanning(false);
    
    try {
      // Support both otpauth:// and otpauth-migration:// formats
      if (!data.startsWith('otpauth://') && !data.startsWith('otpauth-migration://')) {
        Alert.alert(t('qrScanner.invalidQrCode'), t('qrScanner.invalidQrCodeDesc'));
        return;
      }
      
      const accountData = parseOTPAuthURL(data);
      
      if (accountData) {
        const newAccount = await addAccount(accountData);
        Alert.alert(
          t('accountAdded.title'),
          t('accountAdded.message', { issuer: accountData.issuer }),
          [{ text: t('common.ok'), onPress: () => router.navigate('/') }]
        );
      } else {
        Alert.alert(t('qrScanner.invalidQrCode'), t('qrScanner.invalidQrCodeDesc'));
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(t('qrScanner.errorProcessingQr'), t('qrScanner.errorProcessingQrDesc'));
    }
  };
  
  const handleManualAdd = async (accountData: {
    name: string;
    issuer: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }) => {
    try {
      const newAccount = await addAccount(accountData);
      setShowManualAdd(false);
      Alert.alert(
        t('accountAdded.title'),
        t('accountAdded.message', { issuer: accountData.issuer }),
        [{ text: t('common.ok'), onPress: () => router.navigate('/') }]
      );
    } catch (error) {
      console.error('Error adding account manually:', error);
      Alert.alert(t('common.error'), t('manualAdd.invalidSecret'));
    }
  };
  
  const openSettings = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Linking.openSettings();
    }
  };
  
  // Show QR scanner screen
  if (scanning) {
    return (
      <QRCodeScanner
        onScan={handleBarCodeScanned}
        onCancel={() => setScanning(false)}
        title={t('addAccount.scanQrCodeTitle')}
        instruction={t('qrScanner.scanQrCodeInstructions')}
      />
    );
  }
  
  // Show manual entry screen
  if (showManualAdd) {
    return (
      <AddAccountManual 
        onCancel={() => setShowManualAdd(false)} 
        onAdd={handleManualAdd} 
      />
    );
  }
  
  // Main screen with options
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('addAccount.addNewAccount')}
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          {t('addAccount.chooseAddMethod')}
        </Text>
        
        {/* Web platform notice */}
        {isWebPlatform && (
          <View style={[styles.infoBox, { backgroundColor: colors.tint + '15' }]}>
            <Info size={24} color={colors.tint} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBoxTitle, { color: colors.text }]}>
                {t('addAccount.qrWebUnavailable')}
              </Text>
              <Text style={[styles.infoBoxText, { color: colors.secondaryText }]}>
                {t('addAccount.qrWebDescription')}
              </Text>
            </View>
          </View>
        )}
        
        {/* Camera not available notice */}
        {!isWebPlatform && !cameraAvailable && (
          <View style={[styles.infoBox, { backgroundColor: colors.warning + '15' }]}>
            <CircleAlert size={24} color={colors.warning} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBoxTitle, { color: colors.text }]}>
                {t('addAccount.cameraUnavailable')}
              </Text>
              <Text style={[styles.infoBoxText, { color: colors.secondaryText }]}>
                {t('addAccount.cameraUnavailableDesc')}
              </Text>
            </View>
          </View>
        )}
        
        {/* Option cards */}
        <View style={styles.optionsContainer}>
          {/* QR Code scanning option */}
          <Pressable
            style={[
              styles.option, 
              { 
                backgroundColor: colors.card,
                opacity: (isWebPlatform || !cameraAvailable) ? 0.6 : 1
              }
            ]}
            onPress={startScanning}
            disabled={isWebPlatform || !cameraAvailable}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
              <Camera size={32} color={colors.tint} />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {t('addAccount.scanQrCodeTitle')}
            </Text>
            <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>
              {t('addAccount.scanQrCodeDesc')}
            </Text>
            {isWebPlatform && (
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledText}>{t('addAccount.notAvailableOnWeb')}</Text>
              </View>
            )}
            {!isWebPlatform && !cameraAvailable && (
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledText}>{t('addAccount.cameraUnavailable')}</Text>
              </View>
            )}
          </Pressable>
          
          {/* Manual entry option */}
          <Pressable
            style={[styles.option, { backgroundColor: colors.card }]}
            onPress={() => setShowManualAdd(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
              <Smartphone size={32} color={colors.tint} />
            </View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {t('addAccount.enterSetupKeyTitle')}
            </Text>
            <Text style={[styles.optionDescription, { color: colors.secondaryText }]}>
              {t('addAccount.enterSetupKeyDesc')}
            </Text>
          </Pressable>
        </View>
        
        <View style={[styles.infoContainer, { backgroundColor: colors.card + '80' }]}>
          <QrCode size={20} color={colors.tabIconDefault} />
          <Text style={[styles.infoText, { color: colors.secondaryText }]}>
            {t('addAccount.qrInfoText')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
    paddingBottom: 100, // Add padding for tab bar
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Layout.spacing.xl,
  },
  optionsContainer: {
    gap: 16,
  },
  option: {
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.lg,
    marginBottom: 16,
    ...Layout.shadows.small,
    position: 'relative',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.lg,
    alignItems: 'flex-start',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  disabledBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  disabledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  }
});

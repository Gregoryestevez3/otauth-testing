import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { parseOTPAuthURL } from '../utils/otp';
import { addAccount } from '../utils/storage';
import { X, CircleCheck as CheckCircle2, CircleAlert, Scan, Image as ImageIcon } from 'lucide-react-native';
import SimplifiedQRScanner from './SimplifiedQRScanner';
import PhotoQRScanner from './PhotoQRScanner';
import { LinearGradient } from 'expo-linear-gradient';

interface TokenImporterProps {
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

type ImportMethod = 'scan' | 'photo' | null;
type ImportState = 'initial' | 'scanning' | 'importing' | 'processing' | 'success' | 'error';

export default function TokenImporter({ onClose, onImportComplete }: TokenImporterProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [importState, setImportState] = useState<ImportState>('initial');
  const [errorMessage, setErrorMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  
  // Handle QR code scanning
  const handleScan = async (data: string) => {
    try {
      setImportState('processing');
      console.log("Processing QR data:", data.substring(0, 30) + "...");

      // Validate URL format first - support both formats
      if (!data.startsWith('otpauth://') && !data.startsWith('otpauth-migration://')) {
        console.log("Invalid QR code format:", data.substring(0, 30) + "...");
        setErrorMessage(t('qrScanner.invalidQrCodeDesc'));
        setImportState('error');
        return;
      }

      // Try to parse the OTP Auth URL
      let accountData;
      try {
        accountData = parseOTPAuthURL(data);
        console.log("Parsed account data:", accountData ? "Success" : "Failed");
      } catch (parseError) {
        console.error("Parse error:", parseError);
        if (parseError instanceof Error) {
          setErrorMessage(parseError.message);
        } else {
          setErrorMessage(t('qrScanner.errorProcessingQrDesc'));
        }
        setImportState('error');
        return;
      }

      // Validate parsed data
      if (!accountData) {
        console.error("No account data returned");
        setErrorMessage(t('qrScanner.invalidQrCodeDesc'));
        setImportState('error');
        return;
      }

      // Add the account
      await addAccount(accountData);
      setImportedCount(1);
      setImportState('success');
      
      // Call the onImportComplete callback
      if (onImportComplete) {
        onImportComplete(1);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setErrorMessage(t('qrScanner.errorProcessingQrDesc'));
      setImportState('error');
    }
  };
  
  const handleRetry = () => {
    setImportState('initial');
    setErrorMessage('');
  };
  
  const renderMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('importTokens.selectMethod')}
      </Text>
      
      <TouchableOpacity
        style={[styles.methodCard, { backgroundColor: colors.card }]}
        onPress={() => {
          setImportMethod('scan');
          setImportState('scanning');
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
          <Scan size={28} color={colors.tint} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={[styles.methodTitle, { color: colors.text }]}>
            {t('importTokens.scanQr')}
          </Text>
          <Text style={[styles.methodDescription, { color: colors.secondaryText }]}>
            {t('importTokens.scanQrDesc')}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.methodCard, { backgroundColor: colors.card }]}
        onPress={() => {
          setImportMethod('photo');
          setImportState('scanning');
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
          <ImageIcon size={28} color={colors.tint} />
        </View>
        <View style={styles.methodTextContainer}>
          <Text style={[styles.methodTitle, { color: colors.text }]}>
            {t('importTokens.choosePhoto')}
          </Text>
          <Text style={[styles.methodDescription, { color: colors.secondaryText }]}>
            {t('importTokens.choosePhotoDesc')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
  
  const renderScanner = () => {
    if (importMethod === 'scan') {
      return (
        <SimplifiedQRScanner 
          onScan={handleScan} 
          onCancel={() => setImportState('initial')}
        />
      );
    } else if (importMethod === 'photo') {
      return (
        <PhotoQRScanner 
          onScan={handleScan} 
          onCancel={() => setImportState('initial')}
        />
      );
    }
    return null;
  };
  
  const renderProcessing = () => (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.tint} />
      <Text style={[styles.stateTitle, { color: colors.text, marginTop: 24 }]}>
        {t('importTokens.processing')}
      </Text>
      <Text style={[styles.stateDescription, { color: colors.secondaryText }]}>
        {t('importTokens.processingDesc')}
      </Text>
    </View>
  );
  
  const renderSuccess = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconBg}>
        <LinearGradient
          colors={colors.gradient.success}
          style={styles.successGradient}
        >
          <CheckCircle2 size={40} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <Text style={[styles.stateTitle, { color: colors.text, marginTop: 24 }]}>
        {t('importTokens.success')}
      </Text>
      
      <Text style={[styles.stateDescription, { color: colors.secondaryText }]}>
        {t('importTokens.successDesc', { count: importedCount })}
      </Text>
      
      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: colors.tint }]}
        onPress={onClose}
      >
        <Text style={[styles.mainButtonText, { color: colors.buttonText }]}>
          {t('common.done')}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderError = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconBg}>
        <LinearGradient
          colors={colors.gradient.error}
          style={styles.successGradient}
        >
          <CircleAlert size={40} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <Text style={[styles.stateTitle, { color: colors.text, marginTop: 24 }]}>
        {t('importTokens.error')}
      </Text>
      
      <Text style={[styles.stateDescription, { color: colors.secondaryText }]}>
        {errorMessage || t('importTokens.errorDesc')}
      </Text>
      
      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: colors.tint }]}
        onPress={handleRetry}
      >
        <Text style={[styles.mainButtonText, { color: colors.buttonText }]}>
          {t('common.tryAgain')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={onClose}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderContent = () => {
    switch (importState) {
      case 'initial':
        return renderMethodSelection();
      case 'scanning':
        return renderScanner();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderMethodSelection();
    }
  };
  
  // Skip rendering header for scanning state to allow scanner UI to use full screen
  const shouldShowHeader = importState !== 'scanning';
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {shouldShowHeader && (
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('importTokens.title')}
          </Text>
          
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.card }]}
            onPress={onClose}
          >
            <X size={20} color={colors.text} />
          </Pressable>
        </View>
      )}
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContainer: {
    flex: 1,
    padding: Layout.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.xl,
  },
  methodCard: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.lg,
    padding: Layout.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Layout.shadows.small,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.lg,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  successGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  mainButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: Layout.borderRadius.large,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 16,
    ...Layout.shadows.small,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: Layout.borderRadius.large,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
});

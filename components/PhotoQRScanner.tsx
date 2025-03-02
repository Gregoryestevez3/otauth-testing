import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Image,
  ActivityIndicator, 
  SafeAreaView,
  Platform 
} from 'react-native';
import { X, Image as ImageIcon, CircleAlert } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { BarCodeScanner } from 'expo-barcode-scanner';

interface PhotoQRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export default function PhotoQRScanner({ onScan, onCancel }: PhotoQRScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pickImage = async () => {
    try {
      setError(null);
      
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError(t('importTokens.photoPermissionDenied'));
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(selectedImage.uri);
        scanQRCode(selectedImage.uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError(t('importTokens.photoError'));
    }
  };
  
  const scanQRCode = async (imageUri: string) => {
    try {
      setScanning(true);
      setError(null);
      
      // On web, we'd need a different approach since expo-barcode-scanner's image scanning
      // doesn't work on web. For native platforms, we can use the following:
      if (Platform.OS !== 'web') {
        const scannedResults = await BarCodeScanner.scanFromURLAsync(imageUri, [BarCodeScanner.Constants.BarCodeType.qr]);
        
        if (scannedResults.length > 0) {
          const qrData = scannedResults[0].data;
          
          // Check if it's a valid OTP auth URL
          if (qrData.startsWith('otpauth://') || qrData.startsWith('otpauth-migration://')) {
            setScanning(false);
            // Call the onScan callback with the QR code data
            onScan(qrData);
          } else {
            setScanning(false);
            setError(t('qrScanner.invalidQrCodeDesc'));
          }
        } else {
          setScanning(false);
          setError(t('importTokens.noQrFound'));
        }
      } else {
        // On web, we'd need a web-compatible QR scanner library
        setScanning(false);
        setError(t('importTokens.webNotSupported'));
      }
    } catch (err) {
      console.error('Error scanning QR code from image:', err);
      setScanning(false);
      setError(t('importTokens.scanError'));
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.card }]}
          onPress={onCancel}
        >
          <X size={20} color={colors.text} />
        </Pressable>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('importTokens.selectPhoto')}
        </Text>
        
        <View style={{ width: 44 }} />
      </View>
      
      <View style={styles.content}>
        {scanning ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              {t('importTokens.scanningQr')}
            </Text>
          </View>
        ) : image ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <CircleAlert size={20} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              </View>
            )}
            
            <Pressable
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={pickImage}              onPress={pickImage}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('importTokens.selectDifferentPhoto')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.selectPhotoContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
              <ImageIcon size={48} color={colors.tint} />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>
              {t('importTokens.choosePhotoWithQr')}
            </Text>
            
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {t('importTokens.choosePhotoDescription')}
            </Text>
            
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <CircleAlert size={20} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
              </View>
            )}
            
            <Pressable
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={pickImage}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('importTokens.selectFromGallery')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  selectPhotoContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  imagePreviewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: 280,
    height: 280,
    borderRadius: 16,
    marginBottom: 24,
  },
});

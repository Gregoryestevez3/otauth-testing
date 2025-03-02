import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { X, CircleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { getCameraPermission, requestCameraPermission } from '../utils/scannerUtils';
import NativeCameraScanner from './NativeCameraScanner';

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export default function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  // On mount, check camera permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsLoading(true);
        
        // Skip web platform
        if (Platform.OS === 'web') {
          setCameraPermission(false);
          setIsLoading(false);
          return;
        }
        
        // Check for camera permission
        const permission = await getCameraPermission();
        setCameraPermission(permission);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCameraPermission(false);
        setIsLoading(false);
      }
    };
    
    checkPermissions();
  }, []);
  
  // Request camera permission
  const requestPermission = async () => {
    try {
      const permission = await requestCameraPermission();
      setCameraPermission(permission);
    } catch (error) {
      console.error('Error requesting permission:', error);
      setCameraPermission(false);
    }
  };
  
  // Show loading indicator while initializing
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }
  
  // Show permission request screen
  if (cameraPermission === false && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('addAccount.scanQrCodeTitle')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.content}>
          <CircleAlert size={60} color={colors.error} style={styles.errorIcon} />
          
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {t('addAccount.cameraAccessDenied')}
          </Text>
          
          <Text style={[styles.errorDescription, { color: colors.secondaryText }]}>
            {t('addAccount.cameraPermissionDesc')}
          </Text>
          
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={requestPermission}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('addAccount.openSettings')}
              </Text>
            </Pressable>
            
            <Pressable
              style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t('manualAdd.tryManualEntry')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
  
  // For web, show unavailable message
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onCancel}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('addAccount.scanQrCodeTitle')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.content}>
          <CircleAlert size={60} color={colors.warning} style={styles.errorIcon} />
          
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {t('addAccount.qrWebUnavailable')}
          </Text>
          
          <Text style={[styles.errorDescription, { color: colors.secondaryText }]}>
            {t('addAccount.qrWebDescription')}
          </Text>
          
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('manualAdd.tryManualEntry')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  // Show camera scanner if permissions granted
  if (cameraPermission === true) {
    return (
      <View style={styles.container}>
        <NativeCameraScanner onScan={onScan} onCancel={onCancel} />
      </View>
    );
  }
  
  // Fallback - show camera unavailable message
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('addAccount.scanQrCodeTitle')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.content}>
        <CircleAlert size={60} color={colors.error} style={styles.errorIcon} />
        
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          {t('addAccount.cameraUnavailable')}
        </Text>
        
        <Text style={[styles.errorDescription, { color: colors.secondaryText }]}>
          {t('addAccount.cameraUnavailableDesc')}
        </Text>
        
        <Pressable
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={onCancel}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {t('manualAdd.tryManualEntry')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '80%',
    maxWidth: 280,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { X, FlashlightOff, Flashlight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SimplifiedQRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export default function SimplifiedQRScanner({ onScan, onCancel }: SimplifiedQRScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const scannerSize = Math.min(280, SCREEN_WIDTH * 0.7);
  
  // Animation value
  const scanFrameAnimation = useSharedValue(1);
  const scanLinePosition = useSharedValue(0);
  
  // Request permissions on mount
  useEffect(() => {
    const getPermission = async () => {
      if (!permission) {
        await requestPermission();
      }
    };
    
    getPermission();
  }, [permission, requestPermission]);
  
  // Start animations
  useEffect(() => {
    // Animate scan frame
    scanFrameAnimation.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500 }),
        withTiming(0.97, { duration: 1500 })
      ),
      -1,
      true
    );
    
    // Animate scan line
    scanLinePosition.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);
  
  // Handle barcode scan
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    // We want to handle both otpauth:// and otpauth-migration:// formats
    if (data.startsWith('otpauth://') || data.startsWith('otpauth-migration://')) {
      onScan(data);
    }
  };
  
  // Animation styles
  const scanFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanFrameAnimation.value }],
  }));
  
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: scanLinePosition.value * (scannerSize - 2),
      },
    ],
    opacity: scanLinePosition.value < 0.1 || scanLinePosition.value > 0.9 ? 0.5 : 1,
  }));
  
  // Check if permission was not granted
  if (permission && !permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('camera.permissionRequired')}
          </Text>
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            {t('camera.permissionMessage')}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={requestPermission}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('common.grant')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={handleBarCodeScanned}
        flash={flashOn ? 'torch' : 'off'}
        ratio="16:9"
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topControls}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={onCancel}
            >
              <X size={24} color="#fff" />
            </Pressable>
            
            <Pressable
              style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={() => setFlashOn(!flashOn)}
            >
              {flashOn ? (
                <Flashlight size={24} color="#fff" />
              ) : (
                <FlashlightOff size={24} color="#fff" />
              )}
            </Pressable>
          </View>
          
          <View style={styles.scannerContainer}>
            <Animated.View 
              style={[
                styles.scanFrame,
                { width: scannerSize, height: scannerSize },
                scanFrameStyle
              ]}
            >
              {/* Scan line */}
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
              
              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </Animated.View>
          </View>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              {t('camera.positionQRCode')}
            </Text>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 2,
    backgroundColor: '#5E6AD2',
    zIndex: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  instructions: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

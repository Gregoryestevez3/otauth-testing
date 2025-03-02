import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

// Define camera constants
const CAMERA_TYPES = {
  BACK: 'back',
  FRONT: 'front'
};

const FLASH_MODES = {
  OFF: 'off',
  ON: 'on',
  AUTO: 'auto',
  TORCH: 'torch'
};

interface NativeCameraScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;  // Make this optional with a clear type
}

export default function NativeCameraScanner({ onScan, onCancel }: NativeCameraScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();

  const [zoom, setZoom] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);

  const [cameraDirection, setCameraDirection] = useState(CAMERA_TYPES.BACK);

  // Check permissions on mount
  useEffect(() => {
    const checkPermission = async () => {
      // Skip if not on a native platform
      if (Platform.OS === 'web') {
        setHasPermission(false);
        return;
      }

      try {
        const { status } = await Camera.getCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error checking camera permission:', error);
        setHasPermission(false);
      }
    };

    checkPermission();
  }, []);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanning) return;
    
    // Only handle QR codes with otpauth URIs
    if (data && data.startsWith('otpauth://')) {
      setScanning(false);
      onScan(data);
    }
  };

  // Safe handler for cancel button
  const handleCancel = () => {
    // Use optional chaining to safely call onCancel if it exists
    onCancel?.();
  };

  // Zoom controls
  const zoomIn = () => setZoom(Math.min(zoom + 0.1, 0.5));
  const zoomOut = () => setZoom(Math.max(zoom - 0.1, 0));

  // Switch between front and back camera
  const toggleCameraDirection = () => {
    setCameraDirection(cameraDirection === CAMERA_TYPES.BACK ? CAMERA_TYPES.FRONT : CAMERA_TYPES.BACK);
  };

  // Camera not available on this platform
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          {onCancel && (
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={handleCancel}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          )}
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {t('addAccount.cameraUnavailableDesc')}
          </Text>
        </View>
      </View>
    );
  }

  // Permission not granted
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          {onCancel && (
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={handleCancel}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          )}
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {t('addAccount.cameraPermissionDesc')}
          </Text>
        </View>
      </View>
    );
  }

  // Loading state while checking permissions
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          {onCancel && (
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={handleCancel}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          )}
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // Get flash mode safely
  const flashMode = FLASH_MODES.AUTO;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Camera
        style={styles.camera}
        onCameraReady={() => setCameraReady(true)}
        zoom={zoom}
        cameraType={cameraDirection}
        flashMode={flashMode}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr']
        }}
      >
        <View style={styles.overlay}>
          {/* Close button */}
          {onCancel && (
            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={handleCancel}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          )}
          
          {/* Scanning frame */}
          <View style={styles.scannerFrame}>
            <View style={[styles.scanCorner, styles.topLeft]} />
            <View style={[styles.scanCorner, styles.topRight]} />
            <View style={[styles.scanCorner, styles.bottomLeft]} />
            <View style={[styles.scanCorner, styles.bottomRight]} />
          </View>

          {/* Instructions */}
          <View style={[styles.instructions, { backgroundColor: colors.background + 'CC' }]}>
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              {t('qrScanner.scanQrCodeInstructions', 'Position QR code in frame')}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable 
              style={[styles.controlButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={zoomOut}
              disabled={zoom <= 0}
            >
              <ZoomOut size={24} color={zoom <= 0 ? colors.tabIconDefault : colors.tint} />
            </Pressable>

            <Pressable 
              style={[styles.controlButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={toggleCameraDirection}
            >
              <RefreshCw size={24} color={colors.tint} />
            </Pressable>

            <Pressable 
              style={[styles.controlButton, { backgroundColor: colors.background + 'CC' }]}
              onPress={zoomIn}
              disabled={zoom >= 0.5}
            >
              <ZoomIn size={24} color={zoom >= 0.5 ? colors.tabIconDefault : colors.tint} />
            </Pressable>
          </View>
        </View>
      </Camera>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    position: 'absolute',
    bottom: 150,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

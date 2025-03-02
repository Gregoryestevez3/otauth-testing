import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

// Use dynamic import to avoid issues on web
let Camera = null;

// Only attempt to load Camera component on native platforms
if (Platform.OS !== 'web') {
  try {
    // Using require instead of import for conditional loading
    const CameraModule = require('expo-camera');
    Camera = CameraModule?.Camera;
  } catch (error) {
    console.warn('Failed to import Camera module:', error);
  }
}

interface ImportCameraScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export default function ImportCameraScanner({ onScan, onCancel }: ImportCameraScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();

  const [zoom, setZoom] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraType, setCameraType] = useState(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check if Camera is available
  const isCameraAvailable = !!Camera;

  // Initialize camera and check permissions on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Check if Camera module is available
        if (!isCameraAvailable) {
          console.warn('Camera module not available');
          setHasPermission(false);
          return;
        }
        
        // Check and set permission
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        
        // Set camera type safely
        if (Camera.Constants && Camera.Constants.Type) {
          setCameraType(Camera.Constants.Type.back);
        } else {
          // Fallback if constants aren't available
          setCameraType(0); // 0 is typically back camera
        }
      } catch (error) {
        console.error('Error initializing camera:', error);
        setHasPermission(false);
      }
    };
    
    initCamera();
  }, [isCameraAvailable]);

  // Reset scan cooldown
  useEffect(() => {
    if (lastScanned) {
      const timeout = setTimeout(() => {
        setLastScanned(null);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [lastScanned]);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    // Prevent multiple rapid scans of the same code
    if (lastScanned === data) {
      return;
    }
    
    setLastScanned(data);
    
    // Check if the scanned data is valid for importing
    if (data) {
      // QR codes could contain multiple otpauth URIs or be in JSON format
      // Pass it to the parent handler for processing
      onScan(data);
    }
  };

  // Zoom in camera view
  const zoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 0.5));
  };

  // Zoom out camera view
  const zoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0));
  };

  // Switch camera between front and back
  const toggleCameraType = () => {
    if (!Camera || !Camera.Constants || !Camera.Constants.Type) {
      return; // Safety check
    }
    
    setCameraType(current => 
      current === Camera.Constants.Type.back 
        ? Camera.Constants.Type.front 
        : Camera.Constants.Type.back
    );
  };

  // If Camera module isn't available, show error message
  if (!isCameraAvailable || Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          <Pressable 
            style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
            onPress={onCancel}
          >
            <X size={24} color={colors.text} />
          </Pressable>
          
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {Platform.OS === 'web' 
              ? t('addAccount.qrWebDescription') 
              : t('addAccount.cameraUnavailableDesc')}
          </Text>
          
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint, marginTop: 20 }]}
            onPress={onCancel}
          >
            <Text style={{ color: colors.buttonText, fontWeight: '600' }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // If permissions not granted, show message
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          <Pressable 
            style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
            onPress={onCancel}
          >
            <X size={24} color={colors.text} />
          </Pressable>
          
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {t('addAccount.cameraPermissionDesc')}
          </Text>
          
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint, marginTop: 20 }]}
            onPress={onCancel}
          >
            <Text style={{ color: colors.buttonText, fontWeight: '600' }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // If still checking permissions or camera not ready, show loading
  if (hasPermission !== true || cameraType === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.overlay}>
          <Pressable 
            style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
            onPress={onCancel}
          >
            <X size={24} color={colors.text} />
          </Pressable>
          
          <Text style={[styles.instructionsText, { color: colors.text }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  // At this point, we should have permission and camera type is initialized
  // Safely access flash mode with optional chaining
  const flashMode = Camera?.Constants?.FlashMode?.auto || 'auto';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Camera
        style={styles.camera}
        onCameraReady={() => setCameraReady(true)}
        zoom={zoom}
        type={cameraType}
        flashMode={flashMode}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr']
        }}
      >
        <View style={styles.overlay}>
          {/* Close button */}
          <Pressable 
            style={[styles.closeButton, { backgroundColor: colors.background + 'CC' }]}
            onPress={onCancel}
          >
            <X size={24} color={colors.text} />
          </Pressable>
          
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
              {t('importAccounts.scanQrCodeInstructions', 'Scan the export QR code from your authenticator app')}
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
              onPress={toggleCameraType}
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
    maxWidth: '80%',
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

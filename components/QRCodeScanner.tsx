import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Linking,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import {
  X,
  ZoomIn,
  ZoomOut,
  FlashlightOff,
  Flashlight,
  RotateCcw,
  Info,
  CircleCheck as CheckCircle2,
  CircleAlert,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  interpolate,
  Extrapolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Define our own constants instead of importing types
const CAMERA_TYPES = {
  BACK: 'back',
  FRONT: 'front',
};

const FLASH_MODES = {
  OFF: 'off',
  ON: 'on',
  AUTO: 'auto',
  TORCH: 'torch',
};

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;
  scanFilter?: (data: string) => boolean;
  title?: string;
  instruction?: string;
  scannerSize?: number;
}

export default function QRCodeScanner(props: QRCodeScannerProps) {
  // Destructure props safely with defaults
  const {
    onScan,
    onCancel,
    scanFilter = (data) => data.startsWith('otpauth://') || data.startsWith('otpauth-migration://'),
    title = 'Scan QR Code',
    instruction = 'Position the QR code within the frame',
    scannerSize = Math.min(280, SCREEN_WIDTH * 0.7),
  } = props || {};

  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();

  // Refs
  const cameraRef = useRef<Camera>(null);

  // Camera states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDirection, setCameraDirection] = useState(CAMERA_TYPES.BACK);
  const [zoom, setZoom] = useState(0);
  const [flashState, setFlashState] = useState(FLASH_MODES.OFF);
  const [isScanning, setIsScanning] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animation values
  const scanFrameAnimation = useSharedValue(1);
  const scanLinePosition = useSharedValue(0);
  const scannerOpacity = useSharedValue(1);
  const scanSuccessScale = useSharedValue(0);
  const scanErrorScale = useSharedValue(0);
  const scanPulse = useSharedValue(1);
  const infoVisible = useSharedValue(0);
  const tipTimer = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);

  // Check and request camera permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        if (Platform.OS === 'web') {
          setHasPermission(false);
          setIsInitializing(false);
          return;
        }

        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        setIsInitializing(false);
      } catch (error) {
        console.error('Error requesting camera permissions:', error);
        setHasPermission(false);
        setIsInitializing(false);
      }
    };

    getPermissions();

    // Show tips after a delay
    const tipTimerTimeout = setTimeout(() => {
      infoVisible.value = withTiming(1, { duration: 500 });
    }, 3000);

    return () => {
      clearTimeout(tipTimerTimeout);
    };
  }, []);

  // Start animations when camera is ready
  useEffect(() => {
    if (cameraReady) {
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
          withTiming(1, {
            duration: 2000,
            easing: Easing.bezierFn(0.42, 0, 0.58, 1),
          }),
          withTiming(0, {
            duration: 2000,
            easing: Easing.bezierFn(0.42, 0, 0.58, 1),
          })
        ),
        -1,
        true
      );

      // Periodically show tips
      tipTimer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [cameraReady]);

  // Handle QR code scanning
  const handleBarCodeScanned = useCallback(
    ({ type, data }: { type: string; data: string }) => {
      if (!isScanning || scanSuccess || scanError) return;

      // If scan filter provided, check the data
      if (scanFilter) {
        if (scanFilter(data)) {
          // Valid QR code
          showSuccessState(data);
        } else {
          // Invalid QR code
          showErrorState(t('qrScanner.invalidQrCodeDesc'));
        }
      } else {
        // No filter, accept all QR codes
        showSuccessState(data);
      }
    },
    [isScanning, scanSuccess, scanError, scanFilter, onScan, t]
  );

  // Show success state with animations
  const showSuccessState = useCallback(
    (data: string) => {
      setIsScanning(false);
      setScanSuccess(true);

      // Hide controls
      controlsOpacity.value = withTiming(0, { duration: 300 });

      // Animate success state
      scannerOpacity.value = withTiming(0.2, { duration: 200 });
      scanSuccessScale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
      });
      scanPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 400 }),
          withTiming(1.0, { duration: 400 })
        ),
        -1,
        true
      );

      // Delay to allow animation to show
      setTimeout(() => {
        if (typeof onScan === 'function') {
          onScan(data);
        }
      }, 1000);
    },
    [onScan]
  );

  // Show error state with animations
  const showErrorState = useCallback((message: string) => {
    setIsScanning(false);
    setScanError(true);
    setErrorMessage(message);

    // Hide controls
    controlsOpacity.value = withTiming(0, { duration: 300 });

    // Animate error state
    scannerOpacity.value = withTiming(0.2, { duration: 200 });
    scanErrorScale.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.back(1.5)),
    });

    // Auto-reset after delay
    setTimeout(() => {
      // Reset state
      setIsScanning(true);
      setScanError(false);
      setErrorMessage('');

      // Reset animations
      scannerOpacity.value = withTiming(1, { duration: 300 });
      scanErrorScale.value = withTiming(0, { duration: 300 });
      controlsOpacity.value = withTiming(1, { duration: 300 });
    }, 3000);
  }, []);

  // Safe cancel handler that doesn't depend on any navigation context
  const handleCancel = useCallback(() => {
    // Only call onCancel if it exists and is a function
    if (typeof onCancel === 'function') {
      onCancel();
    }
  }, [onCancel]);

  // Camera controls
  const toggleFlash = useCallback(() => {
    setFlashState((prev) =>
      prev === FLASH_MODES.OFF ? FLASH_MODES.TORCH : FLASH_MODES.OFF
    );
  }, []);

  const toggleCameraDirection = useCallback(() => {
    setCameraDirection((prev) =>
      prev === CAMERA_TYPES.BACK ? CAMERA_TYPES.FRONT : CAMERA_TYPES.BACK
    );
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 0.5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0));
  }, []);

  // Open settings
  const openSettings = useCallback(() => {
    if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  }, []);

  // Animation styles
  const scanFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanFrameAnimation.value }],
    opacity: scannerOpacity.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scanLinePosition.value,
          [0, 1],
          [0, scannerSize - 2],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      scanLinePosition.value,
      [0, 0.1, 0.5, 0.9, 1],
      [0.4, 0.9, 1, 0.9, 0.4],
      Extrapolate.CLAMP
    ),
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanSuccessScale.value }],
    opacity: scanSuccessScale.value,
  }));

  const errorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanErrorScale.value }],
    opacity: scanErrorScale.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanPulse.value }],
  }));

  const infoBoxStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      tipTimer.value * infoVisible.value,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          tipTimer.value * infoVisible.value,
          [0, 0.1, 0.9, 1],
          [10, 0, 0, 10],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  // Handle initializing state
  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.message, { color: colors.text, marginTop: 20 }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  // Handle permissions denied
  if (hasPermission === false) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.permissionContainer}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t('addAccount.cameraAccessDenied')}
          </Text>
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            {t('addAccount.cameraPermissionDesc')}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.tint,
                },
              ]}
              onPress={openSettings}
            >
              <Text style={[styles.buttonText, { color: colors.tint }]}>
                {t('addAccount.openSettings')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Handle web platform (camera not available)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.permissionContainer}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t('addAccount.qrWebUnavailable')}
          </Text>
          <Text style={[styles.message, { color: colors.secondaryText }]}>
            {t('addAccount.qrWebDescription')}
          </Text>
          <Pressable
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleCancel}
          >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Main scanner UI
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Only render Camera if we have permission */}
      {hasPermission === true && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          flash={flashState}
          onCameraReady={() => setCameraReady(true)}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          ratio="16:9"
          zoom={zoom}
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Header with title */}
            <View style={styles.header}>
              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
                onPress={handleCancel}
              >
                <X size={24} color="#fff" />
              </Pressable>

              <View style={styles.titleContainer}>
                <Text style={styles.scannerTitle}>{title}</Text>
              </View>

              <View style={{ width: 44 }} />
            </View>

            <View style={styles.scannerContainer}>
              {/* Info tip box that appears periodically */}
              <Animated.View style={[styles.infoBox, infoBoxStyle]}>
                <View style={styles.infoBoxContent}>
                  <Info                  size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.infoBoxText}>
                    {t('addAccount.qrInfoText')}
                  </Text>
                </View>
              </Animated.View>

              {/* Scanner frame */}
              <Animated.View
                style={[
                  styles.scanFrame,
                  { width: scannerSize, height: scannerSize },
                  scanFrameStyle,
                ]}
              >
                {/* Scan line */}
                <Animated.View style={[styles.scanLine, scanLineStyle]}>
                  <LinearGradient
                    colors={[
                      'rgba(94, 106, 210, 0.8)',
                      'rgba(79, 86, 210, 0.6)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.scanLineGradient}
                  />
                </Animated.View>

                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </Animated.View>

              {/* Success overlay */}
              {scanSuccess && (
                <Animated.View style={[styles.successOverlay, successStyle]}>
                  <Animated.View style={[styles.successCircle, pulseStyle]}>
                    <LinearGradient
                      colors={colors.gradient.success}
                      style={styles.successGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <CheckCircle2 size={40} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                </Animated.View>
              )}

              {/* Error overlay */}
              {scanError && (
                <Animated.View style={[styles.errorOverlay, errorStyle]}>
                  <View style={styles.errorCircle}>
                    <LinearGradient
                      colors={colors.gradient.error}
                      style={styles.errorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <CircleAlert size={40} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </Animated.View>
              )}
            </View>

            {/* Scanning instructions */}
            <View style={styles.instructionsContainer}>
              <View
                style={[
                  styles.instructionsCard,
                  { backgroundColor: 'rgba(0,0,0,0.5)' },
                ]}
              >
                <Text style={styles.instructionsText}>{instruction}</Text>
              </View>
            </View>

            {/* Camera controls */}
            <Animated.View style={[styles.controls, controlsStyle]}>
              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
                onPress={zoomOut}
                disabled={zoom <= 0 || scanSuccess}
              >
                <ZoomOut
                  size={22}
                  color={zoom <= 0 ? 'rgba(255,255,255,0.5)' : '#fff'}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
                onPress={toggleFlash}
                disabled={scanSuccess}
              >
                {flashState === FLASH_MODES.OFF ? (
                  <FlashlightOff size={22} color="#fff" />
                ) : (
                  <Flashlight size={22} color="#fff" />
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
                onPress={toggleCameraDirection}
                disabled={scanSuccess}
              >
                <RotateCcw size={22} color="#fff" />
              </Pressable>

              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
                onPress={zoomIn}
                disabled={zoom >= 0.5 || scanSuccess}
              >
                <ZoomIn
                  size={22}
                  color={zoom >= 0.5 ? 'rgba(255,255,255,0.5)' : '#fff'}
                />
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
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
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  scannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  infoBox: {
    position: 'absolute',
    top: '10%',
    width: '80%',
    maxWidth: 320,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 12,
    zIndex: 10,
  },
  infoBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBoxText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  scanFrame: {
    position: 'relative',
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  scanLineGradient: {
    height: '100%',
    width: '100%',
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  successCircle: {
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
  },
  errorGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionsCard: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { Platform } from 'react-native';
import { Camera, CameraType, FlashMode, BarCodeScannedCallback } from 'expo-camera';

// Re-export camera types
export { CameraType, FlashMode, BarCodeScannedCallback };

// Define types for scanner results
export interface BarcodeScannerResult {
  type: string;
  data: string;
}

/**
 * Check if camera permissions are granted
 */
export async function getCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking camera permissions:', error);
    return false;
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
}

// Check if scanner is available
export function isScannerModuleAvailable(): boolean {
  return Platform.OS !== 'web';
}

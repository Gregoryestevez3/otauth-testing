import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CircleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';

interface WebQRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

// Simple placeholder for environments where camera scanning isn't supported
export default function WebQRScanner({ onScan, onCancel }: WebQRScannerProps) {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CircleAlert size={60} color={colors.error} style={styles.errorIcon} />
      <Text style={[styles.errorTitle, { color: colors.text }]}>
        {t('qrScanner.cameraAccessDenied')}
      </Text>
      <Text style={[styles.errorDescription, { color: colors.secondaryText }]}>
        {t('addAccount.qrWebDescription')}
      </Text>
      <Pressable
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={onCancel}
      >
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>
          {t('common.ok')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Conditionally import native modules
let SecureStore: any = null;
let FileSystem: any = null;
let DocumentPicker: any = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
    FileSystem = require('expo-file-system');
    DocumentPicker = require('expo-document-picker');
  } catch (error) {
    console.warn('Native modules not available:', error);
  }
}

export interface OTPAccount {
  id: string;
  name: string;
  issuer: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
  createdAt: number;
}

// Constants
const ACCOUNTS_STORAGE_KEY = 'onetime_authenticator_accounts';
const ENCRYPTION_KEY_STORAGE_KEY = 'onetime_authenticator_encryption_key';
const BACKUP_FILE_NAME = 'onetime_authenticator_backup.json';
const ENCRYPTED_STORAGE_ENABLED_KEY = 'encrypted_storage_enabled';

// Generate a random encryption key
async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Get or create an encryption key
async function getEncryptionKey(): Promise<string> {
  if (Platform.OS !== 'web' && SecureStore && await SecureStore.isAvailableAsync()) {
    let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE_KEY);
    if (!key) {
      key = await generateEncryptionKey();
      await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    return key;
  } else {
    // Fallback to AsyncStorage for web
    let key = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    if (!key) {
      key = await generateEncryptionKey();
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, key);
    }
    return key;
  }
}

// Encrypt data
async function encryptData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = await Crypto.getRandomBytesAsync(16);
  const ivHex = Array.from(iv)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
    
  const encrypted = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + key + ivHex,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  
  return JSON.stringify({
    iv: ivHex,
    data: encrypted
  });
}

// Decrypt data
async function decryptData(encryptedData: string): Promise<string | null> {
  try {
    const { iv, data } = JSON.parse(encryptedData);
    const key = await getEncryptionKey();
    
    // In a real application, you would use a proper encryption/decryption algorithm
    // For this example, we'll simulate decryption using the original data
    // This is NOT secure and should NOT be used in production!
    
    // This is just a placeholder for the actual decryption process
    return data;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
}

// Check if encrypted storage is enabled
export async function isEncryptedStorageEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENCRYPTED_STORAGE_ENABLED_KEY);
  return value === 'true';
}

// Toggle encrypted storage
export async function setEncryptedStorage(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENCRYPTED_STORAGE_ENABLED_KEY, enabled ? 'true' : 'false');
  
  // If enabling encryption, encrypt the current accounts
  if (enabled) {
    const accounts = await getAccounts();
    await saveAccounts(accounts);
  }
}

// Save accounts to storage
export async function saveAccounts(accounts: OTPAccount[]): Promise<void> {
  if (!accounts) accounts = [];
  const data = JSON.stringify(accounts);
  const useEncryption = await isEncryptedStorageEnabled();
  
  try {
    if (useEncryption) {
      const encryptedData = await encryptData(data);
      await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, encryptedData);
    } else {
      await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, data);
    }
  } catch (error) {
    console.error('Failed to save accounts:', error);
  }
}

// Get accounts from storage
export async function getAccounts(): Promise<OTPAccount[]> {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
    
    if (!data) {
      return [];
    }
    
    const useEncryption = await isEncryptedStorageEnabled();
    
    if (useEncryption) {
      const decryptedData = await decryptData(data);
      return decryptedData ? JSON.parse(decryptedData) : [];
    } else {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to get accounts:', error);
    return [];
  }
}

// Add a new account
export async function addAccount(account: Omit<OTPAccount, 'id' | 'createdAt'>): Promise<OTPAccount> {
  const accounts = await getAccounts() || [];
  
  const newAccount: OTPAccount = {
    ...account,
    id: Crypto.randomUUID(),
    createdAt: Date.now()
  };
  
  await saveAccounts([...accounts, newAccount]);
  return newAccount;
}

// Update an account
export async function updateAccount(account: OTPAccount): Promise<void> {
  const accounts = await getAccounts() || [];
  const index = accounts.findIndex(a => a.id === account.id);
  
  if (index !== -1) {
    accounts[index] = account;
    await saveAccounts(accounts);
  }
}

// Delete an account
export async function deleteAccount(id: string): Promise<void> {
  const accounts = await getAccounts() || [];
  await saveAccounts(accounts.filter(account => account.id !== id));
}

// Export accounts as a backup
export async function exportAccounts(): Promise<string | null> {
  try {
    const accounts = await getAccounts();
    const backupData = JSON.stringify({
      accounts,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    });
    
    if (Platform.OS === 'web') {
      // For web, we'll return the JSON string for download
      return backupData;
    } else if (FileSystem) {
      // For mobile, we'll save to a file and return the URI
      const fileUri = `${FileSystem.documentDirectory}${BACKUP_FILE_NAME}`;
      await FileSystem.writeAsStringAsync(fileUri, backupData, {
        encoding: FileSystem.EncodingType.UTF8
      });
      return fileUri;
    }
    return null;
  } catch (error) {
    console.error('Failed to export accounts:', error);
    return null;
  }
}

// Import accounts from a backup
export async function importAccounts(backupData: string): Promise<boolean> {
  try {
    const data = JSON.parse(backupData);
    
    if (!data.accounts || !Array.isArray(data.accounts)) {
      return false;
    }
    
    // Validate each account has the required fields
    const validAccounts = data.accounts.filter((account: any) => 
      account && 
      typeof account.name === 'string' && 
      typeof account.issuer === 'string' && 
      typeof account.secret === 'string'
    );
    
    await saveAccounts(validAccounts);
    return true;
  } catch (error) {
    console.error('Failed to import accounts:', error);
    return false;
  }
}

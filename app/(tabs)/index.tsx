import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Pressable,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Plus, ImportIcon, Smartphone, QrCode } from 'lucide-react-native';
import { getAccounts, removeAccount } from '../utils/storage';
import { useTranslation } from 'react-i18next';
import TokenCard from '../components/TokenCard';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TokenImporter from '../components/TokenImporter';

export default function HomeScreen() {
  const isFocused = useIsFocused();
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);
  
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const accountData = await getAccounts();
      setAccounts(accountData);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load accounts when screen is focused
  useEffect(() => {
    if (isFocused) {
      loadAccounts();
    }
  }, [isFocused, loadAccounts]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  }, [loadAccounts]);
  
  const handleDelete = useCallback(async (id: string, issuer: string) => {
    Alert.alert(
      t('deleteAccount.title'),
      t('deleteAccount.message', { issuer }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAccount(id);
              // Refresh the accounts list
              loadAccounts();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(t('common.error'), t('deleteAccount.errorDeleting'));
            }
          }
        }
      ]
    );
  }, [loadAccounts, t]);
  
  const handleImportComplete = (count: number) => {
    setShowImporter(false);
    loadAccounts();
    
    // Show success message
    if (count > 0) {
      Alert.alert(
        t('importTokens.importSuccess'),
        t('importTokens.importSuccessDesc', { count }),
        [{ text: t('common.ok') }]
      );
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Import modal */}
      {showImporter && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <TokenImporter 
            onClose={() => setShowImporter(false)}
            onImportComplete={handleImportComplete}
          />
        </View>
      )}
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '15' }]}>
              <Smartphone size={48} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home.noAccounts')}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
              {t('home.noAccountsDesc')}
            </Text>
            
            <View style={styles.emptyActions}>
              <Pressable
                style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowImporter(true)}
              >
                <ImportIcon size={18} color={colors.buttonText} style={styles.buttonIcon} />
                <Text style={[styles.emptyButtonText, { color: colors.buttonText }]}>
                  {t('home.importFromOther')}
                </Text>
              </Pressable>
              
              <View style={styles.optionRow}>
                <QrCode size={18} color={colors.secondaryText} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                  {t('home.orScanQrCode')}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.accountsList}>
            <View style={styles.header}>
              <Text style={[styles.heading, { color: colors.text }]}>
                {t('home.accounts')}
              </Text>
              <Pressable 
                style={[styles.importButton, { backgroundColor: colors.tint + '15' }]}
                onPress={() => setShowImporter(true)}
              >
                <ImportIcon size={18} color={colors.tint} style={styles.buttonIcon} />
                <Text style={[styles.importButtonText, { color: colors.tint }]}>
                  {t('home.import')}
                </Text>
              </Pressable>
            </View>
            
            {accounts.map((account) => (
              <TokenCard
                key={account.id}
                id={account.id}
                name={account.name}
                issuer={account.issuer}
                secret={account.secret}
                algorithm={account.algorithm}
                digits={account.digits}
                period={account.period}
                onDelete={() => handleDelete(account.id, account.issuer)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyActions: {
    alignItems: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 220,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
  },
  accountsList: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
});

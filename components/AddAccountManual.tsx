import React, { useState, forwardRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Pressable, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

type AddAccountManualProps = {
  onAdd: (account: {
    name: string;
    issuer: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
  }) => void;
  onCancel: () => void;
};

// Create animated components with proper forwardRef pattern
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const AddAccountManual = forwardRef<View, AddAccountManualProps>((props, ref) => {
  const { onAdd, onCancel } = props;
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA1');
  const [digits, setDigits] = useState('6');
  const [period, setPeriod] = useState('30');
  const [showAlgorithmOptions, setShowAlgorithmOptions] = useState(false);
  
  // Animation values
  const dropdownAnimation = useSharedValue(0);
  const addButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);
  
  const algorithmOptions = ['SHA1', 'SHA256', 'SHA512'];
  
  const toggleAlgorithmOptions = () => {
    const newValue = !showAlgorithmOptions;
    setShowAlgorithmOptions(newValue);
    dropdownAnimation.value = withTiming(newValue ? 1 : 0, { duration: 300 });
  };
  
  const handleAdd = () => {
    if (!name || !issuer || !secret) {
      Alert.alert(t('manualAdd.missingInfo'), t('manualAdd.missingInfoDesc'));
      return;
    }
    
    // Normalize the secret (remove spaces)
    const normalizedSecret = secret.replace(/\s+/g, '').toUpperCase();
    
    // Validate the secret (base32 character set)
    const base32Regex = /^[A-Z2-7]+=*$/;
    if (!base32Regex.test(normalizedSecret)) {
      Alert.alert(t('manualAdd.invalidSecret'), t('manualAdd.invalidSecretDesc'));
      return;
    }
    
    onAdd({
      name,
      issuer,
      secret: normalizedSecret,
      algorithm,
      digits: parseInt(digits, 10),
      period: parseInt(period, 10)
    });
  };
  
  const dropdownStyle = useAnimatedStyle(() => {
    return {
      opacity: dropdownAnimation.value,
      maxHeight: interpolate(
        dropdownAnimation.value,
        [0, 1],
        [0, 150],
        Extrapolate.CLAMP
      ),
      transform: [
        { 
          translateY: interpolate(
            dropdownAnimation.value,
            [0, 1],
            [-20, 0],
            Extrapolate.CLAMP
          ) 
        }
      ],
    };
  });
  
  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          rotate: `${interpolate(
            dropdownAnimation.value,
            [0, 1],
            [0, 180],
            Extrapolate.CLAMP
          )}deg` 
        }
      ],
    };
  });
  
  const addButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: addButtonScale.value }]
    };
  });
  
  const cancelButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cancelButtonScale.value }]
    };
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      ref={ref}
    >
      <ScrollView style={[
        styles.scrollView, 
        { backgroundColor: colors.background }
      ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('manualAdd.addAccountManually')}
          </Text>
          <Pressable 
            onPress={onCancel} 
            hitSlop={10}
            style={styles.closeButton}
          >
            <X size={24} color={colors.tabIconDefault} />
          </Pressable>
        </View>
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.accountName')} *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                }
              ]}
              placeholder={t('manualAdd.accountNamePlaceholder')}
              placeholderTextColor={colors.tabIconDefault}
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.serviceProvider')} *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                }
              ]}
              placeholder={t('manualAdd.serviceProviderPlaceholder')}
              placeholderTextColor={colors.tabIconDefault}
              value={issuer}
              onChangeText={setIssuer}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.secretKey')} *</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                }
              ]}
              placeholder={t('manualAdd.secretKeyPlaceholder')}
              placeholderTextColor={colors.tabIconDefault}
              value={secret}
              onChangeText={setSecret}
              autoCapitalize="characters"
            />
            <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
              {t('manualAdd.secretKeyHelper')}
            </Text>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('manualAdd.advancedSettings')}
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.algorithm')}</Text>
            <Pressable 
              style={[
                styles.dropdown, 
                { 
                  borderColor: colors.border,
                  backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                }
              ]}
              onPress={toggleAlgorithmOptions}
            >
              <Text style={{ color: colors.text }}>{algorithm}</Text>
              <Animated.View style={chevronStyle}>
                <ChevronDown size={16} color={colors.tabIconDefault} />
              </Animated.View>
            </Pressable>
            
            <Animated.View style={[
              styles.dropdownOptions,
              { 
                backgroundColor: currentTheme === 'dark' ? '#2c2c3e' : '#FFFFFF',
                borderColor: colors.border
              },
              dropdownStyle
            ]}>
              {algorithmOptions.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.dropdownOption,
                    option === algorithm && { 
                      backgroundColor: currentTheme === 'dark' ? '#3a3a4c' : '#F0F3FF' 
                    }
                  ]}
                  onPress={() => {
                    setAlgorithm(option);
                    toggleAlgorithmOptions();
                  }}
                >
                  <Text style={{ color: colors.text }}>{option}</Text>
                </Pressable>
              ))}
            </Animated.View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: Layout.spacing.md }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.digits')}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                  }
                ]}
                value={digits}
                onChangeText={setDigits}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t('manualAdd.period')}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
                  }
                ]}
                value={period}
                onChangeText={setPeriod}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={[
        styles.buttons,
        { 
          borderTopColor: colors.border,
          backgroundColor: colors.background
        }
      ]}>
        <AnimatedPressable 
          style={[
            styles.button, 
            styles.cancelButton, 
            { 
              borderColor: colors.border,
              backgroundColor: currentTheme === 'dark' ? '#1c1c2e' : '#F8F9FE'
            },
            cancelButtonStyle
          ]}
          onPress={onCancel}
          onPressIn={() => {
            cancelButtonScale.value = withTiming(0.95, { duration: 100 });
          }}
          onPressOut={() => {
            cancelButtonScale.value = withSpring(1);
          }}
        >
          <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
        </AnimatedPressable>
        
        <AnimatedPressable
          onPress={handleAdd}
          onPressIn={() => {
            addButtonScale.value = withTiming(0.95, { duration: 100 });
          }}
          onPressOut={() => {
            addButtonScale.value = withSpring(1);
          }}
          style={[addButtonStyle, styles.button, styles.addButtonContainer]}
        >
          <AnimatedLinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.addButton, styles.button]}
          >
            <Text style={{ color: colors.buttonText, fontWeight: '600' }}>
              {t('manualAdd.addAccount')}
            </Text>
          </AnimatedLinearGradient>
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
  },
  form: {
    padding: Layout.spacing.lg,
  },
  formGroup: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    padding: 14,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    marginTop: 5,
    overflow: 'hidden',
    zIndex: 20,
    ...Layout.shadows.medium,
  },
  dropdownOption: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttons: {
    flexDirection: 'row',
    padding: Layout.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: Layout.spacing.md,
    borderWidth: 1,
  },
  addButtonContainer: {
    overflow: 'hidden',
  },
  addButton: {
    backgroundColor: '#2f95dc',
    borderRadius: Layout.borderRadius.medium,
    width: '100%',
  },
});

export default AddAccountManual;

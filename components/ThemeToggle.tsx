import React, { forwardRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Platform,
  Text
} from 'react-native';
import { Moon, Sun, Monitor } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

// Create animated components with proper forwardRef pattern
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ThemeToggle = forwardRef<View, {}>((props, ref) => {
  const { theme, currentTheme, setTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  const lightScale = useSharedValue(theme === 'light' ? 1.1 : 1);
  const darkScale = useSharedValue(theme === 'dark' ? 1.1 : 1);
  const systemScale = useSharedValue(theme === 'system' ? 1.1 : 1);
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    // Animate the pressed button
    if (newTheme === 'light') {
      lightScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 300, easing: Easing.elastic(1.2) })
      );
      darkScale.value = withTiming(1, { duration: 200 });
      systemScale.value = withTiming(1, { duration: 200 });
    } else if (newTheme === 'dark') {
      darkScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 300, easing: Easing.elastic(1.2) })
      );
      lightScale.value = withTiming(1, { duration: 200 });
      systemScale.value = withTiming(1, { duration: 200 });
    } else {
      systemScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1.1, { duration: 300, easing: Easing.elastic(1.2) })
      );
      lightScale.value = withTiming(1, { duration: 200 });
      darkScale.value = withTiming(1, { duration: 200 });
    }
    
    setTheme(newTheme);
  };
  
  const lightButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lightScale.value }],
    opacity: theme === 'light' ? 1 : 0.7,
    backgroundColor: theme === 'light' ? colors.tint + '20' : 'transparent',
  }));
  
  const darkButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: darkScale.value }],
    opacity: theme === 'dark' ? 1 : 0.7,
    backgroundColor: theme === 'dark' ? colors.tint + '20' : 'transparent',
  }));
  
  const systemButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: systemScale.value }],
    opacity: theme === 'system' ? 1 : 0.7,
    backgroundColor: theme === 'system' ? colors.tint + '20' : 'transparent',
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]} ref={ref}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('settings.themeMode')}
      </Text>
      
      <View style={styles.buttonsContainer}>
        <AnimatedPressable
          style={[styles.button, lightButtonStyle]}
          onPress={() => handleThemeChange('light')}
        >
          <Sun
            size={24}
            color={theme === 'light' ? colors.tint : colors.tabIconDefault}
          />
          <Text
            style={[
              styles.buttonText,
              {
                color: theme === 'light' ? colors.tint : colors.text,
              },
            ]}
          >
            {t('settings.light')}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, darkButtonStyle]}
          onPress={() => handleThemeChange('dark')}
        >
          <Moon
            size={24}
            color={theme === 'dark' ? colors.tint : colors.tabIconDefault}
          />
          <Text
            style={[
              styles.buttonText,
              {
                color: theme === 'dark' ? colors.tint : colors.text,
              },
            ]}
          >
            {t('settings.dark')}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={[styles.button, systemButtonStyle]}
          onPress={() => handleThemeChange('system')}
        >
          <Monitor
            size={24}
            color={theme === 'system' ? colors.tint : colors.tabIconDefault}
          />
          <Text
            style={[
              styles.buttonText,
              {
                color: theme === 'system' ? colors.tint : colors.text,
              },
            ]}
          >
            {t('settings.system')}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ThemeToggle;

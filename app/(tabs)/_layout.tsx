import React, { useRef } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { ShieldCheck, QrCode, Settings } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

// Create animated component with proper forwardRef pattern
const AnimatedIcon = Animated.createAnimatedComponent(View);

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate tab bar height based on device
const getTabBarHeight = () => {
  // Base height plus platform-specific adjustments
  const baseHeight = 60;
  
  // Smaller height on small screens
  const smallScreenAdjustment = SCREEN_HEIGHT < 700 ? -10 : 0;
  
  // Larger height on large screens or tablets
  const largeScreenAdjustment = SCREEN_HEIGHT > 900 ? 10 : 0;
  
  // iOS needs extra padding for home indicator
  const iosAdjustment = Platform.OS === 'ios' ? 8 : 0;
  
  return baseHeight + smallScreenAdjustment + largeScreenAdjustment + iosAdjustment;
};

export default function TabLayout() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const { t } = useTranslation();
  
  // Use refs for animated components
  const indexIconRef = useRef(null);
  const addIconRef = useRef(null);
  const settingsIconRef = useRef(null);
  
  // Animation values for tab icons
  const iconScale = {
    index: useSharedValue(1),
    add: useSharedValue(1),
    settings: useSharedValue(1)
  };

  // Calculate dimensions based on screen size
  const tabBarHeight = getTabBarHeight();
  const isSmallScreen = SCREEN_WIDTH < 360;
  const iconSize = isSmallScreen ? 22 : 24;

  // Render tab bar icon with animation
  const renderTabBarIcon = (route: string, focused: boolean, color: string, size: number) => {
    // Get the appropriate ref
    const iconRef = 
      route === 'index' ? indexIconRef :
      route === 'add' ? addIconRef :
      settingsIconRef;
    
    // Animation worklet
    const handleFocus = () => {
      'worklet';
      if (focused) {
        iconScale[route as keyof typeof iconScale].value = withSpring(1.2, { 
          damping: 10, 
          stiffness: 100 
        });
      } else {
        iconScale[route as keyof typeof iconScale].value = withTiming(1, { duration: 200 });
      }
    };
    
    // Apply animation
    handleFocus();
    
    // Create animation style
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: iconScale[route as keyof typeof iconScale].value }]
      };
    });
    
    return (
      <AnimatedIcon ref={iconRef} style={[styles.iconContainer, animatedStyle]}>
        {route === 'index' && <ShieldCheck size={iconSize} color={color} />}
        {route === 'add' && <QrCode size={iconSize} color={color} />}
        {route === 'settings' && <Settings size={iconSize} color={color} />}
      </AnimatedIcon>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: { 
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          backgroundColor: currentTheme === 'dark' ? '#0D101D' : '#FFF',
          ...Layout.shadows.small,
          // Make tab bar adaptive to screen size
          paddingHorizontal: isSmallScreen ? 8 : 0,
        },
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '600',
          fontSize: isSmallScreen ? 16 : 18,
        },
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 10 : 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 5 : 2,
        },
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.accounts'),
          headerTitle: t('navigation.authenticator'),
          tabBarIcon: ({ color, size, focused }) => 
            renderTabBarIcon('index', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('navigation.add'),
          headerTitle: t('navigation.addAccount'),
          tabBarIcon: ({ color, size, focused }) => 
            renderTabBarIcon('add', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.settings'),
          headerTitle: t('navigation.settings'),
          tabBarIcon: ({ color, size, focused }) => 
            renderTabBarIcon('settings', focused, color, size),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
});

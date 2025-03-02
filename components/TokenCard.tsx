import React, { useState, useRef, forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Copy, Check, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import CircularProgressBar from './CircularProgressBar';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

// Conditionally import Haptics
let Haptics: any = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch (error) {
    console.warn('Haptics not available:', error);
  }
}

type TokenCardProps = {
  name: string;
  issuer: string;
  tokenValue: string;
  tokenPeriod: number;
  timeRemaining: number;
  onLongPress: () => void;
};

// Create animated components with proper forwardRef pattern
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TokenCard = forwardRef<View, TokenCardProps>((props, ref) => {
  const {
    name,
    issuer,
    tokenValue,
    tokenPeriod,
    timeRemaining,
    onLongPress,
  } = props;
  
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  
  const [copied, setCopied] = useState(false);
  
  // Animation values
  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);
  const copyFeedback = useSharedValue(0);
  
  // Format token with a space in the middle
  const formattedToken = tokenValue.length > 3 
    ? `${tokenValue.substring(0, 3)} ${tokenValue.substring(3)}`
    : tokenValue;
  
  // Calculate progress for the countdown circle
  const progress = timeRemaining / tokenPeriod;
  const showPulse = timeRemaining < 10; // Show pulse animation when less than 10 seconds remain

  const copyToClipboard = async () => {
    if (Platform.OS !== 'web' && Haptics) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics error:', error);
      }
    }
    
    // Animate button
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
    
    // Animate copy indicator
    copyFeedback.value = withTiming(1, { duration: 300 }, () => {
      runOnJS(setCopied)(true);
    });
    
    // Copy to clipboard
    await Clipboard.setStringAsync(tokenValue);
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyFeedback.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setCopied)(false);
      });
    }, 1500);
  };
  
  const handlePressIn = () => {
    pressOpacity.value = withTiming(0.9, { duration: 100 });
    scale.value = withTiming(0.98, { duration: 100 });
  };
  
  const handlePressOut = () => {
    pressOpacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 200 });
  };

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: pressOpacity.value,
    };
  });
  
  const copyIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      copyFeedback.value,
      [0, 0.5, 1],
      [1, 0, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [
        { 
          scale: interpolate(
            copyFeedback.value,
            [0, 0.5, 1],
            [1, 0, 0],
            Extrapolate.CLAMP
          ) 
        },
      ],
    };
  });
  
  const checkIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      copyFeedback.value,
      [0, 0.5, 1],
      [0, 0, 1],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      copyFeedback.value,
      [0, 0.5, 1],
      [0, 1.2, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <AnimatedPressable
      ref={ref}
      style={[
        styles.container,
        { backgroundColor: colors.card },
        cardStyle,
        Layout.shadows.medium
      ]}
      onPress={copyToClipboard}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={() => {
        if (Platform.OS !== 'web' && Haptics) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (error) {
            console.warn('Haptics error:', error);
          }
        }
        onLongPress();
      }}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <View style={styles.issuerContainer}>
            <View 
              style={[
                styles.issuerDot, 
                { backgroundColor: colors.tint }
              ]} 
            />
            <Text style={[styles.issuer, { color: colors.text }]} numberOfLines={1}>
              {issuer}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.secondaryText }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
        
        <View style={styles.tokenContainer}>
          <Text style={[styles.token, { color: colors.text }]}>
            {formattedToken}
          </Text>
          
          <View style={styles.actions}>
            <Animated.View 
              style={[styles.iconWrapper, copyIconStyle]}
            >
              <Copy size={20} color={colors.tabIconDefault} />
            </Animated.View>
            
            <Animated.View 
              style={[styles.iconWrapper, styles.checkIconWrapper, checkIconStyle]}
            >
              <Check size={20} color={colors.success} />
            </Animated.View>
          </View>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <CircularProgressBar 
          progress={progress} 
          size={48} 
          strokeWidth={5}
          showPulse={showPulse}
        />
        <Text style={[
          styles.timeRemaining, 
          { 
            color: timeRemaining < 10 ? colors.error : colors.text 
          }
        ]}>
          {timeRemaining}s
        </Text>
        <Pressable style={styles.moreButton} hitSlop={10}>
          <MoreHorizontal size={18} color={colors.tabIconDefault} />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  textContainer: {
    marginBottom: Layout.spacing.md,
  },
  issuerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issuerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  issuer: {
    fontSize: 18,
    fontWeight: '600',
  },
  name: {
    fontSize: 14,
    marginLeft: 16,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  token: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    position: 'relative',
    width: 28,
    height: 28,
    marginLeft: Layout.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconWrapper: {
    backgroundColor: 'rgba(65, 208, 165, 0.15)',
    borderRadius: 999,
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Layout.spacing.md,
  },
  timeRemaining: {
    marginLeft: Layout.spacing.sm,
    fontSize: 16,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  moreButton: {
    padding: 5,
    marginLeft: 5,
  },
});

export default TokenCard;

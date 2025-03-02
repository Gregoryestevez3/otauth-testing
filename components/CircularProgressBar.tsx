import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Colors from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

type CircularProgressBarProps = {
  progress: number; // Value between 0 and 1
  size: number;
  strokeWidth: number;
  showPulse?: boolean;
};

// Create animated components with proper forwardRef pattern
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

const CircularProgressBar = forwardRef<View, CircularProgressBarProps>((props, ref) => {
  const { progress, size, strokeWidth, showPulse = false } = props;
  
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  
  // Animation values
  const animatedProgress = useSharedValue(progress);
  const pulseAnimation = useSharedValue(1);
  const strokeColorValue = useSharedValue(progress);
  
  // Calculate circle properties
  const circleCircumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  
  // Update animation when props change
  React.useEffect(() => {
    // Animate progress smoothly
    animatedProgress.value = withTiming(progress, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Update color value
    strokeColorValue.value = progress;
    
    // Add pulse effect when time is getting low (less than 30%)
    if (showPulse && progress < 0.3) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1, // Infinite repeats
        true // Reverse animation
      );
    } else {
      pulseAnimation.value = withTiming(1);
    }
  }, [progress, showPulse]);

  // Animated props for the stroke and dashoffset
  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circleCircumference * (1 - animatedProgress.value),
      stroke: interpolateColor(
        strokeColorValue.value,
        [0, 0.3, 0.6, 1],
        [colors.error, colors.warning, colors.tint, colors.tint]
      ),
    };
  });
  
  // Animation style for the pulse effect
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnimation.value }],
    };
  });

  return (
    <AnimatedView 
      ref={ref}
      style={[
        styles.container, 
        { width: size, height: size },
        pulseStyle
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={styles.svg}
      >
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={(size - strokeWidth) / 2}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circleCircumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
    </AnimatedView>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
});

export default CircularProgressBar;

import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Colors from '../constants/Colors';
import { OctagonAlert as AlertOctagon } from 'lucide-react-native';

export default function NotFoundScreen() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Oops!',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text
      }} />
      
      <View style={styles.content}>
        <AlertOctagon size={80} color={colors.error} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>
          Page Not Found
        </Text>
        <Text style={[styles.description, { color: colors.secondaryText }]}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <Link href="/" asChild>
          <Pressable style={[styles.button, { backgroundColor: colors.tint }]}>
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>
              Go to Home Screen
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

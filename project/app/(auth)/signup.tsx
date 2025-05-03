import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function SignupScreen() {
  const params = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAccount = async () => {
    if (!name) {
      setError('Please enter your name');
      return;
    }

    const phone = params.phone || '';
    if (!phone) {
      Alert.alert('Error', 'Phone number is missing');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Bypassing account creation, navigating directly to home');
      
      // Skip database operations completely and navigate directly to home
      setTimeout(() => {
        // Force navigation to the home screen using replace to prevent going back
        router.replace('/(app)');
      }, 500);
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Create Account</Text>
      <Text style={[styles.subheading, { color: colors.textSecondary }]}>
        Please tell us your name to continue
      </Text>

      <View style={styles.form}>
        <Text
          style={[styles.phoneLabel, { color: colors.textSecondary }]}
        >
          Phone Number
        </Text>
        <Text style={[styles.phoneNumber, { color: colors.text }]}>
          {params.phone}
        </Text>

        <Input
          label="Your Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          placeholder="Enter your full name"
          error={error}
        />

        <Button
          title="Create Account"
          onPress={handleCreateAccount}
          isLoading={isLoading}
          disabled={!name}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 60,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
});
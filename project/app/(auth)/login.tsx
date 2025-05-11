import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import PixelLogo from '@/components/PixelLogo';
import { signIn, supabase, verifyOtpMock, setMockSession } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await signIn(phone);
      setOtpSent(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('Bypassing OTP verification, proceeding directly');
      
      // Let's assume 50% of users are new and 50% existing
      // In a real app, this would check the database
      const randomIsNew = Math.random() > 0.5;
      
      setTimeout(() => {
        if (randomIsNew) {
          // For demonstration, randomly navigate to signup
          console.log('Navigating to signup page');
          router.replace({
            pathname: '/signup',
            params: { phone }
          });
        } else {
          // For demonstration, randomly navigate to home
          console.log('Navigating to home page');
          router.replace('/(app)');
        }
      }, 500);
    } catch (err) {
      Alert.alert('Error', 'There was a problem with verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <PixelLogo />
        <Text style={[styles.title, { color: colors.text }]}>RideWise</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.heading, { color: colors.text }]}>
          Enter your phone number
        </Text>
        <Text style={[styles.subheading, { color: colors.textSecondary }]}>
          We'll send you a one-time verification code
        </Text>

        <Input
          label="Phone Number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text.replace(/[^0-9]/g, ''));
            setError('');
          }}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          maxLength={10}
          error={error}
        />

        {otpSent ? (
          <Input
            label="OTP"
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/[^0-9]/g, ''));
              setError('');
            }}
            placeholder="Enter OTP"
            keyboardType="phone-pad"
            maxLength={6}
            error={error}
          />
        ) : null}

        {otpSent ? (
          <Button
            title="Verify OTP"
            onPress={handleVerifyOTP}
            isLoading={isLoading}
            disabled={!otp || otp.length < 6}
            style={styles.button}
          />
        ) : (
          <Button
            title="Send OTP"
            onPress={handleSendOTP}
            isLoading={isLoading}
            disabled={!phone || phone.length < 10}
            style={styles.button}
          />
        )}

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
  },
  formContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
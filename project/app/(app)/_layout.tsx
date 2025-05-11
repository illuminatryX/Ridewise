import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Home, ChartBar as BarChart2, Settings } from 'lucide-react-native';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    // Disable authentication check to allow bypassing login
    // Original code:
    // if (!isLoading && !user) {
    //   router.replace('/login');
    // }
    
    // For development only - bypass authentication check
    console.log('Authentication check bypassed for development');
  }, [user, isLoading]);

  // Don't render anything while checking authentication
  // Disabled for development to allow navigation without auth
  // if (isLoading) {
  //   return null;
  // }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: 'Compare',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
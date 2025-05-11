import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useRouter } from 'expo-router';

type User = {
  id: string;
  phone: string;
  name: string;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    fetchUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Check if user exists in database
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session?.user.id ?? '')
            .maybeSingle();

          if (data) {
            // User exists, navigate to app
            router.replace('/(app)');
          } else {
            // New user, navigate to signup with phone
            const phone = session?.user.phone?.replace('+91', '') ?? '';
            router.push({
              pathname: '/signup',
              params: { phone },
            });
          }
          
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
// MOCK VERSION - Authentication bypass
// This is a simplified mock implementation that completely bypasses authentication

// Mock user data for development
const MOCK_USER = {
  id: 'mock-user-id',
  phone: '+917788996655',
  name: 'Test User'
};

// Mock Supabase client with minimal required methods
export const supabase = {
  auth: {
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    }),
    getUser: async () => ({
      data: {
        user: {
          id: MOCK_USER.id,
          phone: MOCK_USER.phone
        }
      },
      error: null
    }),
    signInWithOtp: async () => ({
      data: { user: MOCK_USER },
      error: null
    }),
    verifyOtp: async () => ({
      data: { user: MOCK_USER },
      error: null
    }),
    signOut: async () => ({ error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: MOCK_USER, error: null }),
        maybeSingle: async () => ({ data: MOCK_USER, error: null })
      })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: MOCK_USER, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: MOCK_USER, error: null })
        })
      })
    })
  })
};

// Function to get current user data
export const getCurrentUser = async () => {
  // Always return the mock user
  return MOCK_USER;
};

// Request OTP (bypassed)
export const requestOtp = async (phone: string) => {
  console.log('MOCK: OTP requested for phone:', phone);
  return { success: true };
};

// Verify OTP (bypassed)
export const verifyOtp = async (phone: string, otp: string) => {
  console.log('MOCK: OTP verified for phone:', phone, 'with code:', otp);
  return { 
    success: true, 
    isNewUser: false, // Always return as existing user to skip signup
    user: MOCK_USER
  };
};

// Helper to format phone number (simplified mock)
const formatPhoneNumber = (phone: string) => {
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+91${phone}`;
};

// Create a new user (bypassed)
export const createUser = async (phone: string, name: string) => {
  console.log('MOCK: Creating user with phone:', phone, 'and name:', name);
  return { success: true };
};

// Check if a user exists (always returns true to bypass signup)
export const checkUserExists = async () => {
  return true; // Always return true to skip signup
};

// Sign out (bypassed)
export const signOut = async () => {
  console.log('MOCK: User signed out');
  return { success: true };
};
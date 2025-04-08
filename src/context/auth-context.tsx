'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { AuthService } from '@/lib/auth/auth-service';

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null; // Add state for context-level errors (e.g., initial load)
  // Note: signIn, signUp, signOut methods might be better handled directly
  // in the components that need them (like AuthForm) to manage form-specific
  // loading/error states, unless complex global side effects are needed.
  // For now, we focus on providing the auth state.
  signOut: () => Promise<void>;
}

// Create the context with a default undefined value to prevent misuse
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until initial session is fetched
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const auth = AuthService.getInstance();
        await auth.initialize();
        
        setSession(auth.session);
        setUser(auth.user);
        setError(null);
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize authentication");
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth = AuthService.getInstance();
      await auth.signOut();
      // AuthService handles the redirect
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err instanceof Error ? err.message : "Failed to sign out");
      // Force reload to auth page even on error
      window.location.href = '/auth?error=signout_failed';
    } finally {
      setLoading(false);
    }
  };

  // Define the context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
    // We won't provide signIn/signUp here for now
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as auth from "@/lib/auth";
import { mapAuthError } from "./utils/auth-errors";
import { FormAlert } from "./form-alert";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { AuthService } from "@/lib/auth/auth-service";

export type AuthMode = "login" | "signup";

export interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  message: string | null;
}

export default function AuthFormContainer() {
  const [formState, setFormState] = useState<AuthFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    isLoading: false,
    error: null,
    message: null,
  });
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract query parameters
  const clearParam = searchParams.get('clear');
  const errorParam = searchParams.get('error');
  const fromParam = searchParams.get('from');
  const timeParam = searchParams.get('t');
  
  // Handle cache-busting and logout state
  useEffect(() => {
    // If clear=true parameter exists, a logout redirect happened
    if (clearParam === 'true') {
      console.log('🔥 AUTH: Detected logout redirect, performing additional cleanup');
      
      // Perform additional cleanup on auth page load
      const performAdditionalCleanup = async () => {
        try {
          // Force clear browser storage again
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear any potential session
          const authService = AuthService.getInstance();
          await authService.validateSession();
          
          // Remove the clear parameter to prevent repeated cleanup on refresh
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('clear');
          window.history.replaceState({}, '', newUrl.toString());
          
          console.log('🔥 AUTH: Additional cleanup complete');
        } catch (error) {
          console.error('🔥 AUTH: Cleanup error:', error);
        }
      };
      
      performAdditionalCleanup();
    }
    
    // Display appropriate messages based on query parameters
    if (errorParam) {
      setFormState(prev => ({
        ...prev,
        error: errorParam === 'signout_failed' 
          ? 'Sign out encountered an error but you have been redirected to the login page.'
          : 'Authentication error: ' + errorParam
      }));
    } else if (fromParam) {
      setFormState(prev => ({
        ...prev,
        message: `You need to be logged in to access ${fromParam}`
      }));
    }
  }, [clearParam, errorParam, fromParam, timeParam]);

  // Original useEffect for auth initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        await auth.initializeAuth();
        setIsInitialized(true);
        
        // Double-check session status on page load
        const authInstance = AuthService.getInstance();
        const hasSession = await authInstance.validateSession();
        
        // If user somehow has a valid session on the auth page, redirect to dashboard
        if (hasSession && !clearParam) {
          console.log('🔥 AUTH: Valid session detected on auth page, redirecting to dashboard');
          router.push('/dashboard');
        }
      } catch (_err) {
        setFormState(prev => ({
          ...prev,
          error: "Failed to initialize authentication service",
        }));
      }
    };
    initAuth();
  }, [router, clearParam]);

  const handleInputChange = (field: keyof AuthFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState({
      email: "",
      password: "",
      confirmPassword: "",
      isLoading: false,
      error: null,
      message: null,
    });
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    resetForm();
  };

  const handleLogin = async () => {
    if (!isInitialized) {
      setFormState(prev => ({
        ...prev,
        error: "Authentication service is not ready yet. Please try again.",
      }));
      return;
    }

    try {
      await auth.signIn(formState.email, formState.password);
      router.push("/dashboard");
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setFormState(prev => ({
        ...prev,
        error: mapAuthError(rawMessage),
        isLoading: false,
      }));
    }
  };

  const handleSignup = async () => {
    if (!isInitialized) {
      setFormState(prev => ({
        ...prev,
        error: "Authentication service is not ready yet. Please try again.",
      }));
      return;
    }

    try {
      await auth.signUp(formState.email, formState.password);
      setFormState(prev => ({
        ...prev,
        message: "Check your email for a verification link!",
        isLoading: false,
      }));
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setFormState(prev => ({
        ...prev,
        error: mapAuthError(rawMessage),
        isLoading: false,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous messages
    setFormState(prev => ({
      ...prev,
      error: null,
      message: null,
      isLoading: true,
    }));

    // Basic validation
    if (!formState.email || !formState.password) {
      setFormState(prev => ({
        ...prev,
        error: "Email and password are required",
        isLoading: false,
      }));
      return;
    }

    if (mode === "signup") {
      // Signup-specific validation
      if (formState.password !== formState.confirmPassword) {
        setFormState(prev => ({
          ...prev,
          error: "Passwords do not match",
          isLoading: false,
        }));
        return;
      }
      
      if (formState.password.length < 6) {
        setFormState(prev => ({
          ...prev,
          error: "Password must be at least 6 characters long",
          isLoading: false,
        }));
        return;
      }
      
      await handleSignup();
    } else {
      await handleLogin();
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === "login" ? "Log In" : "Sign Up"}
      </h2>

      {formState.error && <FormAlert type="error" message={formState.error} />}
      {formState.message && <FormAlert type="success" message={formState.message} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "login" ? (
          <LoginForm
            formState={formState}
            onInputChange={handleInputChange}
          />
        ) : (
          <SignupForm
            formState={formState}
            onInputChange={handleInputChange}
          />
        )}

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={formState.isLoading}
          >
            {mode === "login"
              ? "Need an account? Sign Up"
              : "Already have an account? Log In"}
          </button>
        </div>
      </form>
    </div>
  );
} 
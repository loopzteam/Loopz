// src/components/auth/auth-form.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for client-side navigation
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/lib/auth/auth-service";

type AuthMode = "login" | "signup";

// Helper function to map common Supabase auth errors
function mapSupabaseError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (message.includes("User already registered")) {
    return "An account with this email already exists. Please log in or use a different email.";
  }
  if (message.includes("Password should be at least 6 characters")) {
    return "Password must be at least 6 characters long."; // Consistent message
  }
  // Add more specific mappings as needed
  return message; // Return original message for unmapped errors
}

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // Add state for messages (e.g., signup success)
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter(); // Initialize useRouter
  const auth = AuthService.getInstance();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await auth.initialize();
        setIsInitialized(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_err) {
        setError("Failed to initialize authentication service");
      }
    };
    initAuth();
  }, [auth]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isInitialized) {
      setError("Authentication service is not ready yet. Please try again.");
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // Input validation
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (mode === "signup") {
        // Signup-specific validation
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Use AuthService for signup
        await auth.signUp(email, password);
        setMessage("Check your email for a verification link!");
      } else {
        // Use AuthService for login
        await auth.signIn(email, password);
        // On successful login, redirect to dashboard
        router.push("/dashboard");
        return; // Exit early after navigation
      }
    } catch (err) {
      // Handle validation or Supabase errors
      const rawMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(mapSupabaseError(rawMessage));
    } finally {
      // Only set loading false if we didn't redirect
      // On successful login, the component might unmount before finally runs
      if (mode !== "login" || error) {
        setIsLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    // Reset form and error/message state when switching modes
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === "login" ? "Log In" : "Sign Up"}
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            placeholder="Enter your password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </div>

        {mode === "signup" && (
          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? mode === "login"
              ? "Logging in..."
              : "Signing up..."
            : mode === "login"
              ? "Log In"
              : "Sign Up"}
        </Button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            disabled={isLoading}
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

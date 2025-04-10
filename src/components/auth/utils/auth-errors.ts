/**
 * Utility functions for handling authentication errors
 */

/**
 * Maps common Supabase authentication error messages to user-friendly messages
 * @param message The raw error message from Supabase or validation
 * @returns A user-friendly error message
 */
export function mapAuthError(message: string): string {
  // Login errors
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please try again.";
  }
  
  // Signup errors
  if (message.includes("User already registered")) {
    return "An account with this email already exists. Please log in or use a different email.";
  }
  
  // Password validation
  if (message.includes("Password should be at least 6 characters")) {
    return "Password must be at least 6 characters long.";
  }
  
  // Email validation
  if (message.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  
  // Return original message for unmapped errors
  return message;
} 
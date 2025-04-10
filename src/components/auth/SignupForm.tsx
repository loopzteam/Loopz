import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./password-input";
import { AuthFormState } from "./AuthFormContainer";

interface SignupFormProps {
  formState: AuthFormState;
  onInputChange: (field: keyof AuthFormState, value: string) => void;
}

export default function SignupForm({ formState, onInputChange }: SignupFormProps) {
  const { email, password, confirmPassword, isLoading } = formState;

  return (
    <>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onInputChange("email", e.target.value)}
          required
          disabled={isLoading}
          placeholder="Enter your email"
          autoComplete="email"
        />
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={(value) => onInputChange("password", value)}
        disabled={isLoading}
        autoComplete="new-password"
      />

      <PasswordInput
        id="confirm-password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(value) => onInputChange("confirmPassword", value)}
        disabled={isLoading}
        placeholder="Confirm your password"
        autoComplete="new-password"
        isConfirmation
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing up..." : "Sign Up"}
      </Button>
    </>
  );
} 
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./password-input";
import { AuthFormState } from "./AuthFormContainer";

interface LoginFormProps {
  formState: AuthFormState;
  onInputChange: (field: keyof AuthFormState, value: string) => void;
}

export default function LoginForm({ formState, onInputChange }: LoginFormProps) {
  const { email, password, isLoading } = formState;

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
        autoComplete="current-password"
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Log In"}
      </Button>
    </>
  );
} 
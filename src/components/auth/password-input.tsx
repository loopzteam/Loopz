'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  isConfirmation?: boolean;
}

/**
 * Password input component with label
 */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete,
  disabled = false,
  isConfirmation = false
}: PasswordInputProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
} 
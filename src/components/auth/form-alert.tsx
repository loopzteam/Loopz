'use client';

interface FormAlertProps {
  type: 'error' | 'success';
  message: string;
}

/**
 * Form alert component for displaying messages and errors
 */
export function FormAlert({ type, message }: FormAlertProps) {
  if (!message) return null;
  
  const styles = {
    error: "bg-red-100 border border-red-400 text-red-700",
    success: "bg-green-100 border border-green-400 text-green-700"
  };
  
  return (
    <div
      className={`${styles[type]} px-4 py-3 rounded relative mb-4`}
      role="alert"
    >
      {message}
    </div>
  );
} 
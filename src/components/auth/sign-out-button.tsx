'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuthService } from '@/lib/auth/auth-service';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const auth = AuthService.getInstance();
      await auth.signOut();
      // No need for additional navigation logic - AuthService handles it
    } catch (err) {
      console.error("SignOutButton error:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      // Even on error, force a reload to auth page
      window.location.href = '/auth?error=signout_failed';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {error && (
        <p className="text-xs text-red-600">Error: {error}</p>
      )}
      <Button
        onClick={handleSignOut}
        disabled={isLoading} 
        variant="outline" 
        size="sm" 
      >
        {isLoading ? 'Signing Out...' : 'Sign Out'}
      </Button>
    </div>
  );
} 
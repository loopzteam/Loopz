'use client';

import Link from 'next/link';
import { useStore } from '@/store';
import { signOut } from '@/lib/auth';

/**
 * Header component - displays app header with navigation and auth
 */
export function Header() {
  const { user, theme, setTheme } = useStore();
  
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  return (
    <header className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/" className="font-semibold text-lg">
          Loopz
        </Link>
        
        {user && (
          <nav className="ml-8 flex gap-4">
            <Link href="/dashboard" className="text-sm">
              Dashboard
            </Link>
          </nav>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="text-sm">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        {user ? (
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1 border rounded-md"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/auth"
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
} 
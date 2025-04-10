'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store';

/**
 * Navigation component - displays sidebar navigation
 */
export function Nav() {
  const pathname = usePathname();
  const { user } = useStore();
  
  if (!user) {
    return null;
  }
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <nav className="w-64 border-r h-full p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Loopz</h2>
      </div>
      
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className={`block px-4 py-2 rounded-md ${
            isActive('/dashboard') 
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-gray-50'
          }`}
        >
          Dashboard
        </Link>
        
        {/* Other navigation links would go here */}
      </div>
    </nav>
  );
} 
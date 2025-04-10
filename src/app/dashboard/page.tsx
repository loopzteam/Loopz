import { redirect } from 'next/navigation';
import SignOutButton from '@/components/auth/sign-out-button';
import { createServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  // Server-side auth check as fallback protection
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // If no session, redirect to auth page
  if (!session) {
    console.log('🛡️ SERVER: No session found at page level, redirecting to /auth');
    redirect(`/auth?from=dashboard&t=${Date.now()}`);
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <p className="text-gray-700 mb-6">Welcome! You are logged in.</p>
      
      {/* Add the Sign Out Button */}
      <SignOutButton />
      
      {/* Placeholder for future dashboard content */}
      <div className="mt-10 p-6 border rounded bg-white w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Your Content</h2>
        <p className="text-gray-600">Dashboard content will go here...</p>
      </div>
    </div>
  );
} 
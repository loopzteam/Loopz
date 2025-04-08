import SignOutButton from '@/components/auth/sign-out-button';

export default function DashboardPage() {
  // In a real app, you might fetch user-specific data here
  // using server components or client components with useAuth()
  
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
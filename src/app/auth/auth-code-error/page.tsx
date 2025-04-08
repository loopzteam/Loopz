import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
      <p className="text-gray-700 mb-6">
        There was an issue verifying your authentication code. This could be due to an expired or invalid link.
      </p>
      <p className="text-gray-700 mb-8">
        Please try signing up or logging in again.
      </p>
      <Link href="/auth">
        <span className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 cursor-pointer">
          Go to Login / Sign Up
        </span>
      </Link>
    </div>
  );
} 
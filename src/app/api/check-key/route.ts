import { NextResponse } from 'next/server';

export async function GET() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  return NextResponse.json({
    keyExists: !!serviceRoleKey,
    keyLength: serviceRoleKey ? serviceRoleKey.length : 0,
    firstChars: serviceRoleKey ? serviceRoleKey.substring(0, 5) + '...' : '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    env: process.env.NODE_ENV
  });
} 
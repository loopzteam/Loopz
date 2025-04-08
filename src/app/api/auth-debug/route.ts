import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    message: "Auth debug endpoint - check browser developer tools for cookie information"
  });
} 
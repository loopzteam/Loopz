import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({ message: \"DB Check Placeholder\" });
}

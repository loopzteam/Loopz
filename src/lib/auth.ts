import { createBrowserClient } from '@supabase/ssr';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from './types';

// Keep track of auth state between function calls
let _currentSession: Session | null = null;
let _currentUser: SupabaseUser | null = null;

/**
 * Create a Supabase client for browser usage
 */
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Initialize auth state by fetching current session and user
 */
export async function initializeAuth(): Promise<{ session: Session | null, user: SupabaseUser | null }> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      _currentSession = session;
      _currentUser = user;
      return { session, user };
    }
    
    return { session: null, user: null };
  } catch (error) {
    console.error('Error initializing auth:', error);
    return { session: null, user: null };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<Session | null> {
  // Use cached session if available
  if (_currentSession) {
    return _currentSession;
  }
  
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  _currentSession = data.session;
  return data.session;
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
  // Use cached user if available
  if (_currentUser) {
    return {
      id: _currentUser.id,
      email: _currentUser.email,
    };
  }
  
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    console.error('Error getting user:', error);
    return null;
  }
  
  _currentUser = data.user;
  return {
    id: data.user.id,
    email: data.user.email,
  };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { session, user }, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  _currentSession = session;
  _currentUser = user;
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    }
  });

  if (error) throw error;
}

/**
 * Clear browser storage by removing Supabase-specific items
 */
function clearBrowserStorage(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear Supabase localStorage items
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || 
      key.includes('supabase')
    );
    supabaseKeys.forEach(key => localStorage.removeItem(key));
    
    // Clear Supabase sessionStorage items
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('sb-') || 
      key.includes('supabase')
    );
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Clear Supabase cookies
    const clearCookie = (name: string) => {
      const domain = location.hostname === 'localhost' ? '' : `domain=${location.hostname};`;
      document.cookie = `${name}=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? null;
    
    if (projectRef) {
      clearCookie(`sb-${projectRef}-auth-token`);
      clearCookie(`sb-${projectRef}-auth-token-code-verifier`);
    }
    clearCookie('sb-access-token');
    clearCookie('sb-refresh-token');
    
    const customCookieName = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME;
    if (customCookieName) {
      clearCookie(customCookieName);
    }
  } catch (err) {
    console.error('Error clearing browser storage:', err);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    // Clear local state
    _currentSession = null;
    _currentUser = null;

    // Clear browser storage
    clearBrowserStorage();

    // Call Supabase signOut
    const supabase = createClient();
    await supabase.auth.signOut();

    // Redirect to auth page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth?t=' + Date.now();
    }
  } catch (error) {
    console.error('Error during sign out:', error);
    // Still redirect on error
    if (typeof window !== 'undefined') {
      window.location.href = '/auth?error=signout_failed';
    }
    throw error;
  }
}

/**
 * Check if current session is valid
 */
export async function validateSession(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return false;

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    _currentSession = session;
    _currentUser = user;
    return true;
  } catch {
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(profile: Partial<User>): Promise<User | null> {
  // Implementation to be added
  console.warn('updateProfile not implemented yet');
  return null;
} 
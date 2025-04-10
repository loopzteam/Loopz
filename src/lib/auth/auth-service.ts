import { createBrowserClient } from '@/lib/supabase/client';
import { type Session, type User } from '@supabase/supabase-js';

// Singleton instance to maintain consistent state
let _instance: AuthService | null = null;

// Helper function to log only in development mode
function devLog(message: string, ...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...args);
  }
}

// Helper function to log errors (always logged regardless of environment)
function errorLog(message: string, ...args: any[]) {
  console.error(message, ...args);
}

export class AuthService {
  private supabase;
  private _session: Session | null = null;
  private _user: User | null = null;

  private constructor() {
    this.supabase = createBrowserClient();
  }

  static getInstance(): AuthService {
    if (!_instance) {
      _instance = new AuthService();
    }
    return _instance;
  }

  // Initialize the service with current session state
  async initialize(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      const { data: { user } } = await this.supabase.auth.getUser();
      this._session = session;
      this._user = user;
    }
  }

  // Get current session state
  get session(): Session | null {
    return this._session;
  }

  // Get current user state
  get user(): User | null {
    return this._user;
  }

  // Clear all browser storage
  private clearBrowserStorage(): void {
    try {
      devLog('🔥 STORAGE: Beginning complete storage cleanup');
      
      // APPROACH 1: Clear ALL localStorage (more aggressive)
      devLog('🔥 STORAGE: Clearing all localStorage');
      localStorage.clear();
      
      // APPROACH 2: Clear ALL sessionStorage (more aggressive)
      devLog('🔥 STORAGE: Clearing all sessionStorage');
      sessionStorage.clear();
      
      // APPROACH 3: Clear all cookies (aggressive)
      devLog('🔥 STORAGE: Clearing all cookies');
      this.clearAllCookies();
      
      // Also run specific Supabase cookie clearing as a backup
      devLog('🔥 STORAGE: Additional targeted cookie cleanup');
      this.clearSpecificSupabaseCookies();
      
      devLog('🔥 STORAGE: Storage cleanup complete');
    } catch (err) {
      errorLog('🔥 STORAGE ERROR:', err);
    }
  }
  
  // Clear all cookies on the domain
  private clearAllCookies(): void {
    try {
      const cookies = document.cookie.split(';');
      devLog('🔥 COOKIES: Found', cookies.length, 'cookies to clear');
      
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Skip empty cookie names
        if (!name) continue;
        
        devLog('🔥 COOKIES: Clearing cookie:', name);
        
        // Clear with all possible domain/path combinations
        // Root path, current domain
        document.cookie = `${name}=; Max-Age=0; path=/;`;
        
        // Root path, domain specified
        const domain = location.hostname === 'localhost' ? '' : `domain=${location.hostname};`;
        document.cookie = `${name}=; Max-Age=0; path=/; ${domain}`;
        
        // Root path, domain specified, secure+samesite
        document.cookie = `${name}=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
        
        // Try with .domain format (includes subdomains)
        if (location.hostname !== 'localhost') {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}; secure; samesite=lax`;
        }
      }
    } catch (err) {
      errorLog('🔥 COOKIES ERROR:', err);
    }
  }
  
  // Clear specific Supabase cookies (as a backup/fallback)
  private clearSpecificSupabaseCookies(): void {
    try {
      const clearCookie = (name: string) => {
        // Multiple clearing approaches for redundancy
        document.cookie = `${name}=; Max-Age=0; path=/; secure; samesite=lax`;
        
        // Also try clearing with domain specification
        const domain = location.hostname === 'localhost' ? '' : `domain=${location.hostname};`;
        document.cookie = `${name}=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
        
        // If on localhost, try clearing without secure flag
        if (location.hostname === 'localhost') {
          document.cookie = `${name}=; Max-Age=0; path=/;`;
        }
        
        devLog('🔥 COOKIES: Cleared specific cookie:', name);
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? null;
      
      devLog('🔥 COOKIES: Clearing cookies for project ref:', projectRef);
      
      // Clear all common Supabase cookie patterns
      if (projectRef) {
        clearCookie(`sb-${projectRef}-auth-token`);
        clearCookie(`sb-${projectRef}-auth-token-code-verifier`);
        clearCookie(`sb-${projectRef}-provider-token`);
      }
      
      // Clear general Supabase auth cookies
      clearCookie('sb-access-token');
      clearCookie('sb-refresh-token');
      clearCookie('supabase-auth-token');
      
      // Clear Next.js auth cookies
      clearCookie('__session');
      clearCookie('__next-auth.session-token');
      
      const customCookieName = process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME;
      if (customCookieName) {
        clearCookie(customCookieName);
      }
    } catch (err) {
      errorLog('🔥 SPECIFIC COOKIES ERROR:', err);
    }
  }

  // Atomic sign out operation
  async signOut(): Promise<void> {
    try {
      devLog('🔥 SIGNOUT: Starting signout process');
      
      // 1. Clear local state first
      this._session = null;
      this._user = null;

      // 2. Call Supabase signOut BEFORE clearing browser storage
      // This ensures proper server-side session invalidation
      devLog('🔥 SIGNOUT: Invalidating session server-side');
      await this.supabase.auth.signOut({ scope: 'global' });
      
      // 3. Clear all browser storage
      devLog('🔥 SIGNOUT: Clearing browser storage');
      this.clearBrowserStorage();
      
      // 4. Additional cookie clearing for middleware sessions
      devLog('🔥 SIGNOUT: Clearing middleware cookies');
      this.clearMiddlewareSessionCookies();
      
      // 5. Wait for all operations to complete
      devLog('🔥 SIGNOUT: Waiting for operations to complete');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 6. Force a full page reload to clear any in-memory state
      // Add timestamp to prevent caching and ensure middleware re-runs
      devLog('🔥 SIGNOUT: Redirecting to auth page');
      const redirectUrl = `/auth?t=${Date.now()}&clear=true`;
      window.location.replace(redirectUrl); // Use replace instead of href
    } catch (error) {
      errorLog('🔥 SIGNOUT ERROR:', error);
      // Even if there's an error, force reload to auth page
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.replace(`/auth?error=signout_failed&t=${Date.now()}`);
    }
  }
  
  // Additional method to clear middleware-specific cookies
  private clearMiddlewareSessionCookies(): void {
    try {
      // This helps ensure cookies that might be used by middleware are cleared
      const domain = location.hostname === 'localhost' ? '' : `domain=${location.hostname};`;
      
      // Clear sensitive cookies that might persist the session
      document.cookie = `supabase-auth-token=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
      document.cookie = `__session=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
      
      // Specific cookies used by the middleware
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1] ?? null;
      
      if (projectRef) {
        document.cookie = `sb-${projectRef}-auth-token=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
        document.cookie = `sb-${projectRef}-auth-token-code-verifier=; Max-Age=0; path=/; ${domain} secure; samesite=lax`;
      }
    } catch (err) {
      errorLog('Error clearing middleware cookies:', err);
    }
  }

  // Atomic sign in operation
  async signIn(email: string, password: string): Promise<void> {
    const { data: { session, user }, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this._session = session;
    this._user = user;
  }

  // Sign up operation
  async signUp(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    });

    if (error) throw error;
  }

  // Check if session is valid
  async validateSession(): Promise<boolean> {
    try {
      devLog('🔬 AUTH SERVICE: Validating session');
      
      // First check client-side session state
      if (this._session) {
        devLog('🔬 AUTH SERVICE: Found cached session, expires at:', 
          new Date(this._session.expires_at! * 1000).toISOString());
      } else {
        devLog('🔬 AUTH SERVICE: No cached session found');
      }
      
      // Then get fresh session from Supabase
      devLog('🔬 AUTH SERVICE: Requesting fresh session from Supabase');
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        errorLog('🔬 AUTH SERVICE: Error getting session:', sessionError);
        return false;
      }
      
      if (!session) {
        devLog('🔬 AUTH SERVICE: No session returned from Supabase');
        return false;
      }
      
      devLog('🔬 AUTH SERVICE: Session found from Supabase, checking expiry');
      
      // Check if session is expired
      if (session.expires_at) {
        const now = new Date();
        const expiryTime = new Date(session.expires_at * 1000);
        
        devLog('🔬 AUTH SERVICE: Session expires at:', expiryTime.toISOString());
        devLog('🔬 AUTH SERVICE: Current time:', now.toISOString());
        
        if (expiryTime < now) {
          devLog('🔬 AUTH SERVICE: Session is expired!');
          return false;
        }
      }
      
      devLog('🔬 AUTH SERVICE: Retrieving user data');
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        errorLog('🔬 AUTH SERVICE: Error getting user:', userError);
        return false;
      }
      
      if (!user) {
        devLog('🔬 AUTH SERVICE: No user data found');
        return false;
      }
      
      // Update local state
      this._session = session;
      this._user = user;
      
      devLog('🔬 AUTH SERVICE: Session is valid');
      return true;
    } catch (error) {
      errorLog('🔬 AUTH SERVICE: Validate session exception:', error);
      return false;
    }
  }
} 
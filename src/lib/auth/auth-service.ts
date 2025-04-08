import { createBrowserClient } from '@/lib/supabase/client';
import { type Session, type User } from '@supabase/supabase-js';

// Singleton instance to maintain consistent state
let _instance: AuthService | null = null;

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
      // Clear only Supabase-related localStorage items
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear only Supabase-related sessionStorage items
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('sb-') || 
        key.includes('supabase')
      );
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
      
      // Clear all known Supabase cookies
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

  // Atomic sign out operation
  async signOut(): Promise<void> {
    try {
      // 1. Clear local state first
      this._session = null;
      this._user = null;

      // 2. Clear all browser storage
      this.clearBrowserStorage();

      // 3. Sign out from Supabase
      await this.supabase.auth.signOut();

      // 4. Force a full page reload to clear any in-memory state
      window.location.href = '/auth?t=' + Date.now();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, force reload to auth page
      window.location.href = '/auth?error=signout_failed';
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
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return false;

      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error || !user) return false;

      this._session = session;
      this._user = user;
      return true;
    } catch {
      return false;
    }
  }
} 
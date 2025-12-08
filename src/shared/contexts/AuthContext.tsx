import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, AppRole, isSupabaseConfigured } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    if (!supabase) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin' as AppRole,
      });
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      // Check for tenant session in localStorage
      const tenantSession = localStorage.getItem('tenant_session');
      if (tenantSession) {
        try {
          const session = JSON.parse(tenantSession);
          const mockUser = {
            id: session.tenant_id,
            email: session.email,
            user_metadata: {
              tenant_slug: session.tenant_slug,
              tenant_name: session.tenant_name,
            },
          };
          setUser(mockUser as any);
          setSession({ user: mockUser } as any);
        } catch (err) {
          console.error('Error parsing tenant session:', err);
          localStorage.removeItem('tenant_session');
        }
      }
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check for tenant session first
      const tenantSession = localStorage.getItem('tenant_session');
      if (tenantSession && !session) {
        try {
          const tenantData = JSON.parse(tenantSession);
          const mockUser = {
            id: tenantData.tenant_id,
            email: tenantData.email,
            user_metadata: {
              tenant_slug: tenantData.tenant_slug,
              tenant_name: tenantData.tenant_name,
            },
          };
          setUser(mockUser as any);
          setSession({ user: mockUser } as any);
        } catch (err) {
          console.error('Error parsing tenant session:', err);
          localStorage.removeItem('tenant_session');
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          checkAdminRole(session.user.id);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      // Use our custom tenant login verification
      const { data, error } = await supabase.rpc('verify_tenant_login', {
        p_email: email,
        p_password: password,
      });

      if (error) {
        console.error('Login RPC error:', error);
        return { error: new Error('Erreur de connexion') };
      }

      const loginResult = data?.[0];

      if (!loginResult || !loginResult.success) {
        return { error: new Error('Email ou mot de passe incorrect') };
      }

      // Store tenant info in localStorage for session management
      localStorage.setItem('tenant_session', JSON.stringify({
        tenant_id: loginResult.tenant_id,
        tenant_slug: loginResult.tenant_slug,
        tenant_name: loginResult.tenant_name,
        email: email,
        logged_in_at: new Date().toISOString(),
      }));

      // Create a mock user object for compatibility
      const mockUser = {
        id: loginResult.tenant_id,
        email: email,
        user_metadata: {
          tenant_slug: loginResult.tenant_slug,
          tenant_name: loginResult.tenant_name,
        },
      };

      setUser(mockUser as any);
      setSession({ user: mockUser } as any);

      return { error: null };
    } catch (err: any) {
      console.error('Login error:', err);
      return { error: new Error(err.message || 'Erreur de connexion') };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Clear tenant session
    localStorage.removeItem('tenant_session');
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

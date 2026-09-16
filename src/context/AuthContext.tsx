import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, SiteSettings } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  settings: SiteSettings | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUserData: (updated: Partial<User>) => void;
  quickSwitchRole: (role: UserRole) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: 'TechClass',
  brand_tagline: 'Your Digital Classroom for Government Exam Preparation',
  parent_brand: 'DynoDazzle',
  primary_domain: 'https://techclass.dynodazzle.in',
  contact_email: 'dynodazzle@gmail.com',
  whatsapp_support: '+91 7770032149',
  annual_membership_price: 2999,
  upi_id: 'techclass@upi',
  free_test_limit: 3,
  free_pdf_limit: 2
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  settings: defaultSettings,
  login: () => {},
  logout: () => {},
  updateUserData: () => {},
  quickSwitchRole: async () => {}
});

const normalizeUser = (u: User): User => {
  const cleanEmail = u.email?.toLowerCase().trim();
  if (cleanEmail === 'dynodazzle@gmail.com' || cleanEmail === 'admin@techclass.in' || u.is_owner || u.role === 'SUPER_ADMIN') {
    return {
      ...u,
      role: 'SUPER_ADMIN',
      is_admin: true,
      is_owner: true,
      membership_status: 'ACTIVE',
      plan_name: u.plan_name || 'App Owner / Lifetime Master Pass'
    };
  }
  return u;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('techclass_user_cache');
      if (cached) {
        return normalizeUser(JSON.parse(cached));
      }
    } catch (e) {}
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('techclass_token'));
  const [settings, setSettings] = useState<SiteSettings | null>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load public settings
  useEffect(() => {
    apiFetch('/api/settings/public')
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      })
      .catch(err => {
        console.warn('Using default settings (Backend/Netlify offline):', err.message);
      });
  }, []);

  // Validate session token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiFetch('/api/auth/me')
      .then(data => {
        if (data && data.user) {
          const norm = normalizeUser(data.user);
          setUser(norm);
          try {
            localStorage.setItem('techclass_user_cache', JSON.stringify(norm));
          } catch (e) {}
        } else {
          // Stale token
          localStorage.removeItem('techclass_token');
          localStorage.removeItem('techclass_user_cache');
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        // If local user exists, keep session
        try {
          const localUser = localStorage.getItem('techclass_user_cache');
          if (localUser) {
            setUser(normalizeUser(JSON.parse(localUser)));
            return;
          }
        } catch (e) {}

        localStorage.removeItem('techclass_token');
        localStorage.removeItem('techclass_user_cache');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const login = (newToken: string, userData: User) => {
    const normalized = normalizeUser(userData);
    localStorage.setItem('techclass_token', newToken);
    try {
      localStorage.setItem('techclass_user_cache', JSON.stringify(normalized));
    } catch (e) {}
    setToken(newToken);
    setUser(normalized);
  };

  const logout = () => {
    if (token) {
      apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
    localStorage.removeItem('techclass_token');
    localStorage.removeItem('techclass_user_cache');
    setToken(null);
    setUser(null);
  };

  const updateUserData = (updated: Partial<User>) => {
    if (user) {
      const merged = normalizeUser({ ...user, ...updated });
      setUser(merged);
      try {
        localStorage.setItem('techclass_user_cache', JSON.stringify(merged));
      } catch (e) {}
    }
  };

  // Quick switch role utility removed for production security
  const quickSwitchRole = async (_targetRole: UserRole) => {
    console.warn('[Security Notice] Direct role-switching is disabled. Please authenticate with your credentials.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        settings,
        login,
        logout,
        updateUserData,
        quickSwitchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

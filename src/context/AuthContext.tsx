import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, SiteSettings } from '../types';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('techclass_token'));
  const [settings, setSettings] = useState<SiteSettings | null>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load public settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && !data.error) {
          setSettings(data);
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  // Validate session token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          // Stale token
          localStorage.removeItem('techclass_token');
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('techclass_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('techclass_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem('techclass_token');
    setToken(null);
    setUser(null);
  };

  const updateUserData = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
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

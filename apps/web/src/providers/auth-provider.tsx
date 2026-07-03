'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { UserRole, User } from '../types/auth';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/login', '/session-expired', '/unauthorized'];

// Map of route path prefixes to required roles
const ROLE_REQUIREMENTS: Record<string, UserRole[]> = {
  '/dashboard/logs': ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
  '/dashboard/settings': ['SYSTEM_ADMIN', 'ORG_OWNER', 'ORG_ADMIN'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, refreshToken, setSession, clearSession } =
    useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Silent refresh on mount
  useEffect(() => {
    const silentRestore = async () => {
      if (refreshToken && !isAuthenticated) {
        try {
          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const {
            accessToken,
            refreshToken: newRefreshToken,
            user: newUser,
          } = response.data;
          setSession({
            accessToken,
            refreshToken: newRefreshToken,
            user: newUser,
          });
        } catch (err) {
          console.error('Silent session restoration failed:', err);
          clearSession();
          router.replace('/session-expired');
          return;
        }
      }
      setLoading(false);
    };

    silentRestore();
  }, [refreshToken, isAuthenticated, setSession, clearSession, router]);

  // Route protection and RBAC guards
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route),
    );

    if (!isAuthenticated) {
      if (!isPublicRoute) {
        router.replace('/login');
      }
    } else {
      // User is authenticated
      if (isPublicRoute && pathname === '/login') {
        router.replace('/dashboard');
        return;
      }

      // Check RBAC limits
      const matchPath = Object.keys(ROLE_REQUIREMENTS).find((route) =>
        pathname.startsWith(route),
      );
      if (matchPath && user) {
        const allowedRoles = ROLE_REQUIREMENTS[matchPath];
        const isAuthorized =
          user.role === 'SYSTEM_ADMIN' || allowedRoles.includes(user.role);
        if (!isAuthorized) {
          router.replace('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, pathname, router, loading, user]);

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, hasRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

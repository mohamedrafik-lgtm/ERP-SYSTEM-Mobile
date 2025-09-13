import { useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { User, Role } from '../types/auth';

interface UseAuthReturn {
  user: User | null;
  roles: Role[];
  primaryRole: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (roleName: string) => boolean;
  hasMinimumPriority: (priority: number) => boolean;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await AuthService.getUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUserData();
  };

  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some(role => 
      role.name === roleName || 
      role.displayName === roleName
    );
  };

  const hasMinimumPriority = (priority: number): boolean => {
    if (!user?.primaryRole) return false;
    return user.primaryRole.priority >= priority;
  };

  return {
    user,
    roles: user?.roles || [],
    primaryRole: user?.primaryRole || null,
    isAuthenticated,
    loading,
    hasRole,
    hasMinimumPriority,
    refreshUser,
  };
};

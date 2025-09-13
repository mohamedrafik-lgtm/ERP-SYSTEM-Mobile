import { useState, useEffect, useCallback } from 'react';
import PermissionService from '../services/PermissionService';
import { PermissionConfig, UserRole } from '../types/permissions';

interface UsePermissionsReturn {
  canAccess: (screenId: string) => Promise<boolean>;
  canAccessSync: (screenId: string) => boolean;
  allowedScreens: PermissionConfig[];
  allowedMenuSections: any[];
  userRole: string | null;
  userRoleInfo: any;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAccountant: boolean;
  hasMinimumRole: (role: UserRole) => boolean;
  refresh: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [allowedScreens, setAllowedScreens] = useState<PermissionConfig[]>([]);
  const [allowedMenuSections, setAllowedMenuSections] = useState<any[]>([]);
  const [userRoleInfo, setUserRoleInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedPermissions, setCachedPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      
      // تحميل الصلاحيات والقوائم المسموحة
      const [screens, menuSections, roleInfo] = await Promise.all([
        PermissionService.getAllowedScreens(),
        PermissionService.getAllowedMenuSections(),
        PermissionService.getCurrentUserRoleInfo(),
      ]);

      setAllowedScreens(screens);
      setAllowedMenuSections(menuSections);
      setUserRoleInfo(roleInfo);

      // تخزين الصلاحيات في الذاكرة المؤقتة للوصول السريع
      const permissionsCache: Record<string, boolean> = {};
      screens.forEach(screen => {
        permissionsCache[screen.id] = true;
        permissionsCache[screen.screen] = true;
      });
      setCachedPermissions(permissionsCache);

    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = useCallback(async (screenId: string): Promise<boolean> => {
    return await PermissionService.canAccessScreen(screenId);
  }, []);

  const canAccessSync = useCallback((screenId: string): boolean => {
    return cachedPermissions[screenId] || false;
  }, [cachedPermissions]);

  const hasMinimumRole = useCallback((role: UserRole): boolean => {
    if (!userRoleInfo) return false;
    const userLevel = userRoleInfo.level || 999;
    const requiredLevel = PermissionService.getAllScreens().find(s => s.allowedRoles.includes(role))?.priority || 999;
    return userLevel <= requiredLevel;
  }, [userRoleInfo]);

  const refresh = useCallback(async () => {
    await loadPermissions();
  }, []);

  return {
    canAccess,
    canAccessSync,
    allowedScreens,
    allowedMenuSections,
    userRole: userRoleInfo?.name || null,
    userRoleInfo,
    isLoading,
    isSuperAdmin: userRoleInfo?.name === 'super_admin',
    isAdmin: ['super_admin', 'admin'].includes(userRoleInfo?.name),
    isManager: ['super_admin', 'admin', 'manager'].includes(userRoleInfo?.name),
    isAccountant: ['super_admin', 'admin', 'manager', 'accountant'].includes(userRoleInfo?.name),
    hasMinimumRole,
    refresh,
  };
};

// Hook للتحقق من صلاحية شاشة واحدة
export const useScreenPermission = (screenId: string) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [screenId]);

  const checkPermission = async () => {
    try {
      setIsLoading(true);
      const canAccess = await PermissionService.canAccessScreen(screenId);
      setHasPermission(canAccess);
    } catch (error) {
      console.error('Error checking screen permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    await checkPermission();
  }, [screenId]);

  return {
    hasPermission,
    isLoading,
    refresh,
  };
};

// Hook للتحقق من دور المستخدم
export const useUserRole = () => {
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoleInfo();
  }, []);

  const loadRoleInfo = async () => {
    try {
      setIsLoading(true);
      const info = await PermissionService.getCurrentUserRoleInfo();
      setRoleInfo(info);
    } catch (error) {
      console.error('Error loading role info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = useCallback((role: UserRole): boolean => {
    return roleInfo?.name === role;
  }, [roleInfo]);

  const hasMinimumRole = useCallback(async (role: UserRole): Promise<boolean> => {
    return await PermissionService.hasMinimumRole(role);
  }, []);

  const refresh = useCallback(async () => {
    await loadRoleInfo();
  }, []);

  return {
    roleInfo,
    isLoading,
    hasRole,
    hasMinimumRole,
    refresh,
    isSuperAdmin: roleInfo?.name === 'super_admin',
    isAdmin: ['super_admin', 'admin'].includes(roleInfo?.name),
    isManager: ['super_admin', 'admin', 'manager'].includes(roleInfo?.name),
    isAccountant: ['super_admin', 'admin', 'manager', 'accountant'].includes(roleInfo?.name),
    isEmployee: ['super_admin', 'admin', 'manager', 'accountant', 'employee'].includes(roleInfo?.name),
  };
};

export default usePermissions;

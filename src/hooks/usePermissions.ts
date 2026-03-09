// usePermissions Hook - يطابق نظام الويب (Resource + Action)
import { useState, useEffect, useCallback, useMemo } from 'react';
import PermissionService from '../services/PermissionService';
import {
  UserPermissions,
  PermissionAction,
  ScreenPermissionConfig,
  MenuSection,
  UserRole,
} from '../types/permissions';

interface UsePermissionsReturn {
  /** الصلاحيات الخام من الـ API */
  userPermissions: UserPermissions | null;
  /** التحقق من صلاحية (resource + action) */
  hasPermission: (resource: string, action: PermissionAction) => boolean;
  /** اختصارات سريعة */
  canView: (resource: string) => boolean;
  canCreate: (resource: string) => boolean;
  canEdit: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
  canExport: (resource: string) => boolean;
  /** التحقق من صلاحية شاشة */
  canAccessScreen: (screenName: string) => boolean;
  /** التحقق من صلاحية إضافية لشاشة */
  hasScreenAction: (screenName: string, actionKey: string) => boolean;
  /** الشاشات المسموحة */
  allowedScreens: ScreenPermissionConfig[];
  /** أقسام القائمة المفلترة */
  allowedMenuSections: MenuSection[];
  /** التحقق من الدور */
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  /** معلومات الدور */
  userRole: string | null;
  userRoleInfo: {
    name: string;
    displayName: string;
    color: string;
    level: number;
    allRoles: string[];
  } | null;
  /** اختصارات الأدوار */
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAccountant: boolean;
  isInstructor: boolean;
  /** حالة التحميل */
  isLoading: boolean;
  /** إعادة التحميل */
  refresh: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [allowedScreens, setAllowedScreens] = useState<ScreenPermissionConfig[]>([]);
  const [allowedMenuSections, setAllowedMenuSections] = useState<MenuSection[]>([]);
  const [userRoleInfo, setUserRoleInfo] = useState<UsePermissionsReturn['userRoleInfo']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);

      const [perms, screens, sections, roleInfo] = await Promise.all([
        PermissionService.fetchUserPermissions(),
        PermissionService.getAllowedScreens(),
        PermissionService.getAllowedMenuSections(),
        PermissionService.getCurrentUserRoleInfo(),
      ]);

      setUserPermissions(perms);
      setAllowedScreens(screens);
      setAllowedMenuSections(sections);
      setUserRoleInfo(roleInfo);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Permission Checks ============

  const hasPermission = useCallback(
    (resource: string, action: PermissionAction): boolean => {
      return PermissionService.hasPermission(userPermissions, resource, action);
    },
    [userPermissions],
  );

  const canView = useCallback(
    (resource: string) => hasPermission(resource, 'view'),
    [hasPermission],
  );

  const canCreate = useCallback(
    (resource: string) => hasPermission(resource, 'create'),
    [hasPermission],
  );

  const canEdit = useCallback(
    (resource: string) => hasPermission(resource, 'edit'),
    [hasPermission],
  );

  const canDelete = useCallback(
    (resource: string) => hasPermission(resource, 'delete'),
    [hasPermission],
  );

  const canManage = useCallback(
    (resource: string) => hasPermission(resource, 'manage'),
    [hasPermission],
  );

  const canExport = useCallback(
    (resource: string) => hasPermission(resource, 'export'),
    [hasPermission],
  );

  // ============ Screen Access ============

  const canAccessScreen = useCallback(
    (screenName: string): boolean => {
      return allowedScreens.some(s => s.screenName === screenName);
    },
    [allowedScreens],
  );

  const hasScreenAction = useCallback(
    (screenName: string, actionKey: string): boolean => {
      const config = PermissionService.findScreen(screenName);
      if (!config?.additionalPermissions?.[actionKey]) return false;
      const { resource, action } = config.additionalPermissions[actionKey];
      return PermissionService.hasPermission(userPermissions, resource, action);
    },
    [userPermissions],
  );

  // ============ Role Checks ============

  const hasRole = useCallback(
    (roleName: string): boolean => {
      return userPermissions?.roles.includes(roleName) || false;
    },
    [userPermissions],
  );

  const hasAnyRole = useCallback(
    (roleNames: string[]): boolean => {
      return roleNames.some(r => userPermissions?.roles.includes(r) || false);
    },
    [userPermissions],
  );

  const isSuperAdmin = useMemo(
    () => userPermissions?.roles.includes('super_admin') || false,
    [userPermissions],
  );
  const isAdmin = useMemo(
    () => hasAnyRole(['super_admin', 'admin']),
    [hasAnyRole],
  );
  const isManager = useMemo(
    () => hasAnyRole(['super_admin', 'admin', 'manager']),
    [hasAnyRole],
  );
  const isAccountant = useMemo(
    () => hasAnyRole(['super_admin', 'admin', 'manager', 'accountant']),
    [hasAnyRole],
  );
  const isInstructor = useMemo(
    () => userPermissions?.roles.includes('instructor') || false,
    [userPermissions],
  );

  const refresh = useCallback(async () => {
    await PermissionService.clearCache();
    await loadPermissions();
  }, []);

  return {
    userPermissions,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    canExport,
    canAccessScreen,
    hasScreenAction,
    allowedScreens,
    allowedMenuSections,
    hasRole,
    hasAnyRole,
    userRole: userRoleInfo?.name || null,
    userRoleInfo,
    isSuperAdmin,
    isAdmin,
    isManager,
    isAccountant,
    isInstructor,
    isLoading,
    refresh,
  };
};

// ============ Hook لفحص صلاحية شاشة واحدة ============

export const useScreenPermission = (screenName: string) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screenActions, setScreenActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkPermission();
  }, [screenName]);

  const checkPermission = async () => {
    try {
      setIsLoading(true);
      const canAccess = await PermissionService.canAccessScreen(screenName);
      setHasPermission(canAccess);

      // فحص الصلاحيات الإضافية
      const config = PermissionService.findScreen(screenName);
      if (config?.additionalPermissions) {
        const actions: Record<string, boolean> = {};
        for (const key of Object.keys(config.additionalPermissions)) {
          actions[key] = await PermissionService.hasScreenAction(screenName, key);
        }
        setScreenActions(actions);
      }
    } catch (error) {
      console.error('Error checking screen permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    hasPermission,
    isLoading,
    /** صلاحيات إضافية (create, edit, delete, manage, إلخ) */
    actions: screenActions,
    canCreate: screenActions.create || false,
    canEdit: screenActions.edit || false,
    canDelete: screenActions.delete || false,
    canManage: screenActions.manage || false,
    canExport: screenActions.export || false,
    canTransfer: screenActions.transfer || false,
    refresh: checkPermission,
  };
};

export default usePermissions;

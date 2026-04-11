// Permission Service - يجلب الصلاحيات من الـ Backend API مثل الويب
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserPermissions,
  PermissionCheck,
  PermissionAction,
  ScreenPermissionConfig,
  MenuSection,
  SCREEN_PERMISSIONS,
  MENU_SECTIONS,
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS,
} from '../types/permissions';
import AuthService from './AuthService';
import { getCurrentApiBaseUrl } from '../config/api';

const PERMISSIONS_CACHE_KEY = 'user_permissions_cache';
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

interface CachedPermissions {
  data: UserPermissions;
  timestamp: number;
}

/**
 * Permission Action Hierarchy
 * manage > delete > edit > create > view
 */
const ACTION_HIERARCHY: Record<PermissionAction, number> = {
  read: 1,
  view: 1,
  create: 2,
  edit: 3,
  delete: 4,
  export: 5,
  export_data: 5,
  transfer: 5,
  manage: 6,
};

class PermissionService {
  private static cachedPermissions: CachedPermissions | null = null;

  /**
   * جلب صلاحيات المستخدم من الـ API
   */
  static async fetchUserPermissions(): Promise<UserPermissions | null> {
    try {
      // التحقق من الكاش أولاً
      if (this.cachedPermissions) {
        const age = Date.now() - this.cachedPermissions.timestamp;
        if (age < PERMISSIONS_CACHE_TTL) {
          return this.cachedPermissions.data;
        }
      }

      // التحقق من الكاش المخزن
      const stored = await AsyncStorage.getItem(PERMISSIONS_CACHE_KEY);
      if (stored) {
        const parsed: CachedPermissions = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        if (age < PERMISSIONS_CACHE_TTL) {
          this.cachedPermissions = parsed;
          return parsed.data;
        }
      }

      // جلب من الـ API
      const user = await AuthService.getUser();
      if (!user?.id) return null;

      const token = await AuthService.getToken();
      if (!token) return null;

      const baseUrl = await getCurrentApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/permissions/users/${user.id}/permissions`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 401) {
        await AuthService.clearAuthData();
        return null;
      }

      if (!response.ok) {
        console.warn('Failed to fetch permissions, using role-based fallback');
        return this.getFallbackPermissions();
      }

      const data = await response.json();
      const permissions: UserPermissions = {
        roles: data.roles || [],
        permissions: data.permissions || {},
      };

      // تخزين الكاش
      const cache: CachedPermissions = {
        data: permissions,
        timestamp: Date.now(),
      };
      this.cachedPermissions = cache;
      await AsyncStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(cache));

      return permissions;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return this.getFallbackPermissions();
    }
  }

  /**
   * Fallback: بناء صلاحيات من الأدوار المحلية إذا فشل الاتصال بالـ API
   */
  private static async getFallbackPermissions(): Promise<UserPermissions | null> {
    try {
      const user = await AuthService.getUser();
      if (!user) return null;

      const roleName = user.primaryRole?.name || user.roles?.[0]?.name;
      if (!roleName) return null;

      return {
        roles: [roleName],
        permissions: this.buildFallbackPermissions(roleName),
      };
    } catch {
      return null;
    }
  }

  /**
   * بناء صلاحيات افتراضية بناءً على الدور (fallback فقط)
   */
  private static buildFallbackPermissions(role: string): Record<string, boolean> {
    const perms: Record<string, boolean> = {};

    // super_admin و admin يحصلوا على كل الصلاحيات
    if (role === 'super_admin' || role === 'admin') {
      Object.values(SCREEN_PERMISSIONS).forEach(screen => {
        const { resource, action } = screen.requiredPermission;
        perms[`${resource}.${action}`] = true;
        if (screen.additionalPermissions) {
          Object.values(screen.additionalPermissions).forEach(p => {
            perms[`${p.resource}.${p.action}`] = true;
          });
        }
      });
      perms['dashboard.view'] = true;
      return perms;
    }

    // manager
    if (role === 'manager') {
      const managerResources = [
        'dashboard', 'dashboard.trainees', 'dashboard.programs',
        'dashboard.training-contents', 'dashboard.questions', 'dashboard.quizzes',
        'dashboard.attendance', 'dashboard.schedule', 'dashboard.classrooms',
        'dashboard.financial', 'dashboard.financial.reports', 'dashboard.financial.payment-schedules',
        'dashboard.grades', 'dashboard.deferral-requests',
        'dashboard.trainee-requests', 'dashboard.trainee-documents',
        'dashboard.trainees.distribution',
        'marketing.employees', 'marketing.targets', 'marketing.applications', 'marketing.stats',
        'study-materials', 'study-materials.deliveries',
      ];
      managerResources.forEach(r => {
        perms[`${r}.view`] = true;
        perms[`${r}.create`] = true;
        perms[`${r}.edit`] = true;
      });
      // Staff attendance
      const staffResources = [
        'staff-attendance', 'staff-attendance.enrollments',
        'staff-attendance.leaves', 'staff-attendance.settings',
        'staff-attendance.holidays',
      ];
      staffResources.forEach(r => {
        perms[`${r}.view`] = true;
        perms[`${r}.manage`] = true;
      });
      return perms;
    }

    // accountant
    if (role === 'accountant') {
      perms['dashboard.view'] = true;
      perms['dashboard.financial.view'] = true;
      perms['dashboard.financial.manage'] = true;
      perms['dashboard.financial.reports.view'] = true;
      perms['dashboard.financial.payment-schedules.view'] = true;
      perms['dashboard.trainees.view'] = true;
      perms['dashboard.trainees.create'] = true;
      perms['dashboard.programs.view'] = true;
      perms['dashboard.grades.view'] = true;
      perms['dashboard.deferral-requests.view'] = true;
      perms['dashboard.attendance.view'] = true;
      return perms;
    }

    // employee
    if (role === 'employee') {
      perms['dashboard.view'] = true;
      perms['dashboard.trainees.view'] = true;
      perms['dashboard.programs.view'] = true;
      perms['dashboard.attendance.view'] = true;
      perms['study-materials.view'] = true;
      perms['study-materials.deliveries.view'] = true;
      return perms;
    }

    // trainee_entry_clerk
    if (role === 'trainee_entry_clerk') {
      perms['dashboard.view'] = true;
      perms['dashboard.trainees.view'] = true;
      perms['dashboard.trainees.create'] = true;
      perms['dashboard.programs.view'] = true;
      perms['dashboard.attendance.view'] = true;
      return perms;
    }

    // instructor
    if (role === 'instructor') {
      perms['dashboard.view'] = true;
      perms['dashboard.attendance.view'] = true;
      perms['dashboard.attendance.create'] = true;
      perms['dashboard.training-contents.view'] = true;
      perms['dashboard.questions.view'] = true;
      return perms;
    }

    // أدنى صلاحية
    perms['dashboard.view'] = true;
    return perms;
  }

  /**
   * التحقق من صلاحية محددة (resource + action)
   * يشمل التسلسل الهرمي: manage يتضمن كل الإجراءات
   */
  static hasPermission(
    userPerms: UserPermissions | null,
    resource: string,
    action: PermissionAction,
  ): boolean {
    if (!userPerms) return false;

    // super_admin يحصل على كل شيء
    if (userPerms.roles.includes('super_admin')) return true;

    // admin يحصل على كل شيء (مطابقة منطق الويب)
    if (userPerms.roles.includes('admin')) return true;

    const key = `${resource}.${action}`;

    // فحص مباشر
    if (userPerms.permissions[key] === true) return true;

    // فحص التسلسل الهرمي: manage يتضمن كل الإجراءات
    if (action !== 'manage') {
      const manageKey = `${resource}.manage`;
      if (userPerms.permissions[manageKey] === true) return true;
    }

    // edit يتضمن view
    if (action === 'view') {
      if (userPerms.permissions[`${resource}.edit`] === true) return true;
      if (userPerms.permissions[`${resource}.create`] === true) return true;
      if (userPerms.permissions[`${resource}.delete`] === true) return true;
      if (userPerms.permissions[`${resource}.export`] === true) return true;
      if (userPerms.permissions[`${resource}.export_data`] === true) return true;
    }

    // دعم read كمرادف للعرض لبعض الموارد
    if (action === 'read') {
      if (userPerms.permissions[`${resource}.view`] === true) return true;
      if (userPerms.permissions[`${resource}.manage`] === true) return true;
    }

    // صلاحيات مترابطة خاصة (مطابقة منطق الويب)
    if (resource === 'dashboard.trainees' && action === 'view') {
      if (
        userPerms.permissions['dashboard.trainee-documents.view'] === true ||
        userPerms.permissions['dashboard.trainee-documents.edit'] === true ||
        userPerms.permissions['dashboard.trainee-documents.delete'] === true
      ) {
        return true;
      }
    }

    if (resource === 'dashboard.trainees' && action === 'edit') {
      if (userPerms.permissions['dashboard.trainee-documents.edit'] === true) {
        return true;
      }
    }

    return false;
  }

  /**
   * مطابقة منطق الويب للصفحات المالية:
   * السماح للمحاسب/المدير/الإدمن بدخول صفحات /dashboard/finances
   */
  private static canAccessFinancialPages(userPerms: UserPermissions | null): boolean {
    if (!userPerms) return false;

    return (
      this.hasPermission(userPerms, 'dashboard.financial', 'view') ||
      this.hasPermission(userPerms, 'dashboard.financial', 'manage') ||
      userPerms.roles.includes('accountant') ||
      userPerms.roles.includes('admin') ||
      userPerms.roles.includes('manager') ||
      userPerms.roles.includes('super_admin')
    );
  }

  /**
   * فحص صلاحية مع fallback مطابق للويب للموارد المالية فقط
   */
  private static hasPermissionWithWebFallback(
    userPerms: UserPermissions | null,
    resource: string,
    action: PermissionAction,
  ): boolean {
    if (this.hasPermission(userPerms, resource, action)) {
      return true;
    }

    if (resource.startsWith('dashboard.financial')) {
      return this.canAccessFinancialPages(userPerms);
    }

    return false;
  }

  /**
   * توحيد فحص صلاحية الشاشة بين الحارس والقائمة
   */
  private static canAccessScreenConfig(
    userPerms: UserPermissions | null,
    config: ScreenPermissionConfig,
  ): boolean {
    const { resource, action } = config.requiredPermission;
    return this.hasPermissionWithWebFallback(userPerms, resource, action);
  }

  /**
   * التحقق من صلاحية الوصول لشاشة
   */
  static async canAccessScreen(screenName: string): Promise<boolean> {
    const config = SCREEN_PERMISSIONS[screenName];
    if (!config) return true; // إذا الشاشة غير معرفة, اسمحلها

    const perms = await this.fetchUserPermissions();
    if (!perms) return false;

    return this.canAccessScreenConfig(perms, config);
  }

  /**
   * التحقق من صلاحية إضافية لشاشة (مثل: إنشاء، تعديل، حذف)
   */
  static async hasScreenAction(
    screenName: string,
    actionKey: string,
  ): Promise<boolean> {
    const config = SCREEN_PERMISSIONS[screenName];
    if (!config?.additionalPermissions?.[actionKey]) return false;

    const perms = await this.fetchUserPermissions();
    if (!perms) return false;

    const { resource, action } = config.additionalPermissions[actionKey];
    return this.hasPermission(perms, resource, action);
  }

  /**
   * جلب الشاشات المسموح بها
   */
  static async getAllowedScreens(): Promise<ScreenPermissionConfig[]> {
    const perms = await this.fetchUserPermissions();
    if (!perms) return [];

    return Object.values(SCREEN_PERMISSIONS).filter(screen =>
      this.canAccessScreenConfig(perms, screen),
    );
  }

  /**
   * جلب أقسام القائمة المفلترة بالصلاحيات
   */
  static async getAllowedMenuSections(): Promise<MenuSection[]> {
    const perms = await this.fetchUserPermissions();
    if (!perms) return [];

    return MENU_SECTIONS
      .map(section => {
        // فلترة عناصر القسم
        const allowedItems = section.items.filter(item => {
          return this.canAccessScreenConfig(perms, item);
        });

        // التحقق من صلاحية القسم ككل
        if (section.requiredPermissions && allowedItems.length > 0) {
          const hasAccess = section.requireAll
            ? section.requiredPermissions.every(p =>
                this.hasPermissionWithWebFallback(
                  perms,
                  p.resource,
                  p.action as PermissionAction,
                ),
              )
            : section.requiredPermissions.some(p =>
                this.hasPermissionWithWebFallback(
                  perms,
                  p.resource,
                  p.action as PermissionAction,
                ),
              );

          if (!hasAccess) return null;
        }

        return allowedItems.length > 0
          ? { ...section, items: allowedItems }
          : null;
      })
      .filter((s): s is MenuSection => s !== null);
  }

  /**
   * التحقق من دور محدد
   */
  static async hasRole(roleName: string): Promise<boolean> {
    const perms = await this.fetchUserPermissions();
    return perms?.roles.includes(roleName) || false;
  }

  /**
   * التحقق من حد أدنى للدور
   */
  static async hasMinimumRole(minimumRole: string): Promise<boolean> {
    const perms = await this.fetchUserPermissions();
    if (!perms) return false;

    const minimumLevel = ROLE_HIERARCHY[minimumRole] || 999;
    return perms.roles.some(role => {
      const level = ROLE_HIERARCHY[role] || 999;
      return level <= minimumLevel;
    });
  }

  /**
   * جلب معلومات الدور الحالي
   */
  static async getCurrentUserRoleInfo() {
    try {
      const perms = await this.fetchUserPermissions();
      if (!perms || perms.roles.length === 0) return null;

      // الحصول على أعلى دور
      const sortedRoles = [...perms.roles].sort((a, b) => {
        return (ROLE_HIERARCHY[a] || 999) - (ROLE_HIERARCHY[b] || 999);
      });
      const primaryRole = sortedRoles[0];

      return {
        name: primaryRole,
        displayName: ROLE_DISPLAY_NAMES[primaryRole] || primaryRole,
        color: ROLE_COLORS[primaryRole] || '#666666',
        level: ROLE_HIERARCHY[primaryRole] || 999,
        allRoles: perms.roles,
      };
    } catch {
      return null;
    }
  }

  /**
   * جلب اسم الدور بالعربية
   */
  static getRoleDisplayName(role: string): string {
    return ROLE_DISPLAY_NAMES[role] || role;
  }

  /**
   * جلب لون الدور
   */
  static getRoleColor(role: string): string {
    return ROLE_COLORS[role] || '#666666';
  }

  /**
   * مسح كاش الصلاحيات
   */
  static async clearCache(): Promise<void> {
    this.cachedPermissions = null;
    await AsyncStorage.removeItem(PERMISSIONS_CACHE_KEY);
  }

  /**
   * رسالة عدم الصلاحية
   */
  static getAccessDeniedMessage(screenName?: string): string {
    const base = 'عذراً، ليس لديك صلاحية للوصول';
    return screenName ? `${base} إلى ${screenName}` : `${base} لهذه الصفحة`;
  }

  /**
   * جلب كل الشاشات المعرفة
   */
  static getAllScreens(): ScreenPermissionConfig[] {
    return Object.values(SCREEN_PERMISSIONS);
  }

  /**
   * البحث عن شاشة بالاسم
   */
  static findScreen(screenName: string): ScreenPermissionConfig | undefined {
    return SCREEN_PERMISSIONS[screenName];
  }
}

export default PermissionService;

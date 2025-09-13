import { 
  UserRole, 
  PermissionConfig, 
  SCREEN_PERMISSIONS, 
  MENU_SECTIONS, 
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS 
} from '../types/permissions';
import AuthService from './AuthService';
import { User, Role } from '../types/auth';

export class PermissionService {
  
  /**
   * التحقق من صلاحية المستخدم للوصول لشاشة محددة
   */
  static async canAccessScreen(screenId: string): Promise<boolean> {
    try {
      const user = await AuthService.getUser();
      if (!user) return false;

      const permission = SCREEN_PERMISSIONS.find(p => p.id === screenId || p.screen === screenId);
      if (!permission) return false;

      const userRole = this.getUserPrimaryRole(user);
      if (!userRole) return false;

      return permission.allowedRoles.includes(userRole as UserRole);
    } catch (error) {
      console.error('Error checking screen access:', error);
      return false;
    }
  }

  /**
   * جلب جميع الشاشات المسموحة للمستخدم الحالي
   */
  static async getAllowedScreens(): Promise<PermissionConfig[]> {
    try {
      const user = await AuthService.getUser();
      if (!user) return [];

      const userRole = this.getUserPrimaryRole(user);
      if (!userRole) return [];

      return SCREEN_PERMISSIONS.filter(permission => 
        permission.allowedRoles.includes(userRole as UserRole)
      );
    } catch (error) {
      console.error('Error getting allowed screens:', error);
      return [];
    }
  }

  /**
   * جلب أقسام القائمة المسموحة للمستخدم
   */
  static async getAllowedMenuSections() {
    try {
      const allowedScreens = await this.getAllowedScreens();
      const allowedScreenIds = allowedScreens.map(screen => screen.id);

      return MENU_SECTIONS.map(section => ({
        ...section,
        items: section.items.filter(item => allowedScreenIds.includes(item.id))
      })).filter(section => section.items.length > 0);
    } catch (error) {
      console.error('Error getting allowed menu sections:', error);
      return [];
    }
  }

  /**
   * التحقق من كون المستخدم له دور معين أو أعلى
   */
  static async hasMinimumRole(minimumRole: UserRole): Promise<boolean> {
    try {
      const user = await AuthService.getUser();
      if (!user) return false;

      const userRole = this.getUserPrimaryRole(user);
      if (!userRole) return false;

      const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole];
      const minimumRoleLevel = ROLE_HIERARCHY[minimumRole];

      return userRoleLevel <= minimumRoleLevel; // أقل رقم = صلاحية أعلى
    } catch (error) {
      console.error('Error checking minimum role:', error);
      return false;
    }
  }

  /**
   * التحقق من كون المستخدم مدير عام
   */
  static async isSuperAdmin(): Promise<boolean> {
    return this.hasMinimumRole('super_admin');
  }

  /**
   * التحقق من كون المستخدم مدير نظام أو أعلى
   */
  static async isAdmin(): Promise<boolean> {
    return this.hasMinimumRole('admin');
  }

  /**
   * التحقق من كون المستخدم مدير أو أعلى
   */
  static async isManager(): Promise<boolean> {
    return this.hasMinimumRole('manager');
  }

  /**
   * التحقق من كون المستخدم محاسب أو أعلى
   */
  static async isAccountant(): Promise<boolean> {
    return this.hasMinimumRole('accountant');
  }

  /**
   * جلب الدور الأساسي للمستخدم
   */
  private static getUserPrimaryRole(user: User): string | null {
    // التحقق من البنية الجديدة أولاً
    if (user.primaryRole && user.primaryRole.name) {
      return user.primaryRole.name;
    }

    // البحث في الأدوار عن أعلى دور
    if (user.roles && user.roles.length > 0) {
      const sortedRoles = user.roles.sort((a, b) => {
        const priorityA = ROLE_HIERARCHY[a.name as UserRole] || 999;
        const priorityB = ROLE_HIERARCHY[b.name as UserRole] || 999;
        return priorityA - priorityB;
      });
      return sortedRoles[0].name;
    }

    return null;
  }

  /**
   * جلب اسم الدور بالعربية
   */
  static getRoleDisplayName(role: UserRole): string {
    return ROLE_DISPLAY_NAMES[role] || role;
  }

  /**
   * جلب لون الدور
   */
  static getRoleColor(role: UserRole): string {
    return ROLE_COLORS[role] || '#666666';
  }

  /**
   * جلب معلومات الدور الحالي للمستخدم
   */
  static async getCurrentUserRoleInfo() {
    try {
      const user = await AuthService.getUser();
      if (!user) return null;

      const roleName = this.getUserPrimaryRole(user);
      if (!roleName) return null;

      return {
        name: roleName,
        displayName: this.getRoleDisplayName(roleName as UserRole),
        color: this.getRoleColor(roleName as UserRole),
        level: ROLE_HIERARCHY[roleName as UserRole] || 999
      };
    } catch (error) {
      console.error('Error getting current user role info:', error);
      return null;
    }
  }

  /**
   * فلترة العناصر حسب الصلاحيات
   */
  static async filterItemsByPermission<T extends { requiredRole?: UserRole }>(
    items: T[]
  ): Promise<T[]> {
    try {
      const user = await AuthService.getUser();
      if (!user) return [];

      const userRole = this.getUserPrimaryRole(user);
      if (!userRole) return [];

      const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole];

      return items.filter(item => {
        if (!item.requiredRole) return true;
        const requiredRoleLevel = ROLE_HIERARCHY[item.requiredRole];
        return userRoleLevel <= requiredRoleLevel;
      });
    } catch (error) {
      console.error('Error filtering items by permission:', error);
      return [];
    }
  }

  /**
   * التحقق من صلاحية حذف/تعديل عنصر
   */
  static async canModifyItem(
    createdBy?: string, 
    requiredRole?: UserRole
  ): Promise<boolean> {
    try {
      const user = await AuthService.getUser();
      if (!user) return false;

      // المدير العام يستطيع تعديل كل شيء
      if (await this.isSuperAdmin()) return true;

      // التحقق من الدور المطلوب
      if (requiredRole && !(await this.hasMinimumRole(requiredRole))) {
        return false;
      }

      // إذا كان العنصر منشأ من قبل المستخدم نفسه
      if (createdBy && createdBy === user.id) return true;

      // التحقق من الصلاحية العامة للتعديل
      return await this.isManager();
    } catch (error) {
      console.error('Error checking modify permission:', error);
      return false;
    }
  }

  /**
   * إنشاء رسالة خطأ عدم وجود صلاحية
   */
  static getAccessDeniedMessage(screenName?: string): string {
    const baseMessage = 'عذراً، ليس لديك صلاحية للوصول';
    return screenName ? `${baseMessage} إلى ${screenName}` : `${baseMessage} لهذه الصفحة`;
  }

  /**
   * جلب قائمة الشاشات للتطوير والاختبار
   */
  static getAllScreens(): PermissionConfig[] {
    return SCREEN_PERMISSIONS;
  }

  /**
   * البحث عن شاشة بالاسم أو المعرف
   */
  static findScreen(identifier: string): PermissionConfig | undefined {
    return SCREEN_PERMISSIONS.find(
      screen => 
        screen.id === identifier || 
        screen.screen === identifier ||
        screen.title.includes(identifier)
    );
  }
}

export default PermissionService;

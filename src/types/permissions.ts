// Permission System Types and Configurations

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'manager' 
  | 'accountant' 
  | 'employee' 
  | 'trainee_entry_clerk';

export interface PermissionConfig {
  id: string;
  title: string;
  icon: string;
  screen: string;
  priority: number;
  allowedRoles: UserRole[];
  category: 'home' | 'academic' | 'marketing' | 'financial' | 'automation' | 'system' | 'exams' | 'student_platform';
  description?: string;
  isLogout?: boolean;
}

export interface MenuSection {
  title: string;
  category: string;
  items: PermissionConfig[];
}

// تكوين صلاحيات جميع الصفحات
export const SCREEN_PERMISSIONS: PermissionConfig[] = [
  // الصفحة الرئيسية
  {
    id: 'Home',
    title: 'الرئيسية',
    icon: 'home',
    screen: 'Home',
    priority: 1,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant', 'employee', 'trainee_entry_clerk'],
    category: 'home',
    description: 'الصفحة الرئيسية للنظام'
  },

  // الإدارة الأكاديمية
  {
    id: 'StudentsList',
    title: 'الطلاب',
    icon: 'people',
    screen: 'StudentsList',
    priority: 2,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant', 'trainee_entry_clerk'],
    category: 'academic',
    description: 'عرض وإدارة قائمة الطلاب'
  },
  {
    id: 'AddStudent',
    title: 'إضافة طالب',
    icon: 'person-add',
    screen: 'AddStudent',
    priority: 2.1,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant', 'trainee_entry_clerk'],
    category: 'academic',
    description: 'إضافة طالب جديد للنظام'
  },
  {
    id: 'UsersList',
    title: 'المستخدمون',
    icon: 'group',
    screen: 'UsersList',
    priority: 2.5,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'academic',
    description: 'إدارة المستخدمين'
  },
  {
    id: 'AddUser',
    title: 'إضافة مستخدم',
    icon: 'person-add',
    screen: 'AddUser',
    priority: 2.6,
    allowedRoles: ['super_admin', 'admin'],
    category: 'academic',
    description: 'إضافة مستخدم جديد'
  },
  {
    id: 'Programs',
    title: 'البرامج التدريبية',
    icon: 'school',
    screen: 'Programs',
    priority: 3,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'academic',
    description: 'إدارة البرامج التدريبية'
  },
  {
    id: 'AddProgram',
    title: 'إضافة برنامج',
    icon: 'add-box',
    screen: 'AddProgram',
    priority: 3.1,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'academic',
    description: 'إضافة برنامج تدريبي جديد'
  },
  {
    id: 'TrainingContents',
    title: 'المحتوى التدريبي',
    icon: 'library-books',
    screen: 'TrainingContents',
    priority: 4,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'academic',
    description: 'إدارة المحتوى التدريبي'
  },
  {
    id: 'AddTrainingContent',
    title: 'إضافة محتوى تدريبي',
    icon: 'note-add',
    screen: 'AddTrainingContent',
    priority: 4.1,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'academic',
    description: 'إضافة محتوى تدريبي جديد'
  },

  // إدارة التسويق
  {
    id: 'Marketers',
    title: 'موظفي التسويق',
    icon: 'campaign',
    screen: 'Marketers',
    priority: 5,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'marketing',
    description: 'إدارة موظفي التسويق'
  },
  {
    id: 'AddMarketer',
    title: 'إضافة مسوق',
    icon: 'person-add-alt',
    screen: 'AddMarketer',
    priority: 5.1,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'marketing',
    description: 'إضافة مسوق جديد'
  },
  {
    id: 'TargetSetting',
    title: 'تحديد التارجيت',
    icon: 'track-changes',
    screen: 'TargetSetting',
    priority: 5.5,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'marketing',
    description: 'تحديد أهداف التسويق'
  },
  {
    id: 'MarketingTrainees',
    title: 'المتدربين مع تفاصيل التسويق',
    icon: 'people',
    screen: 'MarketingTrainees',
    priority: 5.7,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'marketing',
    description: 'عرض المتدربين مع بيانات التسويق'
  },
  {
    id: 'MarketingStats',
    title: 'إحصائيات التسويق',
    icon: 'analytics',
    screen: 'MarketingStats',
    priority: 5.8,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'marketing',
    description: 'عرض إحصائيات الأداء التسويقي'
  },

  // الأتمتة التلقائية
  {
    id: 'WhatsAppManagement',
    title: 'إدارة WhatsApp',
    icon: 'chat',
    screen: 'WhatsAppManagement',
    priority: 6,
    allowedRoles: ['super_admin', 'admin'],
    category: 'automation',
    description: 'إدارة رسائل WhatsApp التلقائية'
  },

  // الإدارة المالية
  {
    id: 'Treasury',
    title: 'الخزائن المالية',
    icon: 'account-balance',
    screen: 'Treasury',
    priority: 7,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant'],
    category: 'financial',
    description: 'إدارة الخزائن المالية'
  },
  {
    id: 'AddTreasury',
    title: 'إضافة خزينة',
    icon: 'add-business',
    screen: 'AddTreasury',
    priority: 7.1,
    allowedRoles: ['super_admin', 'admin', 'accountant'],
    category: 'financial',
    description: 'إضافة خزينة مالية جديدة'
  },
  {
    id: 'Fees',
    title: 'الرسوم المالية',
    icon: 'account-balance-wallet',
    screen: 'Fees',
    priority: 7.5,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant'],
    category: 'financial',
    description: 'إدارة الرسوم المالية'
  },
  {
    id: 'AddFee',
    title: 'إضافة رسوم',
    icon: 'add-card',
    screen: 'AddFee',
    priority: 7.6,
    allowedRoles: ['super_admin', 'admin', 'accountant'],
    category: 'financial',
    description: 'إضافة رسوم مالية جديدة'
  },
  {
    id: 'TraineePayments',
    title: 'مدفوعات المتدربين',
    icon: 'payment',
    screen: 'TraineePayments',
    priority: 8,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant'],
    category: 'financial',
    description: 'إدارة مدفوعات المتدربين'
  },



  // إدارة النظام
  {
    id: 'Permissions',
    title: 'الصلاحيات',
    icon: 'lock',
    screen: 'Permissions',
    priority: 9,
    allowedRoles: ['super_admin'],
    category: 'system',
    description: 'إدارة صلاحيات المستخدمين'
  },
  {
    id: 'AddPermission',
    title: 'إضافة صلاحية',
    icon: 'lock-open',
    screen: 'AddPermission',
    priority: 9.1,
    allowedRoles: ['super_admin'],
    category: 'system',
    description: 'إضافة صلاحية جديدة'
  },

  // إدارة الاختبارات
  {
    id: 'Questions',
    title: 'بنك الأسئلة',
    icon: 'help',
    screen: 'Questions',
    priority: 1,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'exams',
    description: 'إدارة بنك الأسئلة'
  },
  {
    id: 'AddQuestion',
    title: 'إضافة سؤال',
    icon: 'help-outline',
    screen: 'AddQuestion',
    priority: 2,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'exams',
    description: 'إضافة سؤال جديد لبنك الأسئلة'
  },
  {
    id: 'QuizManagement',
    title: 'إدارة الاختبارات المصغرة',
    icon: 'assignment',
    screen: 'QuizManagement',
    priority: 3,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'exams',
    description: 'إدارة الاختبارات المصغرة والامتحانات'
  },
  {
    id: 'AddQuiz',
    title: 'إضافة اختبار مصغر',
    icon: 'add-box',
    screen: 'AddQuiz',
    priority: 4,
    allowedRoles: ['super_admin', 'admin', 'manager'],
    category: 'exams',
    description: 'إضافة اختبار مصغر جديد'
  },

  // إدارة منصة الطلاب
  {
    id: 'TraineeAccounts',
    title: 'حسابات المتدربين',
    icon: 'account-circle',
    screen: 'TraineeAccounts',
    priority: 1,
    allowedRoles: ['super_admin', 'admin', 'manager', 'accountant', 'employee', 'trainee_entry_clerk'],
    category: 'student_platform',
    description: 'إدارة حسابات المتدربين في المنصة'
  },

];

// تجميع الصفحات حسب الفئات للقائمة
export const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'الرئيسية',
    category: 'home',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'home')
  },
  {
    title: 'الإدارة الأكاديمية',
    category: 'academic',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'academic')
  },
  {
    title: 'إدارة الاختبارات',
    category: 'exams',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'exams')
  },
  {
    title: 'إدارة منصة الطلاب',
    category: 'student_platform',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'student_platform')
  },
  {
    title: 'إدارة التسويق',
    category: 'marketing',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'marketing')
  },
  {
    title: 'الأتمتة التلقائية',
    category: 'automation',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'automation')
  },
  {
    title: 'الإدارة المالية',
    category: 'financial',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'financial')
  },
  {
    title: 'النظام',
    category: 'system',
    items: SCREEN_PERMISSIONS.filter(item => item.category === 'system')
  }
];

// ترتيب الأدوار حسب الصلاحيات (من الأعلى للأقل)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  accountant: 4,
  employee: 5,
  trainee_entry_clerk: 6
};

// أسماء الأدوار بالعربية
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  employee: 'موظف',
  trainee_entry_clerk: 'موظف إدخال بيانات المتدربين'
};

// ألوان الأدوار
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#e53e3e',
  admin: '#d69e2e',
  manager: '#3182ce',
  accountant: '#38a169',
  employee: '#805ad5',
  trainee_entry_clerk: '#dd6b20'
};
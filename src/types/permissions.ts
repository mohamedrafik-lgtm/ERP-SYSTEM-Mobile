// Permission System Types - Based on Web Frontend (Resource + Action Model)
// يطابق نظام الصلاحيات في الويب: resource + action

// ==================== ROLE TYPES ====================

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'accountant'
  | 'employee'
  | 'instructor'
  | 'trainee_entry_clerk';

// ==================== PERMISSION TYPES ====================

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'manage' | 'export' | 'transfer';

export interface PermissionCheck {
  resource: string;
  action: PermissionAction;
}

/** صلاحيات المستخدم المحسوبة من الـ API */
export interface UserPermissions {
  roles: string[];
  permissions: Record<string, boolean>;
}

// ==================== SCREEN PERMISSION CONFIG ====================

export interface ScreenPermissionConfig {
  /** معرف الشاشة (يطابق اسم الـ route) */
  screenName: string;
  /** عنوان الشاشة بالعربية */
  title: string;
  /** أيقونة الشاشة */
  icon: string;
  /** الصلاحية المطلوبة للوصول */
  requiredPermission: PermissionCheck;
  /** صلاحيات إضافية (مثلاً: إنشاء، تعديل، حذف) */
  additionalPermissions?: Record<string, PermissionCheck>;
  /** الفئة في القائمة */
  category: MenuCategory;
  /** ترتيب العرض */
  priority: number;
  /** وصف الشاشة */
  description?: string;
  /** هل تظهر في القائمة الجانبية */
  showInMenu?: boolean;
}

export type MenuCategory =
  | 'home'
  | 'academic'
  | 'exams'
  | 'student_platform'
  | 'schedules'
  | 'grades'
  | 'marketing'
  | 'automation'
  | 'financial'
  | 'student_requests'
  | 'system'
  | 'academic_supplies'
  | 'staff_attendance';

export interface MenuSection {
  title: string;
  category: MenuCategory;
  icon: string;
  requiredPermissions?: PermissionCheck[];
  requireAll?: boolean;
  items: ScreenPermissionConfig[];
}

// ==================== SCREEN PERMISSIONS MAP ====================
// كل شاشة موجودة في التطبيق مع الصلاحية المطلوبة من الـ backend

export const SCREEN_PERMISSIONS: Record<string, ScreenPermissionConfig> = {
  // ============ الصفحة الرئيسية ============
  Home: {
    screenName: 'Home',
    title: 'الرئيسية',
    icon: 'home',
    requiredPermission: { resource: 'dashboard', action: 'view' },
    category: 'home',
    priority: 1,
    showInMenu: true,
    description: 'الصفحة الرئيسية للنظام',
  },

  // ============ الإدارة الأكاديمية ============
  StudentsList: {
    screenName: 'StudentsList',
    title: 'المتدربين',
    icon: 'people',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    additionalPermissions: {
      create: { resource: 'dashboard.trainees', action: 'create' },
      edit: { resource: 'dashboard.trainees', action: 'edit' },
      delete: { resource: 'dashboard.trainees', action: 'delete' },
      transfer: { resource: 'dashboard.trainees', action: 'transfer' },
      export: { resource: 'dashboard.trainees', action: 'export' },
    },
    category: 'academic',
    priority: 2,
    showInMenu: true,
    description: 'عرض وإدارة قائمة المتدربين',
  },
  AddStudent: {
    screenName: 'AddStudent',
    title: 'إضافة متدرب',
    icon: 'person-add',
    requiredPermission: { resource: 'dashboard.trainees', action: 'create' },
    category: 'academic',
    priority: 2.1,
    showInMenu: false,
  },
  TraineeTransfer: {
    screenName: 'TraineeTransfer',
    title: 'تحويل المتدربين',
    icon: 'swap-horiz',
    requiredPermission: { resource: 'dashboard.trainees', action: 'transfer' },
    category: 'academic',
    priority: 2.4,
    showInMenu: true,
    description: 'تحويل المتدربين بين البرامج التدريبية',
  },
  EditTrainee: {
    screenName: 'EditTrainee',
    title: 'تعديل متدرب',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.trainees', action: 'edit' },
    category: 'academic',
    priority: 2.2,
    showInMenu: false,
  },
  TraineeDocuments: {
    screenName: 'TraineeDocuments',
    title: 'مستندات المتدرب',
    icon: 'description',
    requiredPermission: { resource: 'dashboard.trainee-documents', action: 'view' },
    additionalPermissions: {
      edit: { resource: 'dashboard.trainee-documents', action: 'edit' },
      delete: { resource: 'dashboard.trainee-documents', action: 'delete' },
    },
    category: 'academic',
    priority: 2.3,
    showInMenu: false,
  },
  UsersList: {
    screenName: 'UsersList',
    title: 'المستخدمون',
    icon: 'group',
    requiredPermission: { resource: 'dashboard.users', action: 'view' },
    additionalPermissions: {
      create: { resource: 'dashboard.users', action: 'create' },
      edit: { resource: 'dashboard.users', action: 'edit' },
      delete: { resource: 'dashboard.users', action: 'delete' },
    },
    category: 'academic',
    priority: 2.5,
    showInMenu: true,
    description: 'إدارة المستخدمين',
  },
  AddUser: {
    screenName: 'AddUser',
    title: 'إضافة مستخدم',
    icon: 'person-add',
    requiredPermission: { resource: 'dashboard.users', action: 'create' },
    category: 'academic',
    priority: 2.6,
    showInMenu: false,
  },
  EditUser: {
    screenName: 'EditUser',
    title: 'تعديل مستخدم',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.users', action: 'edit' },
    category: 'academic',
    priority: 2.7,
    showInMenu: false,
  },
  Programs: {
    screenName: 'Programs',
    title: 'البرامج التدريبية',
    icon: 'school',
    requiredPermission: { resource: 'dashboard.programs', action: 'view' },
    additionalPermissions: {
      create: { resource: 'dashboard.programs', action: 'create' },
      edit: { resource: 'dashboard.programs', action: 'edit' },
      delete: { resource: 'dashboard.programs', action: 'delete' },
    },
    category: 'academic',
    priority: 3,
    showInMenu: true,
    description: 'إدارة البرامج التدريبية',
  },
  AddProgram: {
    screenName: 'AddProgram',
    title: 'إضافة برنامج',
    icon: 'add-box',
    requiredPermission: { resource: 'dashboard.programs', action: 'create' },
    category: 'academic',
    priority: 3.1,
    showInMenu: false,
  },
  EditProgram: {
    screenName: 'EditProgram',
    title: 'تعديل برنامج',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.programs', action: 'edit' },
    category: 'academic',
    priority: 3.2,
    showInMenu: false,
  },
  TrainingContents: {
    screenName: 'TrainingContents',
    title: 'المحتوى التدريبي',
    icon: 'library-books',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'view' },
    additionalPermissions: {
      create: { resource: 'dashboard.training-contents', action: 'create' },
      edit: { resource: 'dashboard.training-contents', action: 'edit' },
      delete: { resource: 'dashboard.training-contents', action: 'delete' },
    },
    category: 'academic',
    priority: 4,
    showInMenu: true,
    description: 'إدارة المحتوى التدريبي',
  },
  AddTrainingContent: {
    screenName: 'AddTrainingContent',
    title: 'إضافة محتوى تدريبي',
    icon: 'note-add',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'create' },
    category: 'academic',
    priority: 4.1,
    showInMenu: false,
  },
  EditTrainingContent: {
    screenName: 'EditTrainingContent',
    title: 'تعديل محتوى تدريبي',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'edit' },
    category: 'academic',
    priority: 4.2,
    showInMenu: false,
  },
  Lectures: {
    screenName: 'Lectures',
    title: 'المحاضرات',
    icon: 'class',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'view' },
    category: 'academic',
    priority: 4.5,
    showInMenu: true,
    description: 'إدارة المحاضرات',
  },
  AddLecture: {
    screenName: 'AddLecture',
    title: 'إضافة محاضرة',
    icon: 'add',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'create' },
    category: 'academic',
    priority: 4.6,
    showInMenu: false,
  },
  EditLecture: {
    screenName: 'EditLecture',
    title: 'تعديل محاضرة',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.training-contents', action: 'edit' },
    category: 'academic',
    priority: 4.7,
    showInMenu: false,
  },
  DistributionManagement: {
    screenName: 'DistributionManagement',
    title: 'إدارة التوزيع',
    icon: 'swap-horiz',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'academic',
    priority: 4.8,
    showInMenu: true,
    description: 'توزيع المتدربين على المجموعات',
  },
  AddDistribution: {
    screenName: 'AddDistribution',
    title: 'إضافة توزيع',
    icon: 'add',
    requiredPermission: { resource: 'dashboard.trainees', action: 'edit' },
    category: 'academic',
    priority: 4.81,
    showInMenu: false,
  },
  DistributionDetails: {
    screenName: 'DistributionDetails',
    title: 'تفاصيل التوزيع',
    icon: 'info',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'academic',
    priority: 4.82,
    showInMenu: false,
  },
  ProgramDistributions: {
    screenName: 'ProgramDistributions',
    title: 'توزيعات البرنامج',
    icon: 'account-tree',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'academic',
    priority: 4.83,
    showInMenu: false,
  },

  // ============ إدارة الاختبارات ============
  Questions: {
    screenName: 'Questions',
    title: 'بنك الأسئلة',
    icon: 'help',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    additionalPermissions: {
      create: { resource: 'dashboard.questions', action: 'create' },
      edit: { resource: 'dashboard.questions', action: 'edit' },
      delete: { resource: 'dashboard.questions', action: 'delete' },
    },
    category: 'exams',
    priority: 1,
    showInMenu: false,
    description: 'إدارة بنك الأسئلة',
  },
  AddQuestion: {
    screenName: 'AddQuestion',
    title: 'إضافة سؤال',
    icon: 'help-outline',
    requiredPermission: { resource: 'dashboard.questions', action: 'create' },
    category: 'exams',
    priority: 2,
    showInMenu: false,
  },
  QuizManagement: {
    screenName: 'QuizManagement',
    title: 'اختبارات اون لاين',
    icon: 'assignment',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    category: 'exams',
    priority: 1,
    showInMenu: true,
    description: 'إدارة اختبارات اون لاين',
  },
  PaperExams: {
    screenName: 'PaperExams',
    title: 'الاختبارات الورقية',
    icon: 'description',
    requiredPermission: { resource: 'dashboard.paper-exams', action: 'view' },
    category: 'exams',
    priority: 2,
    showInMenu: true,
    description: 'إدارة الاختبارات الورقية',
  },
  AddPaperExam: {
    screenName: 'AddPaperExam',
    title: 'إضافة اختبار ورقي',
    icon: 'add-box',
    requiredPermission: { resource: 'dashboard.paper-exams', action: 'create' },
    category: 'exams',
    priority: 2.1,
    showInMenu: false,
  },
  PaperExamDetails: {
    screenName: 'PaperExamDetails',
    title: 'تفاصيل اختبار ورقي',
    icon: 'visibility',
    requiredPermission: { resource: 'dashboard.paper-exams', action: 'view' },
    category: 'exams',
    priority: 2.2,
    showInMenu: false,
  },
  EditPaperExam: {
    screenName: 'EditPaperExam',
    title: 'تعديل اختبار ورقي',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.paper-exams', action: 'edit' },
    category: 'exams',
    priority: 2.3,
    showInMenu: false,
  },
  ControlSystem: {
    screenName: 'ControlSystem',
    title: 'نظام الكونترول',
    icon: 'leaderboard',
    requiredPermission: { resource: 'dashboard.control', action: 'view' },
    category: 'exams',
    priority: 3,
    showInMenu: true,
    description: 'إدارة درجات الاختبارات الورقية',
  },
  GradeRelease: {
    screenName: 'GradeRelease',
    title: 'إعلان الدرجات',
    icon: 'notifications-active',
    requiredPermission: { resource: 'dashboard.grade-release', action: 'view' },
    category: 'exams',
    priority: 4,
    showInMenu: true,
    description: 'إدارة نشر الدرجات للمتدربين',
  },
  QuizReports: {
    screenName: 'QuizReports',
    title: 'تقارير الاختبارات',
    icon: 'bar-chart',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    category: 'exams',
    priority: 3.5,
    showInMenu: false,
    description: 'عرض تقارير الاختبارات المصغرة',
  },
  AddQuiz: {
    screenName: 'AddQuiz',
    title: 'إضافة اختبار',
    icon: 'add-box',
    requiredPermission: { resource: 'dashboard.questions', action: 'create' },
    category: 'exams',
    priority: 4,
    showInMenu: false,
  },
  QuizDetails: {
    screenName: 'QuizDetails',
    title: 'تفاصيل الاختبار',
    icon: 'visibility',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    category: 'exams',
    priority: 4.1,
    showInMenu: false,
  },
  EditQuiz: {
    screenName: 'EditQuiz',
    title: 'تعديل الاختبار',
    icon: 'edit',
    requiredPermission: { resource: 'dashboard.questions', action: 'edit' },
    category: 'exams',
    priority: 4.2,
    showInMenu: false,
  },
  QuizReport: {
    screenName: 'QuizReport',
    title: 'تقرير الاختبار',
    icon: 'assessment',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    category: 'exams',
    priority: 4.3,
    showInMenu: false,
  },
  QuizAttemptDetails: {
    screenName: 'QuizAttemptDetails',
    title: 'تفاصيل محاولة الاختبار',
    icon: 'insights',
    requiredPermission: { resource: 'dashboard.questions', action: 'view' },
    category: 'exams',
    priority: 4.4,
    showInMenu: false,
  },

  // ============ منصة الطلاب ============
  TraineeAccounts: {
    screenName: 'TraineeAccounts',
    title: 'حسابات المتدربين',
    icon: 'account-circle',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'student_platform',
    priority: 1,
    showInMenu: true,
    description: 'إدارة حسابات المتدربين في المنصة',
  },
  TraineeAccountDetails: {
    screenName: 'TraineeAccountDetails',
    title: 'تفاصيل حساب المتدرب',
    icon: 'info',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'student_platform',
    priority: 2,
    showInMenu: false,
  },

  // ============ الجداول الدراسية ============
  Schedules: {
    screenName: 'Schedules',
    title: 'الجداول الدراسية',
    icon: 'schedule',
    requiredPermission: { resource: 'dashboard.attendance', action: 'view' },
    category: 'schedules',
    priority: 1,
    showInMenu: true,
    description: 'إدارة الجداول الدراسية والمواعيد',
  },
  SemesterSelection: {
    screenName: 'SemesterSelection',
    title: 'اختيار الفصل الدراسي',
    icon: 'date-range',
    requiredPermission: { resource: 'dashboard.attendance', action: 'view' },
    category: 'schedules',
    priority: 2,
    showInMenu: false,
  },
  ScheduleDetails: {
    screenName: 'ScheduleDetails',
    title: 'تفاصيل الجدول',
    icon: 'event-note',
    requiredPermission: { resource: 'dashboard.attendance', action: 'view' },
    category: 'schedules',
    priority: 3,
    showInMenu: false,
  },

  // ============ درجات المتدربين ============
  TraineeGrades: {
    screenName: 'TraineeGrades',
    title: 'درجات المتدربين',
    icon: 'grade',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'grades',
    priority: 1,
    showInMenu: true,
    description: 'إدارة درجات المتدربين والتقييمات',
  },
  BulkUploadGrades: {
    screenName: 'BulkUploadGrades',
    title: 'رفع درجات المتدربين',
    icon: 'upload-file',
    requiredPermission: { resource: 'dashboard.grades.bulk-upload', action: 'manage' },
    category: 'grades',
    priority: 1.2,
    showInMenu: true,
    description: 'رفع درجات المتدربين بشكل جماعي من ملف Excel',
  },
  TraineeGradeDetails: {
    screenName: 'TraineeGradeDetails',
    title: 'تفاصيل الدرجات',
    icon: 'assessment',
    requiredPermission: { resource: 'dashboard.trainees', action: 'view' },
    category: 'grades',
    priority: 2,
    showInMenu: false,
  },
  SecondRoundStudents: {
    screenName: 'SecondRoundStudents',
    title: 'طلاب الدور الثاني',
    icon: 'warning-amber',
    requiredPermission: { resource: 'dashboard.grades.second-round', action: 'manage' },
    category: 'grades',
    priority: 2,
    showInMenu: true,
    description: 'عرض المتدربين الراسبين في مواد الدور الثاني',
  },
  MercyGrades: {
    screenName: 'MercyGrades',
    title: 'درجات الرأفة',
    icon: 'volunteer-activism',
    requiredPermission: { resource: 'dashboard.grades.mercy', action: 'manage' },
    category: 'grades',
    priority: 2.5,
    showInMenu: true,
    description: 'إضافة درجات رأفة للحالات القريبة من النجاح',
  },
  ResetGradeComponent: {
    screenName: 'ResetGradeComponent',
    title: 'تصفير مكون الدرجات',
    icon: 'restart-alt',
    requiredPermission: { resource: 'dashboard.grades.reset-component', action: 'manage' },
    category: 'grades',
    priority: 2.6,
    showInMenu: true,
    description: 'تصفير مكون محدد من الدرجات للمتدربين المستهدفين',
  },
  GradeReports: {
    screenName: 'GradeReports',
    title: 'تقارير الدرجات',
    icon: 'assessment',
    requiredPermission: { resource: 'dashboard.reports', action: 'view' },
    category: 'grades',
    priority: 3,
    showInMenu: true,
    description: 'تقارير وإحصائيات الدرجات',
  },
  GradeSettings: {
    screenName: 'GradeSettings',
    title: 'إعدادات التقييم',
    icon: 'settings',
    requiredPermission: { resource: 'dashboard.settings', action: 'edit' },
    category: 'grades',
    priority: 4,
    showInMenu: true,
    description: 'إعدادات نظام التقييم والدرجات',
  },

  // ============ إدارة التسويق ============
  Marketers: {
    screenName: 'Marketers',
    title: 'موظفي التسويق',
    icon: 'campaign',
    requiredPermission: { resource: 'marketing.employees', action: 'view' },
    category: 'marketing',
    priority: 5,
    showInMenu: true,
    description: 'إدارة موظفي التسويق',
  },
  AddMarketer: {
    screenName: 'AddMarketer',
    title: 'إضافة مسوق',
    icon: 'person-add-alt',
    requiredPermission: { resource: 'marketing.employees', action: 'view' },
    category: 'marketing',
    priority: 5.1,
    showInMenu: false,
  },
  EditMarketer: {
    screenName: 'EditMarketer',
    title: 'تعديل مسوق',
    icon: 'edit',
    requiredPermission: { resource: 'marketing.employees', action: 'view' },
    category: 'marketing',
    priority: 5.2,
    showInMenu: false,
  },
  TargetSetting: {
    screenName: 'TargetSetting',
    title: 'تحديد التارجيت',
    icon: 'track-changes',
    requiredPermission: { resource: 'marketing.targets', action: 'view' },
    category: 'marketing',
    priority: 5.5,
    showInMenu: true,
    description: 'تحديد أهداف التسويق',
  },
  MarketingTrainees: {
    screenName: 'MarketingTrainees',
    title: 'المتدربين مع تفاصيل التسويق',
    icon: 'people',
    requiredPermission: { resource: 'marketing.applications', action: 'view' },
    category: 'marketing',
    priority: 5.7,
    showInMenu: true,
    description: 'عرض المتدربين مع بيانات التسويق',
  },
  EmployeeTrainees: {
    screenName: 'EmployeeTrainees',
    title: 'متدربين الموظف',
    icon: 'people-outline',
    requiredPermission: { resource: 'marketing.applications', action: 'view' },
    category: 'marketing',
    priority: 5.75,
    showInMenu: false,
  },
  MarketingStats: {
    screenName: 'MarketingStats',
    title: 'إحصائيات التسويق',
    icon: 'analytics',
    requiredPermission: { resource: 'marketing.employees', action: 'view' },
    category: 'marketing',
    priority: 5.8,
    showInMenu: true,
    description: 'عرض إحصائيات الأداء التسويقي',
  },

  // ============ الأتمتة التلقائية ============
  WhatsAppManagement: {
    screenName: 'WhatsAppManagement',
    title: 'إدارة WhatsApp',
    icon: 'chat',
    requiredPermission: { resource: 'dashboard.settings', action: 'view' },
    category: 'automation',
    priority: 6,
    showInMenu: true,
    description: 'إدارة رسائل WhatsApp التلقائية',
  },

  // ============ الإدارة المالية ============
  Treasury: {
    screenName: 'Treasury',
    title: 'الخزائن المالية',
    icon: 'account-balance',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'dashboard.financial', action: 'manage' },
    },
    category: 'financial',
    priority: 7,
    showInMenu: true,
    description: 'إدارة الخزائن المالية',
  },
  AddTreasuryScreen: {
    screenName: 'AddTreasuryScreen',
    title: 'إضافة خزينة',
    icon: 'add-business',
    requiredPermission: { resource: 'dashboard.financial', action: 'manage' },
    category: 'financial',
    priority: 7.1,
    showInMenu: false,
  },
  AddTransactionScreen: {
    screenName: 'AddTransactionScreen',
    title: 'إضافة معاملة',
    icon: 'add-card',
    requiredPermission: { resource: 'dashboard.financial', action: 'manage' },
    category: 'financial',
    priority: 7.2,
    showInMenu: false,
  },
  Fees: {
    screenName: 'Fees',
    title: 'الرسوم المالية',
    icon: 'account-balance-wallet',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 7.5,
    showInMenu: true,
    description: 'إدارة الرسوم المالية',
  },
  AddFeeScreen: {
    screenName: 'AddFeeScreen',
    title: 'إضافة رسوم',
    icon: 'add-card',
    requiredPermission: { resource: 'dashboard.financial', action: 'manage' },
    category: 'financial',
    priority: 7.6,
    showInMenu: false,
  },
  TraineePayments: {
    screenName: 'TraineePayments',
    title: 'مدفوعات المتدربين',
    icon: 'payment',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 8,
    showInMenu: true,
    description: 'إدارة مدفوعات المتدربين',
  },
  TraineePaymentDetails: {
    screenName: 'TraineePaymentDetails',
    title: 'تفاصيل المدفوعات',
    icon: 'receipt',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 8.1,
    showInMenu: false,
  },
  FinancialReports: {
    screenName: 'FinancialReports',
    title: 'التقارير المالية',
    icon: 'assessment',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 8.5,
    showInMenu: true,
    description: 'عرض التقارير والإحصائيات المالية الشاملة',
  },
  GradeAppealFees: {
    screenName: 'GradeAppealFees',
    title: 'رسوم التظلمات',
    icon: 'rule',
    requiredPermission: { resource: 'dashboard.grade-appeals', action: 'view' },
    category: 'financial',
    priority: 8.55,
    showInMenu: true,
    description: 'تحديد رسوم التظلمات لكل برنامج تدريبي',
  },
  PaymentSchedules: {
    screenName: 'PaymentSchedules',
    title: 'مواعيد السداد',
    icon: 'event',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 8.6,
    showInMenu: true,
    description: 'إدارة مواعيد سداد الرسوم',
  },
  PaymentScheduleDetails: {
    screenName: 'PaymentScheduleDetails',
    title: 'تفاصيل موعد السداد',
    icon: 'event-note',
    requiredPermission: { resource: 'dashboard.financial', action: 'view' },
    category: 'financial',
    priority: 8.61,
    showInMenu: false,
  },
  AddPaymentSchedule: {
    screenName: 'AddPaymentSchedule',
    title: 'إضافة موعد سداد',
    icon: 'event-available',
    requiredPermission: { resource: 'dashboard.financial', action: 'manage' },
    category: 'financial',
    priority: 8.62,
    showInMenu: false,
  },

  // ============ إدارة طلبات الطلاب ============
  PaymentDeferralRequests: {
    screenName: 'PaymentDeferralRequests',
    title: 'طلبات تأجيل السداد',
    icon: 'event-note',
    requiredPermission: { resource: 'dashboard.deferral-requests', action: 'view' },
    category: 'student_requests',
    priority: 9.1,
    showInMenu: true,
    description: 'طلبات تأجيل المدفوعات المالية',
  },
  FreeRequests: {
    screenName: 'FreeRequests',
    title: 'الطلبات العامة',
    icon: 'description',
    requiredPermission: { resource: 'dashboard.trainee-requests', action: 'view' },
    category: 'student_requests',
    priority: 9.2,
    showInMenu: true,
    description: 'طلبات المتدربين العامة',
  },
  RequestsSettings: {
    screenName: 'RequestsSettings',
    title: 'إعدادات الطلبات',
    icon: 'settings',
    requiredPermission: { resource: 'dashboard.settings', action: 'edit' },
    category: 'student_requests',
    priority: 9.3,
    showInMenu: true,
    description: 'إعدادات وإدارة أنواع الطلبات',
  },

  // ============ إدارة النظام ============
  Permissions: {
    screenName: 'Permissions',
    title: 'الصلاحيات',
    icon: 'lock',
    requiredPermission: { resource: 'dashboard.permissions', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'dashboard.permissions', action: 'manage' },
    },
    category: 'system',
    priority: 9,
    showInMenu: true,
    description: 'إدارة صلاحيات المستخدمين',
  },
  RoleDetails: {
    screenName: 'RoleDetails',
    title: 'تفاصيل الدور',
    icon: 'info',
    requiredPermission: { resource: 'dashboard.permissions', action: 'view' },
    category: 'system',
    priority: 9.05,
    showInMenu: false,
  },
  AddPermission: {
    screenName: 'AddPermission',
    title: 'إضافة صلاحية',
    icon: 'lock-open',
    requiredPermission: { resource: 'dashboard.permissions', action: 'manage' },
    category: 'system',
    priority: 9.1,
    showInMenu: false,
  },

  // ============ الأدوات الدراسية ============
  AcademicSupplies: {
    screenName: 'AcademicSupplies',
    title: 'الأدوات الدراسية',
    icon: 'school-outlined',
    requiredPermission: { resource: 'dashboard.id-cards', action: 'view' },
    category: 'academic_supplies',
    priority: 1,
    showInMenu: true,
    description: 'إدارة طلبات الأدوات الدراسية والكارنيهات',
  },
  DeliveryTracking: {
    screenName: 'DeliveryTracking',
    title: 'تتبع التسليم',
    icon: 'local-shipping',
    requiredPermission: { resource: 'dashboard.id-cards', action: 'view' },
    category: 'academic_supplies',
    priority: 2,
    showInMenu: true,
    description: 'تتبع حالة تسليم الأدوات الدراسية',
  },
  DeliveryTrackingMaterial: {
    screenName: 'DeliveryTrackingMaterial',
    title: 'تفاصيل تسليم الأداة',
    icon: 'assignment-turned-in',
    requiredPermission: { resource: 'dashboard.id-cards', action: 'view' },
    category: 'academic_supplies',
    priority: 2.1,
    showInMenu: false,
  },
  AddStudyMaterial: {
    screenName: 'AddStudyMaterial',
    title: 'إضافة مادة دراسية',
    icon: 'add',
    requiredPermission: { resource: 'dashboard.id-cards', action: 'create' },
    category: 'academic_supplies',
    priority: 3,
    showInMenu: false,
  },
  // ============ حضور و غياب الموظفين ============
  StaffAttendance: {
    screenName: 'StaffAttendance',
    title: 'حضور و غياب الموظفين',
    icon: 'fingerprint',
    requiredPermission: { resource: 'staff-attendance', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'staff-attendance', action: 'manage' },
    },
    category: 'staff_attendance',
    priority: 1,
    showInMenu: true,
    description: 'تسجيل وإدارة حضور وغياب الموظفين',
  },
  StaffAttendanceLogs: {
    screenName: 'StaffAttendanceLogs',
    title: 'سجل الحضور',
    icon: 'list-alt',
    requiredPermission: { resource: 'staff-attendance', action: 'view' },
    category: 'staff_attendance',
    priority: 2,
    showInMenu: true,
    description: 'عرض سجلات الحضور والانصراف',
  },
  StaffLeaveRequests: {
    screenName: 'StaffLeaveRequests',
    title: 'طلبات الإجازة',
    icon: 'event-busy',
    requiredPermission: { resource: 'staff-attendance.leaves', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'staff-attendance.leaves', action: 'manage' },
    },
    category: 'staff_attendance',
    priority: 3,
    showInMenu: true,
    description: 'إدارة طلبات إجازات الموظفين',
  },
  StaffAttendanceSettings: {
    screenName: 'StaffAttendanceSettings',
    title: 'إعدادات الحضور',
    icon: 'settings',
    requiredPermission: { resource: 'staff-attendance.settings', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'staff-attendance.settings', action: 'manage' },
      manageHolidays: { resource: 'staff-attendance.holidays', action: 'manage' },
    },
    category: 'staff_attendance',
    priority: 4,
    showInMenu: true,
    description: 'إعدادات نظام الحضور والعطلات',
  },
  StaffAttendanceEmployees: {
    screenName: 'StaffAttendanceEmployees',
    title: 'الموظفين المسجلين',
    icon: 'people',
    requiredPermission: { resource: 'staff-attendance.enrollments', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'staff-attendance.enrollments', action: 'manage' },
    },
    category: 'staff_attendance',
    priority: 5,
    showInMenu: true,
    description: 'إدارة تسجيل الموظفين في نظام الحضور',
  },
  StaffAttendanceEmployeeDetail: {
    screenName: 'StaffAttendanceEmployeeDetail',
    title: 'تفاصيل الموظف',
    icon: 'person',
    requiredPermission: { resource: 'staff-attendance.enrollments', action: 'view' },
    additionalPermissions: {
      manage: { resource: 'staff-attendance.enrollments', action: 'manage' },
    },
    category: 'staff_attendance',
    priority: 6,
    showInMenu: false,
    description: 'عرض تفاصيل حضور موظف محدد',
  },
};

// ==================== MENU SECTIONS ====================

export const MENU_SECTIONS: MenuSection[] = [
  // ============ 1. الرئيسية ============
  {
    title: 'الرئيسية',
    category: 'home',
    icon: 'home',
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'home' && s.showInMenu),
  },

  // ============ 2. الإدارة الأكاديمية (الأساسيات) ============
  {
    title: 'الإدارة الأكاديمية',
    category: 'academic',
    icon: 'school',
    requiredPermissions: [
      { resource: 'dashboard.trainees', action: 'view' },
      { resource: 'dashboard.programs', action: 'view' },
      { resource: 'dashboard.users', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'academic' && s.showInMenu),
  },

  // ============ 3. الجداول الدراسية ============
  {
    title: 'الجداول الدراسية',
    category: 'schedules',
    icon: 'schedule',
    requiredPermissions: [{ resource: 'dashboard.attendance', action: 'view' }],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'schedules' && s.showInMenu),
  },

  // ============ 4. إدارة الاختبارات والدرجات ============
  {
    title: 'إدارة الاختبارات',
    category: 'exams',
    icon: 'assignment',
    requiredPermissions: [
      { resource: 'dashboard.questions', action: 'view' },
      { resource: 'dashboard.paper-exams', action: 'view' },
      { resource: 'dashboard.control', action: 'view' },
      { resource: 'dashboard.grade-release', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'exams' && s.showInMenu),
  },
  {
    title: 'درجات المتدربين',
    category: 'grades',
    icon: 'grade',
    requiredPermissions: [
      { resource: 'dashboard.trainees', action: 'view' },
      { resource: 'dashboard.grades.bulk-upload', action: 'manage' },
      { resource: 'dashboard.grades.second-round', action: 'manage' },
      { resource: 'dashboard.grades.mercy', action: 'manage' },
      { resource: 'dashboard.grades.reset-component', action: 'manage' },
    ],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'grades' && s.showInMenu),
  },

  // ============ 5. منصة الطلاب والأدوات ============
  {
    title: 'إدارة منصة الطلاب',
    category: 'student_platform',
    icon: 'account-circle',
    requiredPermissions: [{ resource: 'dashboard.trainees', action: 'view' }],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'student_platform' && s.showInMenu),
  },
  {
    title: 'الأدوات الدراسية',
    category: 'academic_supplies',
    icon: 'inventory-2',
    requiredPermissions: [{ resource: 'dashboard.id-cards', action: 'view' }],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'academic_supplies' && s.showInMenu),
  },

  // ============ 6. الإدارة المالية ============
  {
    title: 'الإدارة المالية',
    category: 'financial',
    icon: 'account-balance',
    requiredPermissions: [
      { resource: 'dashboard.financial', action: 'view' },
      { resource: 'dashboard.grade-appeals', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'financial' && s.showInMenu),
  },

  // ============ 7. إدارة الطلبات ============
  {
    title: 'إدارة الطلبات',
    category: 'student_requests',
    icon: 'description',
    requiredPermissions: [
      { resource: 'dashboard.deferral-requests', action: 'view' },
      { resource: 'dashboard.trainee-requests', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'student_requests' && s.showInMenu),
  },

  // ============ 8. التسويق ============
  {
    title: 'إدارة التسويق',
    category: 'marketing',
    icon: 'campaign',
    requiredPermissions: [
      { resource: 'marketing.employees', action: 'view' },
      { resource: 'marketing.targets', action: 'view' },
      { resource: 'marketing.applications', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'marketing' && s.showInMenu),
  },

  // ============ 9. حضور و غياب الموظفين - HR ============
  {
    title: 'حضور و غياب الموظفين',
    category: 'staff_attendance',
    icon: 'fingerprint',
    requiredPermissions: [
      { resource: 'staff-attendance', action: 'view' },
      { resource: 'staff-attendance.enrollments', action: 'view' },
      { resource: 'staff-attendance.leaves', action: 'view' },
    ],
    requireAll: false,
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'staff_attendance' && s.showInMenu),
  },

  // ============ 10. الأتمتة والنظام ============
  {
    title: 'الأتمتة التلقائية',
    category: 'automation',
    icon: 'smart-toy',
    requiredPermissions: [{ resource: 'dashboard.settings', action: 'view' }],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'automation' && s.showInMenu),
  },
  {
    title: 'النظام',
    category: 'system',
    icon: 'settings',
    requiredPermissions: [{ resource: 'dashboard.permissions', action: 'view' }],
    items: Object.values(SCREEN_PERMISSIONS).filter(s => s.category === 'system' && s.showInMenu),
  },
];

// ==================== ROLE DISPLAY CONFIG ====================

export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  accountant: 4,
  instructor: 5,
  employee: 6,
  trainee_entry_clerk: 7,
};

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير النظام',
  manager: 'مدير',
  accountant: 'محاسب',
  instructor: 'مدرب',
  employee: 'موظف',
  trainee_entry_clerk: 'موظف إدخال بيانات المتدربين',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: '#e53e3e',
  admin: '#d69e2e',
  manager: '#3182ce',
  accountant: '#38a169',
  instructor: '#6366f1',
  employee: '#805ad5',
  trainee_entry_clerk: '#dd6b20',
};

// ==================== API RESPONSE TYPES ====================

export interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  displayName: string;
  description?: string;
  category?: string;
  conditions?: any;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rolePermissions: number;
    userPermissions: number;
  };
}

export interface RolePermissionItem {
  permissionId: string;
  granted: boolean;
  conditions?: any;
  expiresAt?: string | null;
  permission: PermissionItem;
}

export interface UserRoleItem {
  userId: string;
  roleId: string;
  isActive: boolean;
  assignedAt: string;
  expiresAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RoleWithRelations {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  icon?: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions?: RolePermissionItem[];
  userRoles?: UserRoleItem[];
  _count?: {
    userRoles: number;
  };
}

export type RolesResponse = RoleWithRelations[];

export type RoleByIdResponse = RoleWithRelations;

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  icon?: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  displayName?: string;
  description?: string;
  color?: string;
  icon?: string;
  priority?: number;
  isActive?: boolean;
}

export interface AssignPermissionsToRoleRequest {
  permissions: Array<{
    permissionId: string;
    granted: boolean;
  }>;
}

export interface PermissionStats {
  totalRoles: number;
  activeRoles: number;
  totalPermissions: number;
  totalUsers: number;
}

export type MarketingEmployeesResponse = MarketingEmployeeItem[];

export interface MarketingEmployeeItem {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  isActive: boolean;
  totalApplications: number;
  createdAt: string;
  updatedAt: string;
  marketingTargets: MarketingTarget[];
  _count: {
    trainees: number;
  };
  totalAssignedTrainees: number;
}

export interface MarketingTarget {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  notes?: string | null;
  setById?: string | null;
  setAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingEmployeeRequest {
  name: string;
  phone: string;
  email?: string | null;
  isActive?: boolean;
}

export interface UpdateMarketingEmployeeRequest {
  name?: string;
  phone?: string;
  email?: string | null;
  isActive?: boolean;
}

// Target Setting Types
export interface MarketingTargetWithEmployee extends MarketingTarget {
  employee: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
  };
}

// New API Response Types
export interface GetMarketingTargetsQuery {
  month?: number;    // 1-12
  year?: number;     // 2020-2050
}

export interface MarketingTargetWithAchieved {
  id: number;
  employeeId: number;
  month: number;           // 1-12
  year: number;            // مثل 2025
  targetAmount: number;    // الهدف المطلوب
  achievedAmount: number;  // المحقق فعلياً (محسوب من المتدربين المُعيّنين في هذا الشهر)
  notes?: string | null;
  setById?: string | null;
  setAt: string;           // ISO date
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date

  employee: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    isActive: boolean;
    totalApplications: number;
    createdAt: string;     // ISO date
    updatedAt: string;     // ISO date
  };
}

export type MarketingTargetsResponse = MarketingTargetWithAchieved[];

export interface CreateMarketingTargetRequest {
  employeeId: number;      // معرف موظف التسويق (مطلوب، ≥ 1)
  month: number;           // الشهر (مطلوب، 1-12)
  year: number;            // السنة (مطلوب، 2020-2050)
  targetAmount: number;    // الهدف المطلوب (مطلوب، 1-1000)
  notes?: string;          // ملاحظات (اختياري)
  setById?: string;        // من قام بتحديد الهدف (اختياري)
}

export interface UpdateMarketingTargetRequest {
  targetAmount: number;    // الهدف المطلوب (مطلوب)
  notes?: string;          // ملاحظات (اختياري)
  setById?: string;        // من قام بتحديد الهدف (اختياري)
}


export interface MarketingTargetStats {
  totalTargets: number;
  totalAchieved: number;
  totalRemaining: number;
  averageAchievement: number;
  topPerformer?: {
    employeeId: number;
    employeeName: string;
    achievementRate: number;
  };
}

// Month and Year options
export const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

export const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year, label: year.toString() };
});

// Marketing Trainees Types
export interface TraineeWithMarketingInfo {
  id: number;
  nameAr: string;          // الاسم بالعربية
  nameEn: string;          // الاسم بالإنجليزية
  nationalId: string;      // الرقم القومي
  phone: string;           // رقم الهاتف
  email?: string | null;   // البريد الإلكتروني
  gender: import('./enums').Gender;          // الجنس
  traineeStatus: import('./enums').TraineeStatus; // حالة المتدرب
  programId: number;       // معرف البرنامج
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date

  // موظف التسويق المسؤول
  marketingEmployee?: {
    id: number;
    name: string;
  } | null;

  // موظف التواصل الأول
  firstContactEmployee?: {
    id: number;
    name: string;
  } | null;

  // موظف التواصل الثاني
  secondContactEmployee?: {
    id: number;
    name: string;
  } | null;

  // البرنامج التدريبي
  program: {
    id: number;
    nameAr: string;
  };
}

export interface MarketingTraineesResponse {
  data: TraineeWithMarketingInfo[];
  total: number;           // إجمالي عدد المتدربين
  page: number;            // الصفحة الحالية
  limit: number;           // عدد العناصر في الصفحة
  totalPages: number;      // إجمالي عدد الصفحات
}

// Employee Trainees Types
export interface TraineeBasicInfo {
  id: number;
  nameAr: string;          // الاسم بالعربية
  nameEn: string;          // الاسم بالإنجليزية
  nationalId: string;      // الرقم القومي
  phone: string;           // رقم الهاتف
  email?: string | null;   // البريد الإلكتروني
  gender: import('./enums').Gender;          // الجنس
  traineeStatus: import('./enums').TraineeStatus; // حالة المتدرب
  programId: number;       // معرف البرنامج
  createdAt: string;       // ISO date
  updatedAt: string;       // ISO date

  // البرنامج التدريبي
  program: {
    id: number;
    nameAr: string;
  };
}

export interface EmployeeTraineesResponse {
  data: TraineeBasicInfo[];
  total: number;           // إجمالي عدد المتدربين المُعيّنين لهذا الموظف
  page: number;            // الصفحة الحالية
  limit: number;           // عدد العناصر في الصفحة
  totalPages: number;      // إجمالي عدد الصفحات
}

// Marketing Stats Types
export interface MarketingStatsResponse {
  overview: {
    totalEmployees: number;           // إجمالي موظفي التسويق
    totalTrainees: number;            // إجمالي المتدربين
    assignedTrainees: number;         // المتدربين المُعيّنين لموظف تسويق
    unassignedTrainees: number;       // المتدربين غير المُعيّنين
    assignmentRate: number;           // نسبة التخصيص (%)
    firstContactTrainees: number;     // المتدربين المُعيّن لهم موظف تواصل أول
    unassignedFirstContact: number;   // المتدربين غير المُعيّن لهم موظف تواصل أول
    firstContactRate: number;         // نسبة التواصل الأول (%)
  };

  monthly: {
    newTrainees: number;              // المتدربين الجدد في الشهر
    assignedTrainees: number;         // المتدربين المُعيّنين في الشهر
    firstContactTrainees: number;     // المتدربين المُعيّن لهم تواصل أول في الشهر
    assignmentRate: number;           // نسبة التخصيص للشهر (%)
    firstContactRate: number;         // نسبة التواصل الأول للشهر (%)
  };

  employees: EmployeePerformance[];   // أداء كل موظف
  topPerformers: TopPerformer[];      // أفضل 5 موظفين
  programs: ProgramStats[];           // إحصائيات حسب البرامج
  detailed: DetailedStats;            // إحصائيات تفصيلية
  period: {
    month: number;                    // الشهر المحدد
    year: number;                     // السنة المحددة
    startDate: string;               // بداية الشهر (ISO)
    endDate: string;                  // نهاية الشهر (ISO)
  };
}

export interface EmployeePerformance {
  id: number;
  name: string;
  monthlyTarget: number;              // الهدف الشهري
  totalAssigned: number;              // إجمالي المُعيّنين له
  monthlyAssigned: number;            // المُعيّنين في الشهر
  monthlyFirstContact: number;        // التواصل الأول في الشهر
  achievementRate: number;            // نسبة تحقيق الهدف (%)
}

export interface TopPerformer extends EmployeePerformance {
  rank: number;                       // الترتيب (1-5)
}

export interface ProgramStats {
  programId: number;
  programName: string;
  count: number;                      // عدد المتدربين في البرنامج
}

export interface DetailedStats {
  statusDistribution: StatusCount[];  // توزيع المتدربين حسب الحالة
  averagePerEmployee: number;         // متوسط المتدربين لكل موظف
  activeEmployeesRate: number;         // نسبة الموظفين النشطين (%)
}

export interface StatusCount {
  status: string;                     // حالة المتدرب
  count: number;                       // العدد
}


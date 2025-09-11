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
  targetAmount?: number;
  notes?: string;
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



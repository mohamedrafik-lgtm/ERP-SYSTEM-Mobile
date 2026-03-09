// ==================== Staff Attendance Types ====================

export enum StaffAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT_UNEXCUSED = 'ABSENT_UNEXCUSED',
  ABSENT_EXCUSED = 'ABSENT_EXCUSED',
  LEAVE = 'LEAVE',
  DAY_OFF = 'DAY_OFF',
  HOLIDAY = 'HOLIDAY',
}

export const StaffAttendanceStatusArabic: Record<StaffAttendanceStatus, string> = {
  [StaffAttendanceStatus.PRESENT]: 'حاضر',
  [StaffAttendanceStatus.ABSENT_UNEXCUSED]: 'غائب بدون إذن',
  [StaffAttendanceStatus.ABSENT_EXCUSED]: 'غائب بإذن',
  [StaffAttendanceStatus.LEAVE]: 'إذن',
  [StaffAttendanceStatus.DAY_OFF]: 'يوم عطلة',
  [StaffAttendanceStatus.HOLIDAY]: 'إجازة رسمية',
};

export const StaffAttendanceStatusColor: Record<StaffAttendanceStatus, string> = {
  [StaffAttendanceStatus.PRESENT]: '#059669',
  [StaffAttendanceStatus.ABSENT_UNEXCUSED]: '#dc2626',
  [StaffAttendanceStatus.ABSENT_EXCUSED]: '#f59e0b',
  [StaffAttendanceStatus.LEAVE]: '#3b82f6',
  [StaffAttendanceStatus.DAY_OFF]: '#6b7280',
  [StaffAttendanceStatus.HOLIDAY]: '#8b5cf6',
};

export enum StaffLeaveType {
  PERSONAL = 'PERSONAL',
  SICK = 'SICK',
  EMERGENCY = 'EMERGENCY',
  ANNUAL = 'ANNUAL',
  OTHER = 'OTHER',
}

export const StaffLeaveTypeArabic: Record<StaffLeaveType, string> = {
  [StaffLeaveType.PERSONAL]: 'شخصي',
  [StaffLeaveType.SICK]: 'مرضي',
  [StaffLeaveType.EMERGENCY]: 'طارئ',
  [StaffLeaveType.ANNUAL]: 'سنوي',
  [StaffLeaveType.OTHER]: 'أخرى',
};

export enum StaffLeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const StaffLeaveStatusArabic: Record<StaffLeaveStatus, string> = {
  [StaffLeaveStatus.PENDING]: 'قيد المراجعة',
  [StaffLeaveStatus.APPROVED]: 'موافق عليه',
  [StaffLeaveStatus.REJECTED]: 'مرفوض',
};

export const StaffLeaveStatusColor: Record<StaffLeaveStatus, string> = {
  [StaffLeaveStatus.PENDING]: '#f59e0b',
  [StaffLeaveStatus.APPROVED]: '#059669',
  [StaffLeaveStatus.REJECTED]: '#dc2626',
};

// ====== Settings ======
export interface StaffAttendanceSettings {
  id: string;
  branchId: number;
  workHoursPerDay: number;
  workStartTime: string;
  workEndTime: string;
  lateThresholdMinutes: number;
  earlyLeaveThreshold: number;
  weeklyOffDays: string[];
  timezone: string;
  requireLocation: boolean;
  requireCheckInLocation: boolean;
  requireCheckOutLocation: boolean;
  locationLatitude?: number;
  locationLongitude?: number;
  locationRadius: number;
}

// ====== Enrollment ======
export interface StaffAttendanceEnrollment {
  userId: string;
  isActive: boolean;
  enrolledAt: string;
  enrolledBy: string;
  notes?: string;
  customWorkDays?: string[];
  customWorkStartTime?: string;
  customWorkEndTime?: string;
  customWorkHoursPerDay?: number;
  customLateThresholdMinutes?: number;
  customDaySchedules?: any;
  allowGlobalZones: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// ====== Attendance Log ======
export interface StaffAttendanceLog {
  id: string;
  userId: string;
  date: string;
  status: StaffAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  workedMinutes?: number;
  requiredMinutes?: number;
  overtimeMinutes?: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInAddress?: string;
  checkInZoneName?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  notes?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// ====== My Status ======
export interface MyAttendanceStatus {
  isEnrolled: boolean;
  todayLog?: StaffAttendanceLog;
  isCheckedIn: boolean;
  settings: {
    workStartTime: string;
    workEndTime: string;
    workHoursPerDay: number;
    lateThresholdMinutes: number;
    requireLocation: boolean;
  };
}

// ====== Leave Request ======
export interface StaffLeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: StaffLeaveType;
  status: StaffLeaveStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
}

// ====== Holiday ======
export interface StaffHoliday {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  isRecurring: boolean;
  notes?: string;
  createdBy: string;
}

// ====== Zone ======
export interface StaffAttendanceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  isGlobal: boolean;
  isActive: boolean;
  color: string;
}

// ====== Dashboard ======
export interface StaffAttendanceDashboard {
  totalEnrolled: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  todayLogs: StaffAttendanceLog[];
}

// ====== Request DTOs ======
export interface CheckInDto {
  latitude?: number;
  longitude?: number;
  address?: string;
  forceCheckIn?: boolean;
}

export interface CheckOutDto {
  latitude?: number;
  longitude?: number;
  address?: string;
  forceCheckOut?: boolean;
}

export interface CreateLeaveRequestDto {
  startDate: string;
  endDate: string;
  reason: string;
  leaveType?: StaffLeaveType;
}

export interface ManualRecordDto {
  userId: string;
  date: string;
  status: StaffAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

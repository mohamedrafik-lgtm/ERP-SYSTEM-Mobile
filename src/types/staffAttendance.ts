// ==================== Staff Attendance Types ====================

export enum StaffAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT_UNEXCUSED = 'ABSENT_UNEXCUSED',
  ABSENT_EXCUSED = 'ABSENT_EXCUSED',
  LEAVE = 'LEAVE',
  DAY_OFF = 'DAY_OFF',
  HOLIDAY = 'HOLIDAY',
}

export const StaffAttendanceStatusArabic: Record<string, string> = {
  [StaffAttendanceStatus.PRESENT]: 'حاضر',
  [StaffAttendanceStatus.ABSENT_UNEXCUSED]: 'غائب بدون إذن',
  [StaffAttendanceStatus.ABSENT_EXCUSED]: 'غائب بإذن',
  [StaffAttendanceStatus.LEAVE]: 'إذن',
  [StaffAttendanceStatus.DAY_OFF]: 'يوم عطلة',
  [StaffAttendanceStatus.HOLIDAY]: 'إجازة رسمية',
  ON_LEAVE: 'في إجازة',
  NOT_RECORDED: 'لم يسجل',
};

export const StaffAttendanceStatusColor: Record<string, string> = {
  [StaffAttendanceStatus.PRESENT]: '#059669',
  [StaffAttendanceStatus.ABSENT_UNEXCUSED]: '#dc2626',
  [StaffAttendanceStatus.ABSENT_EXCUSED]: '#f59e0b',
  [StaffAttendanceStatus.LEAVE]: '#3b82f6',
  [StaffAttendanceStatus.DAY_OFF]: '#6b7280',
  [StaffAttendanceStatus.HOLIDAY]: '#8b5cf6',
  ON_LEAVE: '#3b82f6',
  NOT_RECORDED: '#9ca3af',
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

export const StaffLeaveTypeIcon: Record<StaffLeaveType, string> = {
  [StaffLeaveType.ANNUAL]: 'event',
  [StaffLeaveType.SICK]: 'local-hospital',
  [StaffLeaveType.PERSONAL]: 'person',
  [StaffLeaveType.EMERGENCY]: 'warning',
  [StaffLeaveType.OTHER]: 'more-horiz',
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
  isActive: boolean;
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
  customEarlyLeaveThresholdMinutes?: number;
  customDaySchedules?: Record<string, {start: string; end: string}>;
  allowGlobalZones: boolean;
  zoneIds?: string[];
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

// ====== My Status (matches backend response) ======
export interface MyAttendanceStatus {
  isEnrolled: boolean;
  systemActive: boolean;
  todayLog: StaffAttendanceLog | null;
  isCheckedIn: boolean;
  isWeeklyOff: boolean;
  weeklyOffDay: string | null;
  todayHoliday: {id: string; name: string; date: string} | null;
  settings: {
    workHoursPerDay: number;
    workStartTime: string;
    workEndTime: string;
    lateThresholdMinutes: number;
    requireLocation: boolean;
    requireCheckInLocation: boolean;
    requireCheckOutLocation: boolean;
    locationLatitude?: number;
    locationLongitude?: number;
    locationRadius: number;
    timezone: string;
    zones: StaffAttendanceZone[];
  };
  customSchedule: {
    customWorkDays?: string[];
    customWorkStartTime?: string;
    customWorkEndTime?: string;
    customWorkHoursPerDay?: number;
    customDaySchedules?: Record<string, {start: string; end: string}>;
  } | null;
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
  earlyLeaveToday?: number;
  onLeaveToday: number;
  pendingLeaves: number;
  averageWorkHours: number;
  attendanceRate: number;
  todayLogs: StaffAttendanceLog[];
}

// ====== User Dashboard (per employee) ======
export interface UserAttendanceDashboard {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  leaveDays: number;
  averageWorkMinutes: number;
  overtimeMinutes: number;
  attendanceRate: number;
  logs: StaffAttendanceLog[];
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

export interface UpdateEnrollmentDto {
  isActive?: boolean;
  notes?: string;
  customWorkDays?: string[];
  customWorkStartTime?: string;
  customWorkEndTime?: string;
  customWorkHoursPerDay?: number;
  customLateThresholdMinutes?: number;
  customEarlyLeaveThresholdMinutes?: number;
  customDaySchedules?: Record<string, {start: string; end: string}>;
  allowGlobalZones?: boolean;
  zoneIds?: string[];
}

export interface BulkEnrollDto {
  userIds: string[];
  notes?: string;
}

// ====== Today's Attendance Response (matches backend /today) ======
export interface TodayEmployee {
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    phone?: string;
  };
  log: StaffAttendanceLog | null;
  status: string;
}

export interface TodayAttendanceResponse {
  date: string;
  employees: TodayEmployee[];
  stats: {
    total: number;
    present: number;
    absent: number;
    excused: number;
    onLeave: number;
    notRecorded: number;
    dayOff: number;
    late: number;
  };
}

// ====== User Logs Response (matches backend /logs/user/{id}) ======
export interface UserLogsResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    photoUrl?: string;
  };
  logs: StaffAttendanceLog[];
  stats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    excusedDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    totalWorkedMinutes: number;
    totalRequiredMinutes: number;
    totalOvertimeMinutes: number;
    attendanceRate: number;
  };
}

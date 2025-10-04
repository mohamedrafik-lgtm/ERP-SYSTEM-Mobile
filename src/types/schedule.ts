// أنواع البيانات للفترات الدراسية
export interface ScheduleSlot {
  id: number;
  contentId: number;
  classroomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  location: string | null;
  distributionRoomId: string | null;
  createdAt: string;
  updatedAt: string;
  
  // بيانات المحتوى التدريبي المرتبط
  content: {
    id: number;
    code: string;
    name: string;
  };
  
  // بيانات الفصل الدراسي المرتبط
  classroom: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface ScheduleSlotRequest {
  contentId: number;
  classroomId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  location?: string;
  distributionRoomId?: string;
}

export interface ScheduleSlotsResponse {
  data: ScheduleSlot[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// خيارات أيام الأسبوع
export const DAYS_OF_WEEK = [
  { value: 'SUNDAY', label: 'الأحد' },
  { value: 'MONDAY', label: 'الاثنين' },
  { value: 'TUESDAY', label: 'الثلاثاء' },
  { value: 'WEDNESDAY', label: 'الأربعاء' },
  { value: 'THURSDAY', label: 'الخميس' },
  { value: 'FRIDAY', label: 'الجمعة' },
  { value: 'SATURDAY', label: 'السبت' },
];

// أنواع الحضور
export const ATTENDANCE_TYPES = [
  { value: 'PRESENT', label: 'حضور إجباري' },
  { value: 'OPTIONAL', label: 'حضور اختياري' },
  { value: 'ONLINE', label: 'أونلاين' },
  { value: 'OFFLINE', label: 'حضوري' },
];

// أوقات البداية المتاحة
export const START_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
];

// أوقات النهاية المتاحة
export const END_TIMES = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00',
  '20:30', '21:00', '21:30', '22:00', '22:30'
];

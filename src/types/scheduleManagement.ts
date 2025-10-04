// ==================== SCHEDULE MANAGEMENT TYPES ====================

// 1. نوع البيانات المرجعة من POST /api/schedule/slots
export interface CreateScheduleSlotResponse {
  id: number;
  contentId: number;
  classroomId: number;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'THEORY' | 'PRACTICAL';
  location: string | null;
  distributionRoomId: string | null;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  content: {
    id: number;
    code: string;
    name: string;
  };
  classroom: {
    id: number;
    name: string;
    startDate: string; // ISO Date
    endDate: string; // ISO Date
  };
}

// 2. نوع البيانات المرجعة من GET /api/schedule/classroom/{classroomId}
export interface ClassroomScheduleResponse {
  id: number;
  contentId: number;
  classroomId: number;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'THEORY' | 'PRACTICAL';
  location: string | null;
  distributionRoomId: string | null;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  content: {
    id: number;
    code: string;
    name: string;
    instructor: {
      id: number;
      name: string;
    };
  };
  classroom: {
    id: number;
    name: string;
  };
  distributionRoom: {
    id: string;
    roomName: string;
    roomNumber: string;
  } | null;
  _count: {
    sessions: number;
  };
}

// 3. نوع البيانات المرجعة من PUT /api/schedule/slots/{id}
export interface UpdateScheduleSlotResponse {
  id: number;
  contentId: number;
  classroomId: number;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'THEORY' | 'PRACTICAL';
  location: string | null;
  distributionRoomId: string | null;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  content: {
    id: number;
    code: string;
    name: string;
  };
  classroom: {
    id: number;
    name: string;
  };
}

// 4. نوع البيانات المرجعة من DELETE /api/schedule/slots/{id}
export interface DeleteScheduleSlotResponse {
  id: number;
  contentId: number;
  classroomId: number;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'THEORY' | 'PRACTICAL';
  location: string | null;
  distributionRoomId: string | null;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  content: {
    id: number;
    code: string;
    name: string;
  };
  classroom: {
    id: number;
    name: string;
  };
}

// 5. نوع البيانات المرجعة من GET /api/programs
export interface ProgramsResponse {
  id: number;
  nameAr: string;
  nameEn: string;
  description: string | null;
  duration: number; // عدد الأسابيع
  programType: 'SUMMER' | 'WINTER' | 'ANNUAL';
  enrollmentType: 'REGULAR' | 'DISTANCE' | 'BOTH';
  isActive: boolean;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  _count: {
    trainees: number;
    classrooms: number;
  };
  classrooms: {
    id: number;
    name: string;
    classNumber: number;
    startDate: string | null; // ISO Date
    endDate: string | null; // ISO Date
    createdAt: string; // ISO Date
    updatedAt: string; // ISO Date
  }[];
}

// 6. نوع البيانات المرجعة من GET /api/training-content
export interface TrainingContentResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  hours: number;
  isActive: boolean;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  instructor: {
    id: number;
    name: string;
    email: string;
  } | null;
  program: {
    id: number;
    nameAr: string;
    nameEn: string;
  };
  classrooms: {
    id: number;
    name: string;
    classNumber: number;
  }[];
}

// ==================== REQUEST TYPES ====================

// نوع البيانات المطلوبة لإنشاء فترة جديدة
export interface CreateScheduleSlotRequest {
  contentId: number;
  classroomId: number;
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: 'THEORY' | 'PRACTICAL';
  location?: string;
  distributionRoomId?: string;
}

// نوع البيانات المطلوبة لتحديث فترة موجودة
export interface UpdateScheduleSlotRequest {
  contentId?: number;
  classroomId?: number;
  dayOfWeek?: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  type?: 'THEORY' | 'PRACTICAL';
  location?: string;
  distributionRoomId?: string;
}

// ==================== ERROR TYPES ====================

// نوع الأخطاء المحتملة
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

// نوع الاستجابة في حالة الخطأ
export interface ErrorResponse {
  success: false;
  error: ApiError;
}

// نوع الاستجابة في حالة النجاح
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

// ==================== UTILITY TYPES ====================

// نوع للتحقق من صحة البيانات
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// نوع لإحصائيات الجدول
export interface ScheduleStats {
  totalSlots: number;
  theorySlots: number;
  practicalSlots: number;
  slotsByDay: {
    [key in 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY']: number;
  };
  totalSessions: number;
}

// نوع لعرض الجدول
export interface ScheduleDisplay {
  dayOfWeek: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  dayName: string;
  slots: ClassroomScheduleResponse[];
}

// ==================== CONSTANTS ====================

// أيام الأسبوع
export const DAYS_OF_WEEK = [
  { value: 'SUNDAY', label: 'الأحد' },
  { value: 'MONDAY', label: 'الاثنين' },
  { value: 'TUESDAY', label: 'الثلاثاء' },
  { value: 'WEDNESDAY', label: 'الأربعاء' },
  { value: 'THURSDAY', label: 'الخميس' },
  { value: 'FRIDAY', label: 'الجمعة' },
  { value: 'SATURDAY', label: 'السبت' },
] as const;

// أنواع الحصص
export const SLOT_TYPES = [
  { value: 'THEORY', label: 'نظري' },
  { value: 'PRACTICAL', label: 'عملي' },
] as const;

// أنواع البرامج
export const PROGRAM_TYPES = [
  { value: 'SUMMER', label: 'صيفي' },
  { value: 'WINTER', label: 'شتوي' },
  { value: 'ANNUAL', label: 'سنوي' },
] as const;

// أنواع الالتحاق
export const ENROLLMENT_TYPES = [
  { value: 'REGULAR', label: 'منتظم' },
  { value: 'DISTANCE', label: 'عن بُعد' },
  { value: 'BOTH', label: 'كلاهما' },
] as const;

// أوقات البداية المتاحة
export const START_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
] as const;

// أنواع البيانات المساعدة
export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type SessionType = 'THEORY' | 'PRACTICAL';

// نوع البيانات المرجعة من GET /api/schedule/classroom/{classroomId}
export interface ClassroomScheduleResponse {
  // بيانات الفترة الأساسية
  id: number;                    // معرف الفترة
  contentId: number;             // معرف المحتوى التدريبي
  classroomId: number;            // معرف الفصل الدراسي
  dayOfWeek: DayOfWeek;          // يوم الأسبوع
  startTime: string;             // وقت البداية (HH:mm)
  endTime: string;               // وقت النهاية (HH:mm)
  type: SessionType;             // نوع الحضور
  location: string | null;        // القاعة أو المكان
  distributionRoomId: string | null; // معرف المجموعة
  createdAt: string;             // تاريخ الإنشاء (ISO Date)
  updatedAt: string;             // تاريخ آخر تحديث (ISO Date)
  
  // بيانات المحتوى التدريبي المرتبط
  content: {
    id: number;                  // معرف المحتوى
    code: string;                // كود المادة
    name: string;                // اسم المادة
    instructor: {
      id: string;                // معرف المحاضر
      name: string;              // اسم المحاضر
    };
  };
  
  // بيانات الفصل الدراسي المرتبط
  classroom: {
    id: number;                  // معرف الفصل
    name: string;                // اسم الفصل
  };
  
  // بيانات المجموعة/القاعة (إذا كانت موجودة)
  distributionRoom: {
    id: string;                  // معرف المجموعة
    roomName: string;            // اسم القاعة
    roomNumber: string;          // رقم القاعة
  } | null;
  
  // إحصائيات الجلسات
  _count: {
    sessions: number;            // عدد الجلسات المولدة من هذه الفترة
  };
}

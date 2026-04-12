import { AttendanceStatus } from './enums';

export type DayOfWeek =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export type SessionType = 'THEORY' | 'PRACTICAL';

export interface AttendanceProgram {
  id: number;
  nameAr: string;
  nameEn?: string;
  description?: string | null;
  _count?: {
    classrooms?: number;
  };
}

export interface AttendanceClassroom {
  id: number;
  name: string;
  classNumber: number;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  _count?: {
    trainingContents?: number;
  };
}

export interface AttendanceProgramDetails {
  id: number;
  nameAr: string;
  classrooms: AttendanceClassroom[];
}

export interface AttendanceClassroomInfo {
  id: number;
  name: string;
  program: {
    id: number;
    nameAr: string;
  };
}

export interface AttendanceTrainingContent {
  id: number;
  code: string;
  name: string;
  classroomId: number;
  instructor?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    scheduleSlots?: number;
  };
}

export interface AttendanceSession {
  id: number;
  date: string;
  isCancelled: boolean;
  cancellationReason?: string | null;
  scheduleSlotId: number;
  scheduleSlot: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    type: SessionType;
    location?: string | null;
    distributionRoom?: {
      id: string;
      roomName: string;
    } | null;
  };
  _count?: {
    attendance?: number;
  };
}

export interface AttendanceSessionRecord {
  traineeId: number;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface AttendanceSessionContext {
  id: number;
  date: string;
  isCancelled: boolean;
  scheduleSlot: {
    id: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    type: SessionType;
    content: {
      id: number;
      code: string;
      name: string;
      classroom?: {
        id: number;
        name: string;
      };
      program?: {
        id: number;
        nameAr: string;
      };
    };
    distributionRoom?: {
      id: string;
      roomName: string;
    } | null;
  };
  attendance: AttendanceSessionRecord[];
}

export interface AttendanceTrainee {
  id: number;
  nameAr: string;
  nationalId: string;
  phone: string;
  email?: string;
}

export interface ExpectedAttendanceTraineesResponse {
  session: AttendanceSessionContext;
  trainees: AttendanceTrainee[];
  distributionRoom?: {
    id: string;
    roomName: string;
  } | null;
}

export interface AttendanceBulkRecordPayload {
  sessionId: number;
  records: Array<{
    traineeId: number;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface AttendanceCodeResponse {
  code: string;
  sessionId: number;
  isNew: boolean;
  expiresAt?: string | null;
  session?: {
    date: string;
    content: string;
    contentCode?: string;
    program?: string;
  };
}

export const ATTENDANCE_DAYS_AR: Record<DayOfWeek, string> = {
  SUNDAY: 'الاحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الاربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

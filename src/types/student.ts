import { EnrollmentType, MaritalStatus, ProgramType, Gender, Religion, EducationType, TraineeStatus, Year, SessionType, AttendanceStatus } from './enums';

// Core models returned from /trainees (dates come as ISO strings in HTTP)
export interface ITrainingProgram {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISession {
  id: number;
  title: string;
  type: SessionType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  chapter: number;
  notes?: string | null;
  contentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceRecord {
  id: number;
  sessionId: number;
  traineeId: number;
  status: AttendanceStatus;
  arrivalTime?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Included when you call /trainees with includeDetails=true
  session?: ISession;
}

export interface ITrainee {
  id: number;
  nameAr: string;
  nameEn: string;
  enrollmentType: EnrollmentType;
  maritalStatus: MaritalStatus;
  nationalId: string;
  idIssueDate: string;
  idExpiryDate: string;
  programType: ProgramType;
  nationality: string;
  gender: Gender;
  birthDate: string;
  residenceAddress: string;
  photoUrl?: string | null;
  photoCloudinaryId?: string | null;
  religion: Religion;
  programId: number;
  country: string;
  governorate?: string | null;
  city: string;
  address: string;
  phone: string;
  email?: string | null;
  guardianPhone: string;
  guardianEmail?: string | null;
  guardianJob?: string | null;
  guardianRelation: string;
  guardianName: string;
  landline?: string | null;
  whatsapp?: string | null;
  facebook?: string | null;
  educationType: EducationType;
  schoolName: string;
  graduationDate: string;
  totalGrade?: number | null;
  gradePercentage?: number | null;
  sportsActivity?: string | null;
  culturalActivity?: string | null;
  educationalActivity?: string | null;
  notes?: string | null;
  traineeStatus: TraineeStatus;
  classLevel: Year;
  academicYear?: string | null;
  marketingEmployeeId?: number | null;
  firstContactEmployeeId?: number | null;
  secondContactEmployeeId?: number | null;
  createdAt: string;
  updatedAt: string;

  // Always included by service: program
  program: ITrainingProgram;

  // Included only when includeDetails=true
  attendanceRecords?: IAttendanceRecord[];
}

// Pagination wrapper when you pass page & limit
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginatedTraineesResponse {
  data: ITrainee[];
  pagination: IPaginationMeta;
}

// When you do NOT pass page & limit, the endpoint returns a raw array:
export type ITraineesList = ITrainee[];

// Training Content Types
export interface IUser {
  id: string;
  name: string;
  email: string;
}

export interface ITrainingContent {
  id: number;
  code: string;
  name: string;
  semester: 'FIRST' | 'SECOND';
  year: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH';
  programId?: number | null;
  program?: ITrainingProgram | null;
  instructorId: string;
  instructor: IUser;
  theoryAttendanceRecorderId?: string | null;
  theoryAttendanceRecorder?: IUser | null;
  practicalAttendanceRecorderId?: string | null;
  practicalAttendanceRecorder?: IUser | null;
  durationMonths: number;
  theorySessionsPerWeek: number;
  practicalSessionsPerWeek: number;
  chaptersCount: number;
  yearWorkMarks: number;
  practicalMarks: number;
  writtenMarks: number;
  attendanceMarks: number;
  quizzesMarks: number;
  finalExamMarks: number;
  createdAt: string;
  updatedAt: string;
  
  // إضافي للتوافق مع API
  programIds: number[]; // مصفوفة تحتوي على programId إذا كان موجود
  
  // فقط عند includeQuestionCount=true
  _count?: {
    questions: number;
  };
}

// Legacy interface for backward compatibility
export interface IStudent {
  id?: string;
  nameAr: string;
  nameEn: string;
  enrollmentType: EnrollmentType;
  maritalStatus: MaritalStatus;
  nationalId: string;
  idIssueDate: string;
  idExpiryDate: string;
  programType: ProgramType;
  nationality: string;
  gender: Gender;
  birthDate: string;
  residenceAddress: string;
  photoUrl: string;
  religion: Religion;
  programId: number;
  country: string;
  governorate: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianJob: string;
  guardianRelation: string;
  guardianNationalId: string;
  landline: string;
  whatsapp: string;
  facebook: string;
  educationType: EducationType;
  schoolName: string;
  graduationDate: string;
  totalGrade: number;
  gradePercentage: number;
  traineeStatus: TraineeStatus;
  classLevel: Year;
  programName?: string;
  enrollmentDate?: string;
  lastActivity?: string;
}

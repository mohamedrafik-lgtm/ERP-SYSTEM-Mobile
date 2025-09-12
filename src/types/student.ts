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

// Question Types
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type QuestionSkill = 'RECALL' | 'COMPREHENSION' | 'DEDUCTION';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export interface IQuestionOption {
  id: number;
  text: string;
  isCorrect: boolean;
  questionId: number;
}

export interface ITrainingContentInfo {
  name: string;
  code: string;
}

export interface IQuestion {
  id: number;
  text: string;
  type: QuestionType;
  skill: QuestionSkill;
  difficulty: QuestionDifficulty;
  chapter: number;
  contentId: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  
  // Included relations
  options: IQuestionOption[];
  content: ITrainingContentInfo;
  createdBy: IUser;
}

export type IQuestionsByContentResponse = IQuestion[];

// Question Creation Types
export interface QuestionOption {
  text: string;        // نص الخيار
  isCorrect: boolean;  // هل الخيار صحيح أم لا
}

export interface CreateQuestionPayload {
  text: string;                    // نص السؤال (مطلوب)
  type: QuestionType;              // نوع السؤال (مطلوب)
  skill: QuestionSkill;            // المهارة التي يقيسها السؤال (مطلوب)
  difficulty: QuestionDifficulty;  // مستوى الصعوبة (مطلوب)
  chapter: number;                 // رقم الباب (مطلوب، أكبر من 0)
  contentId: number;               // ID المحتوى التدريبي (مطلوب)
  options: QuestionOption[];       // خيارات السؤال (مطلوب، مصفوفة، على الأقل خيار واحد)
}

// Safe (Treasury) Types
export type SafeCategory = 'DEBT' | 'INCOME' | 'EXPENSE' | 'ASSETS' | 'UNSPECIFIED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'FEE' | 'PAYMENT';

export interface ITransaction {
  id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  reference?: string | null;
  sourceId?: string | null;
  sourceSafe?: ISafe | null;
  targetId?: string | null;
  targetSafe?: ISafe | null;
  traineeFeeId?: number | null;
  traineeFee?: any | null;
  traineePaymentId?: number | null;
  traineePayment?: any | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ISafe {
  id: string;
  name: string;
  description?: string | null;
  category: SafeCategory;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Recent transactions (last 5 of each type)
  sourceTransactions: ITransaction[]; // التحويلات الصادرة
  targetTransactions: ITransaction[]; // التحويلات الواردة
  
  // Additional computed field
  hasTransactions: boolean; // هل تحتوي على معاملات أم لا
}

export type ISafesResponse = ISafe[];

export interface CreateSafePayload {
  name: string;                    // اسم الخزينة
  description: string;             // وصف الخزينة
  category: string;                // فئة الخزينة (UNSPECIFIED)
  balance: number;                 // الرصيد
  currency: string;                // العملة (مثل: EGP, USD)
  isActive: boolean;               // حالة الخزينة
}

export interface CreateTransactionPayload {
  amount: number;                    // قيمة المعاملة (مطلوب، أكبر من 0)
  type: TransactionType;             // نوع المعاملة (مطلوب)
  description?: string;              // وصف المعاملة (اختياري)
  reference?: string;                // رقم مرجعي للمعاملة (اختياري)
  sourceId?: string;                 // معرف الخزينة المصدر (اختياري)
  targetId?: string;                 // معرف الخزينة الهدف (اختياري)
}

// Fee Types
export type FeeType = 'TUITION' | 'SERVICES' | 'TRAINING' | 'ADDITIONAL';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

// Training Program interface
export interface ITrainingProgram {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Trainee interface (minimal for payments)
export interface ITrainee {
  id: number;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  phone: string;
  email?: string | null;
}

// Trainee Payment interface
export interface ITraineePayment {
  id: number;
  amount: number;
  status: PaymentStatus;
  feeId: number;
  traineeId: number;
  trainee: ITrainee;
  safeId: string;
  paidAmount: number;
  paidAt?: string | null;
  paidById?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Trainee Fee interface
export interface ITraineeFee {
  id: number;
  name: string;
  amount: number;
  type: FeeType;
  academicYear: string;
  allowMultipleApply: boolean;
  programId: number;
  program: ITrainingProgram;
  safeId: string;
  safe: ISafe;
  isApplied: boolean;
  appliedAt?: string | null;
  appliedById?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Only included when getting single fee by ID
  traineePayments?: ITraineePayment[];
}

// Response type
export type ITraineeFeesResponse = ITraineeFee[];

// Trainee Payment Response Types
export interface TraineePaymentResponse {
  id: number;                    // معرف الدفعة
  amount: number;                // المبلغ المطلوب دفعه
  status: PaymentStatus;         // حالة الدفع
  paidAmount: number;            // المبلغ المدفوع فعلياً
  paidAt?: string;               // تاريخ الدفع (ISO string)
  paidById?: string;             // معرف المستخدم الذي سجل الدفع
  notes?: string;                // ملاحظات
  createdAt: string;             // تاريخ الإنشاء (ISO string)
  updatedAt: string;             // تاريخ التحديث (ISO string)
  
  // بيانات المتدرب
  trainee: {
    id: number;
    nameAr: string;              // الاسم بالعربية
    nameEn: string;              // الاسم بالإنجليزية
    nationalId: string;          // الرقم القومي
    phone: string;               // رقم الهاتف
    email?: string;              // البريد الإلكتروني
    gender: Gender;              // الجنس
    traineeStatus: TraineeStatus; // حالة المتدرب
    programId: number;           // معرف البرنامج
  };
  
  // بيانات الرسوم
  fee: {
    id: number;
    name: string;                // اسم الرسوم
    amount: number;              // قيمة الرسوم
    type: FeeType;               // نوع الرسوم
    academicYear: string;        // العام الدراسي
    allowMultipleApply: boolean; // السماح بتطبيق متعدد
    programId: number;           // معرف البرنامج
    safeId: string;              // معرف الخزينة
    isApplied: boolean;          // حالة التطبيق
    appliedAt?: string;          // تاريخ التطبيق (ISO string)
    appliedById?: string;        // معرف من طبق الرسوم
    createdAt: string;           // تاريخ الإنشاء (ISO string)
    updatedAt: string;           // تاريخ التحديث (ISO string)
  };
  
  // بيانات الخزينة
  safe: {
    id: string;
    name: string;                // اسم الخزينة
    description?: string;        // وصف الخزينة
    category: SafeCategory;      // تصنيف الخزينة
    balance: number;             // الرصيد الحالي
    currency: string;            // العملة
    isActive: boolean;           // حالة الحساب
    createdAt: string;           // تاريخ الإنشاء (ISO string)
    updatedAt: string;           // تاريخ التحديث (ISO string)
  };
}

export type ITraineePaymentsResponse = TraineePaymentResponse[];

// Trainee Payment by Trainee Response
export interface TraineePaymentByTraineeResponse {
  id: number;                    // معرف الدفعة
  amount: number;                // المبلغ المطلوب دفعه
  status: PaymentStatus;         // حالة الدفع
  paidAmount: number;            // المبلغ المدفوع فعلياً
  paidAt?: string;                // تاريخ الدفع
  paidById?: string;             // معرف المستخدم الذي سجل الدفع
  notes?: string;                // ملاحظات
  createdAt: string;             // تاريخ الإنشاء
  updatedAt: string;             // تاريخ التحديث
  
  // بيانات الرسوم
  fee: {
    id: number;
    name: string;                // اسم الرسوم
    amount: number;              // قيمة الرسوم
    type: FeeType;               // نوع الرسوم
    academicYear: string;        // العام الدراسي
    allowMultipleApply: boolean; // السماح بتطبيق متعدد
    programId: number;           // معرف البرنامج
    safeId: string;              // معرف الخزينة
    isApplied: boolean;          // حالة التطبيق
    appliedAt?: string;          // تاريخ التطبيق
    appliedById?: string;        // معرف من طبق الرسوم
    createdAt: string;          // تاريخ الإنشاء
    updatedAt: string;           // تاريخ التحديث
  };
  
  // بيانات الخزينة
  safe: {
    id: string;
    name: string;                // اسم الخزينة
    description?: string;        // وصف الخزينة
    category: SafeCategory;      // تصنيف الخزينة
    balance: number;             // الرصيد الحالي
    currency: string;            // العملة
    isActive: boolean;           // حالة الحساب
    createdAt: string;          // تاريخ الإنشاء
    updatedAt: string;           // تاريخ التحديث
  };
  
  // المعاملات المالية المرتبطة
  transactions: {
    id: string;
    amount: number;              // قيمة التحويل
    type: TransactionType;       // نوع التحويل
    description?: string;        // وصف التحويل
    reference?: string;           // رقم مرجعي
    sourceId?: string;           // الحساب المصدر
    targetId?: string;           // الحساب الهدف
    traineeFeeId?: number;       // معرف رسوم المتدرب
    traineePaymentId?: number;   // معرف دفع المتدرب
    createdById?: string;        // المستخدم الذي أنشأ التحويل
    createdAt: string;          // تاريخ الإنشاء
    updatedAt: string;           // تاريخ التحديث
  }[];
}

// Auto Payment Request
export interface AutoPaymentRequest {
  traineeId: number;        // معرف المتدرب (مطلوب)
  amount: number;            // المبلغ الإجمالي المدفوع (مطلوب)
  safeId: string;           // معرف الخزينة المستلمة للدفع (مطلوب)
  notes?: string;            // ملاحظات إضافية (اختياري)
}

export interface CreateTraineeFeePayload {
  name: string;                    // اسم الرسوم (مطلوب)
  amount: number;                  // قيمة الرسوم (مطلوب، أكبر من 0)
  type: FeeType;                   // نوع الرسوم (مطلوب)
  academicYear: string;            // العام الدراسي (مطلوب)
  allowMultipleApply?: boolean;    // السماح بتطبيق الرسوم أكثر من مرة (اختياري، افتراضي: false)
  programId: number;               // معرف البرنامج التدريبي (مطلوب)
  safeId: string;                  // معرف الخزينة (مطلوب)
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

// Trainee Update Types
export interface UpdateTraineePayload {
  nameAr?: string;
  nameEn?: string;
  enrollmentType?: EnrollmentType;
  maritalStatus?: MaritalStatus;
  nationalId?: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  programType?: ProgramType;
  nationality?: string;
  gender?: Gender;
  birthDate?: string;
  residenceAddress?: string;
  religion?: Religion;
  programId?: number;
  country?: string;
  governorate?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianJob?: string;
  guardianRelation?: string;
  guardianName?: string;
  landline?: string;
  whatsapp?: string;
  facebook?: string;
  educationType?: EducationType;
  schoolName?: string;
  graduationDate?: string;
  totalGrade?: number;
  gradePercentage?: number;
  sportsActivity?: string;
  culturalActivity?: string;
  educationalActivity?: string;
  notes?: string;
  traineeStatus?: TraineeStatus;
  classLevel?: Year;
  academicYear?: string;
  marketingEmployeeId?: number;
  firstContactEmployeeId?: number;
  secondContactEmployeeId?: number;
}

export interface UpdateTraineeResponse {
  success: boolean;
  message: string;
  data?: ITrainee;
  error?: string;
}

// Trainee Delete Types
export interface DeleteTraineeResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Trainee Documents Types
export type DocumentType = 
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'BIRTH_CERTIFICATE'
  | 'EDUCATION_CERTIFICATE'
  | 'MEDICAL_CERTIFICATE'
  | 'PHOTO'
  | 'CONTRACT'
  | 'OTHER';

export interface TraineeDocument {
  id: string;
  traineeId: number;
  documentType: DocumentType;
  fileName: string;             // اسم الملف الأصلي
  filePath: string;             // مسار الملف المخزن
  cloudinaryId?: string | null; // معرف الملف في Cloudinary
  fileSize: number;             // حجم الملف بالبايت
  mimeType: string;             // نوع الملف
  uploadedAt: string;           // ISO date
  notes?: string | null;        // ملاحظات
  isVerified: boolean;          // هل تم التحقق؟
  verifiedAt?: string | null;   // ISO date
  verifiedById?: string | null; // معرف من تحقق
  createdAt: string;            // ISO date
  updatedAt: string;            // ISO date

  uploadedBy: {
    id: string;
    name: string;
  };
}

export interface DocumentWithStatus {
  type: DocumentType;            // نوع الوثيقة
  nameAr: string;               // اسم الوثيقة بالعربية
  required: boolean;            // هل الوثيقة مطلوبة؟
  document: TraineeDocument | null; // بيانات الوثيقة (إذا كانت مرفوعة)
  isUploaded: boolean;          // هل الوثيقة مرفوعة؟
  isVerified: boolean;          // هل الوثيقة محققة؟
}

export interface TraineeDocumentsResponse {
  trainee: {
    id: number;
    nameAr: string;              // الاسم بالعربية
    photoUrl?: string | null;    // رابط الصورة الشخصية
    createdAt: string;           // ISO date
    updatedAt: string;           // ISO date
  };

  documents: DocumentWithStatus[];

  stats: {
    totalRequired: number;       // إجمالي الوثائق المطلوبة
    totalOptional: number;       // إجمالي الوثائق الاختيارية
    uploadedRequired: number;    // عدد الوثائق المطلوبة المرفوعة
    uploadedOptional: number;    // عدد الوثائق الاختيارية المرفوعة
    verifiedCount: number;       // عدد الوثائق المحققة
    completionPercentage: number; // نسبة إكمال الوثائق المطلوبة (%)
    isComplete: boolean;         // هل جميع الوثائق المطلوبة مرفوعة؟
  };
}
// WhatsApp Management Types

export interface WhatsAppQRCodeResponse {
  qrCode?: string | null;    // كود QR للاتصال بـ WhatsApp (إذا كان متوفراً)
  isReady: boolean;          // هل العميل جاهز ومتصل؟
  error?: string;            // رسالة خطأ (إذا حدث خطأ)
}

export interface WhatsAppStatusResponse {
  isReady: boolean;              // هل العميل جاهز للاستخدام؟
  isConnected: boolean;          // هل متصل بـ WhatsApp؟
  qrCode?: string;               // كود QR (إذا كان متوفراً)
  phoneNumber?: string;          // رقم الهاتف المتصل
  lastActivity?: string;         // آخر نشاط (ISO date)
  restartCount?: number;         // عدد مرات إعادة التشغيل (في النسخة المحسنة)
  lastError?: string;            // آخر خطأ حدث (في النسخة المحسنة)
}

export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  isReady: boolean;
  lastConnected?: string;
  error?: string;
}

export interface WhatsAppMessageTemplate {
  id: string;
  name: string;
  content: string;
  type: 'welcome' | 'notification' | 'invoice' | 'report';
  isActive: boolean;
}

export interface WhatsAppSettings {
  autoWelcome: boolean;
  autoNotifications: boolean;
  autoInvoices: boolean;
  autoReports: boolean;
  welcomeMessage: string;
  notificationMessage: string;
  invoiceMessage: string;
  reportMessage: string;
}

export interface WhatsAppSendMessageRequest {
  phoneNumber: string;
  message: string;
}

export interface WhatsAppSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppLogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// WhatsApp Auto Message Types
export type MessagePriority = 'urgent' | 'important' | 'normal';
export type MessageTiming = 'immediate' | 'scheduled' | 'periodic';
export type MessageCategory = 
  | 'student_management'
  | 'payment_management'
  | 'lecture_management'
  | 'attendance_management'
  | 'user_management'
  | 'marketing_management'
  | 'program_management'
  | 'exam_management'
  | 'system_notification'
  | 'event_management'
  | 'certificate_management'
  | 'inquiry_management';

export interface WhatsAppAutoMessage {
  id: string;
  category: MessageCategory;
  type: string;
  priority: MessagePriority;
  timing: MessageTiming;
  phoneNumber: string;
  message: string;
  data?: any;
  scheduledAt?: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

// Student Management Messages
export interface StudentWelcomeMessage {
  studentName: string;
  studentId: string;
  programName: string;
  loginCredentials: {
    username: string;
    password: string;
  };
  startDate: string;
  contactInfo: string;
}

export interface StudentUpdateMessage {
  studentName: string;
  updatedFields: string[];
  newData: any;
  updatedBy: string;
  updateDate: string;
}

export interface StudentStatusChangeMessage {
  studentName: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  effectiveDate: string;
}

export interface StudentDeletionMessage {
  studentName: string;
  reason: string;
  deletedBy: string;
  deletionDate: string;
}

// Payment Management Messages
export interface PaymentDueMessage {
  studentName: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paymentMethods: string[];
  lateFee?: number;
}

export interface PaymentConfirmationMessage {
  studentName: string;
  amount: number;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  remainingBalance?: number;
}

export interface PaymentReminderMessage {
  studentName: string;
  amount: number;
  daysOverdue: number;
  lateFee: number;
  finalDueDate: string;
}

export interface PaymentCancellationMessage {
  studentName: string;
  feeType: string;
  amount: number;
  reason: string;
  cancelledBy: string;
  cancellationDate: string;
}

// Lecture Management Messages
export interface NewLectureMessage {
  studentName: string;
  lectureTitle: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  materials?: string[];
}

export interface LectureReminderMessage {
  studentName: string;
  lectureTitle: string;
  date: string;
  time: string;
  location: string;
  reminderTime: string;
}

export interface LectureRescheduleMessage {
  studentName: string;
  lectureTitle: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  reason: string;
}

export interface LectureCancellationMessage {
  studentName: string;
  lectureTitle: string;
  date: string;
  time: string;
  reason: string;
  alternativeDate?: string;
}

// Attendance Management Messages
export interface AttendanceReminderMessage {
  studentName: string;
  lectureTitle: string;
  date: string;
  time: string;
  location: string;
}

export interface AbsenceNotificationMessage {
  studentName: string;
  lectureTitle: string;
  date: string;
  absenceReason?: string;
  excuseInstructions: string;
}

export interface LateArrivalMessage {
  studentName: string;
  lectureTitle: string;
  scheduledTime: string;
  actualTime: string;
  delayMinutes: number;
}

// User Management Messages
export interface UserCreationMessage {
  userName: string;
  userRole: string;
  loginCredentials: {
    username: string;
    password: string;
  };
  permissions: string[];
  createdBy: string;
}

export interface PasswordResetMessage {
  userName: string;
  resetCode: string;
  expiryTime: string;
  resetLink?: string;
}

export interface PermissionChangeMessage {
  userName: string;
  oldPermissions: string[];
  newPermissions: string[];
  changedBy: string;
  changeDate: string;
}

export interface UserDeactivationMessage {
  userName: string;
  reason: string;
  deactivatedBy: string;
  deactivationDate: string;
}

// Marketing Management Messages
export interface TraineeAssignmentMessage {
  traineeName: string;
  marketerName: string;
  marketerContact: string;
  assignmentDate: string;
  programDetails: string;
}

export interface GoalAchievementMessage {
  marketerName: string;
  goalType: string;
  targetAmount: number;
  achievedAmount: number;
  achievementDate: string;
  bonus?: number;
}

export interface GoalReminderMessage {
  marketerName: string;
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  deadline: string;
}

// Program Management Messages
export interface ProgramStartMessage {
  studentName: string;
  programName: string;
  startDate: string;
  duration: string;
  schedule: string;
  instructor: string;
  materials: string[];
}

export interface ProgramCompletionMessage {
  studentName: string;
  programName: string;
  completionDate: string;
  certificateNumber: string;
  grade: string;
  nextSteps: string[];
}

export interface ProgramUpdateMessage {
  studentName: string;
  programName: string;
  updatedContent: string;
  updateDate: string;
  updatedBy: string;
}

// Exam Management Messages
export interface NewExamMessage {
  studentName: string;
  examTitle: string;
  examDate: string;
  examTime: string;
  duration: string;
  location: string;
  instructions: string[];
  materials: string[];
}

export interface ExamReminderMessage {
  studentName: string;
  examTitle: string;
  examDate: string;
  examTime: string;
  preparationTips: string[];
}

export interface ExamResultMessage {
  studentName: string;
  examTitle: string;
  score: number;
  totalScore: number;
  grade: string;
  feedback: string;
  retakeInfo?: string;
}

// System Notification Messages
export interface MaintenanceNotificationMessage {
  maintenanceDate: string;
  duration: string;
  affectedServices: string[];
  alternativeContact: string;
}

export interface SystemUpdateMessage {
  updateDate: string;
  newFeatures: string[];
  bugFixes: string[];
  improvements: string[];
}

export interface TechnicalIssueMessage {
  issueDescription: string;
  affectedServices: string[];
  expectedResolution: string;
  contactInfo: string;
}

// Event Management Messages
export interface NewEventMessage {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  participationInstructions: string;
}

export interface EventReminderMessage {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  reminderTime: string;
}

export interface EventCancellationMessage {
  eventName: string;
  eventDate: string;
  reason: string;
  alternativeEvent?: string;
}

// Certificate Management Messages
export interface CertificateReadyMessage {
  studentName: string;
  certificateType: string;
  programName: string;
  collectionDate: string;
  collectionLocation: string;
  requiredDocuments: string[];
}

export interface CertificateReminderMessage {
  studentName: string;
  certificateType: string;
  collectionDeadline: string;
  collectionLocation: string;
  contactInfo: string;
}

// Inquiry Management Messages
export interface InquiryConfirmationMessage {
  inquiryNumber: string;
  responseTime: string;
  contactInfo: string;
  status: string;
}

export interface InquiryResponseMessage {
  inquiryNumber: string;
  response: string;
  additionalInfo: string;
  followUpRequired: boolean;
}

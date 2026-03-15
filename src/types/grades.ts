// Grades Management Types

export interface TraineesForGradesResponse {
  data: TraineeForGrades[];     // قائمة المتدربين
  total: number;                 // العدد الكلي للمتدربين
  page: number;                  // الصفحة الحالية
  limit: number;                 // عدد العناصر في الصفحة
  totalPages: number;           // إجمالي عدد الصفحات
}

export interface TraineeForGrades {
  // بيانات المتدرب الأساسية
  id: number;                   // معرف المتدرب
  nameAr: string;               // الاسم بالعربية
  nameEn: string;               // الاسم بالإنجليزية
  nationalId: string;           // الرقم القومي
  photoUrl: string | null;      // رابط الصورة الشخصية
  
  // بيانات البرنامج التدريبي
  program: {
    id: number;                 // معرف البرنامج
    nameAr: string;             // اسم البرنامج بالعربية
    nameEn: string;             // اسم البرنامج بالإنجليزية
    _count: {
      trainingContents: number; // عدد المواد التدريبية في البرنامج
    };
  };
  
  // إحصائيات الدرجات
  _count: {
    grades: number;            // عدد الدرجات المسجلة للمتدرب
  };
}

export interface GradeParams {
  limit?: string;       // عدد العناصر في الصفحة (اختياري، افتراضي: 1000)
  search?: string;      // البحث بالاسم أو الرقم القومي (اختياري)
  programId?: string;   // فلترة حسب البرنامج التدريبي (اختياري)
}

// Types for individual trainee grades
export interface TraineeGradesResponse {
  trainee: {
    id: number;
    nameAr: string;
    nameEn: string;
    nationalId: string;
    photoUrl: string | null;
    phone: string | null;
    email: string | null;
    program: {
      id: number;
      nameAr: string;
      nameEn: string;
    };
  };
  contentGrades: ContentGrade[];
}

export interface ContentGrade {
  content: {
    id: number;
    name: string;
    code: string;
    maxMarks: {
      yearWorkMarks: number;      // درجات أعمال السنة
      practicalMarks: number;    // درجات العملي
      writtenMarks: number;       // درجات التحريري
      attendanceMarks: number;   // درجات الحضور
      quizzesMarks: number;      // درجات اختبارات مصغرة
      finalExamMarks: number;    // درجات الميد تيرم
      total: number;             // مجموع الدرجات الكلي
    };
    classroom: {
      id: number;
      name: string;
    };
  };
  grade: {
    id: number;
    traineeId: number;
    trainingContentId: number;
    classroomId: number;
    yearWorkMarks: number | null;
    practicalMarks: number | null;
    writtenMarks: number | null;
    attendanceMarks: number | null;
    quizzesMarks: number | null;
    finalExamMarks: number | null;
    totalMarks: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;  // null إذا لم تكن هناك درجات مسجلة للمادة
}

// Types for second-round students page
export interface FailedSubject {
  content: {
    id: number;
    name: string;
    code?: string;
  };
  totalMarks: number;
  maxMarks: number;
  percentage: number;
}

export interface SecondRoundStudent {
  trainee: {
    id: number;
    nameAr: string;
    nameEn?: string;
    nationalId: string;
    photoUrl?: string | null;
    program: {
      id: number;
      nameAr: string;
      nameEn?: string;
    };
  };
  failedSubjects: FailedSubject[];
}

export interface ClassroomSecondRound {
  classroom: {
    id: number;
    name: string;
  };
  students: SecondRoundStudent[];
  totalStudents: number;
}

// Types for mercy grades page
export interface MercyGradeProgram {
  id: number;
  nameAr: string;
}

export interface MercyGradeClassroom {
  id: number;
  name: string;
  classNumber?: number;
}

export interface MercyGradeTrainingContent {
  id: number;
  name: string;
  code?: string;
}

export interface MercyPreviewItem {
  traineeId: number;
  traineeName: string;
  nationalId: string;
  contentName: string;
  contentId: number;
  currentTotal: number;
  projectedTotal: number;
  addedPoints: number;
}

export interface MercyPreviewResult {
  classroomId: number;
  classroomName: string;
  programName: string;
  bonusPoints: number;
  threshold: number;
  totalAffected: number;
  preview: MercyPreviewItem[];
}

export interface MercyApplyDetail {
  traineeId: number;
  traineeName: string;
  contentName: string;
  oldTotal: number;
  newTotal: number;
  addedPoints: number;
  distribution?: Record<string, { old: number; added: number; new: number; max: number }>;
}

export interface MercyApplyResult {
  classroomId: number;
  classroomName: string;
  programName: string;
  bonusPoints: number;
  threshold: number;
  totalUpdated: number;
  totalErrors: number;
  details: MercyApplyDetail[];
  errors: string[];
}

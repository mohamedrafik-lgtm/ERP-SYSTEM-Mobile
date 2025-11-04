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

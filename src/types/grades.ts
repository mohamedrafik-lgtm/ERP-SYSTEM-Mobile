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

// Types for Quiz Management

export interface QuizQuestionDto {
  questionId: number;        // معرف السؤال من بنك الأسئلة
  order?: number;           // ترتيب السؤال في الاختبار (اختياري)
  points?: number;          // درجة السؤال (اختياري، افتراضي 1)
}

export interface CreateQuizRequest {
  // الحقول المطلوبة
  trainingContentId: number;  // معرف المحتوى التدريبي
  title: string;              // عنوان الاختبار
  startDate: string;          // تاريخ ووقت بداية الاختبار (ISO date string)
  endDate: string;            // تاريخ ووقت نهاية الاختبار (ISO date string)
  duration: number;           // مدة الاختبار بالدقائق (>= 1)
  questions: QuizQuestionDto[]; // قائمة الأسئلة

  // الحقول الاختيارية
  description?: string;       // وصف الاختبار
  instructions?: string;      // تعليمات الاختبار
  passingScore?: number;      // درجة النجاح (0-100%)
  maxAttempts?: number;       // عدد المحاولات المسموح بها (>= 1)
  shuffleQuestions?: boolean; // خلط ترتيب الأسئلة
  shuffleAnswers?: boolean;   // خلط ترتيب الإجابات
  showResults?: boolean;      // عرض النتائج للمتدرب بعد الانتهاء
  showCorrectAnswers?: boolean; // عرض الإجابات الصحيحة
  isActive?: boolean;         // هل الاختبار نشط
  isPublished?: boolean;      // هل تم نشر الاختبار
}

export interface QuizResponse {
  id: number;
  trainingContentId: number;
  title: string;
  description?: string;
  instructions?: string;
  startDate: string;
  endDate: string;
  duration: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  trainingContent: {
    id: number;
    nameAr: string;
    nameEn: string;
  };
  questions: QuizQuestionDto[];
  _count: {
    attempts: number;
    questions: number;
  };
}

export interface QuizListResponse {
  quizzes: QuizResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {
  id: number;
}

export interface QuizStats {
  totalQuizzes: number;
  activeQuizzes: number;
  publishedQuizzes: number;
  totalAttempts: number;
  averageScore: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  traineeId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeSpent: number; // بالدقائق
  completedAt: string;
  status: 'completed' | 'in_progress' | 'abandoned';
  trainee: {
    id: string;
    nameAr: string;
    nameEn: string;
  };
}

export interface QuizAttemptsResponse {
  attempts: QuizAttempt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Financial Reports Types

/**
 * Query Parameters للتقارير المالية
 */
export interface FinancialDashboardQuery {
  dateFrom?: string;  // تاريخ البداية بصيغة ISO 8601 (مثال: "2025-01-01")
  dateTo?: string;    // تاريخ النهاية بصيغة ISO 8601 (مثال: "2025-01-31")
}

/**
 * ملخص التقرير المالي
 */
export interface FinancialSummary {
  totalIncome: number;         // إجمالي الدخل (مدفوعات + إيداعات)
  totalExpenses: number;       // إجمالي المصروفات
  totalTransfers: number;      // إجمالي التحويلات
  netIncome: number;           // صافي الدخل (الدخل - المصروفات)
  totalBalance: number;        // إجمالي أرصدة جميع الخزائن
  transactionsToday: number;   // عدد المعاملات اليوم
  incomeTransactions: number;  // عدد معاملات الدخل
  expenseTransactions: number; // عدد معاملات المصروفات
}

/**
 * بيانات الخزينة في التقرير
 */
export interface SafeReportData {
  id: string;                  // معرف الخزينة
  name: string;                // اسم الخزينة
  balance: number;             // رصيد الخزينة الحالي
  currency: string;            // العملة (مثل: "EGP")
  transactionsCount: number;   // عدد المعاملات الخاصة بالخزينة
}

/**
 * الدخل حسب النوع
 */
export interface IncomeByType {
  type: string;                // نوع المعاملة ("PAYMENT" | "DEPOSIT")
  amount: number;              // إجمالي المبلغ
  count: number;               // عدد المعاملات
  percentage: string;          // النسبة المئوية من إجمالي الدخل
}

/**
 * الدخل حسب الخزينة
 */
export interface IncomeByTarget {
  safeName: string;            // اسم الخزينة
  safeId: string;              // معرف الخزينة
  income: number;              // إجمالي الدخل للخزينة
  transactionsCount: number;   // عدد معاملات الدخل
}

/**
 * معاملة مالية حديثة
 */
export interface RecentTransaction {
  id: string;                  // معرف المعاملة
  amount: number;              // المبلغ
  type: string;                // نوع المعاملة
  description: string;         // وصف المعاملة
  sourceSafe?: string;         // اسم الخزينة المصدر (اختياري)
  targetSafe?: string;         // اسم الخزينة الهدف (اختياري)
  traineeName?: string;        // اسم المتدرب (اختياري)
  feeName?: string;            // اسم الرسم (اختياري)
  createdAt: string;           // تاريخ الإنشاء (ISO string)
}

/**
 * Response من API التقارير المالية
 */
export interface FinancialDashboardResponse {
  summary: FinancialSummary;
  safes: SafeReportData[];
  incomeByType: IncomeByType[];
  incomeByTarget: IncomeByTarget[];
  recentTransactions: RecentTransaction[];
}
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';

interface ControlSystemScreenProps {
  navigation: any;
}

type AnswerSheet = {
  id: number;
  status?: string;
  score?: number;
  percentage?: number;
  trainee?: {
    nameAr?: string;
  };
  model?: {
    modelCode?: string;
  };
};

type PaperExam = {
  id: number;
  title: string;
  examDate: string;
  totalMarks: number;
  gradeType: string;
  status: string;
  trainingContent?: {
    name?: string;
    code?: string;
    classroom?: {
      name?: string;
      program?: {
        name?: string;
      };
    };
  };
  _count?: {
    answerSheets?: number;
  };
  answerSheets?: AnswerSheet[];
};

const gradeTypeMap: Record<string, string> = {
  YEAR_WORK: 'أعمال السنة',
  PRACTICAL: 'العملي',
  WRITTEN: 'التحريري',
  FINAL_EXAM: 'الميد تيرم',
};

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'مسودة', bg: '#f3f4f6', text: '#374151' },
  PUBLISHED: { label: 'منشور', bg: '#dbeafe', text: '#1d4ed8' },
  IN_PROGRESS: { label: 'قيد التنفيذ', bg: '#fef3c7', text: '#a16207' },
  COMPLETED: { label: 'مكتمل', bg: '#dcfce7', text: '#15803d' },
  ARCHIVED: { label: 'مؤرشف', bg: '#f3e8ff', text: '#7e22ce' },
};

const ControlSystemScreen: React.FC<ControlSystemScreenProps> = ({ navigation }) => {
  const REQUEST_TIMEOUT_MS = 12000;
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [exams, setExams] = useState<PaperExam[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedExam, setSelectedExam] = useState<PaperExam | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [uploadingExamId, setUploadingExamId] = useState<number | null>(null);
  const [downloadingExamId, setDownloadingExamId] = useState<number | null>(null);

  const canViewControl = hasPermission('dashboard.control', 'view');

  useEffect(() => {
    if (!permissionsLoading && !canViewControl) {
      Toast.show({
        type: 'error',
        text1: 'ليس لديك صلاحية الوصول لنظام الكونترول',
        position: 'bottom',
      });
    }
  }, [canViewControl, permissionsLoading]);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      }),
    ]);
  }, []);

  const fetchExamDetails = useCallback(async (exam: PaperExam): Promise<PaperExam> => {
    try {
      const details = await withTimeout(AuthService.getPaperExamById(exam.id), REQUEST_TIMEOUT_MS);
      if (!details?.id) return exam;

      if (!Array.isArray(details.answerSheets)) {
        try {
          const report = await withTimeout(AuthService.getPaperExamReport(exam.id), REQUEST_TIMEOUT_MS);
          return {
            ...details,
            answerSheets: Array.isArray(report?.answerSheets) ? report.answerSheets : [],
          };
        } catch {
          return {
            ...details,
            answerSheets: [],
          };
        }
      }

      return details;
    } catch {
      return exam;
    }
  }, [REQUEST_TIMEOUT_MS, withTimeout]);

  const loadExams = useCallback(async () => {
    try {
      const list = await withTimeout(AuthService.getAllPaperExams(), REQUEST_TIMEOUT_MS);
      const normalized: PaperExam[] = Array.isArray(list) ? list : [];

      // Render quickly using base list, then hydrate full details in background.
      setExams(normalized);

      if (normalized.length === 0) {
        return;
      }

      setDetailsLoading(true);
      void (async () => {
        const detailsResults = await Promise.allSettled(normalized.map((exam) => fetchExamDetails(exam)));

        const byId: Record<number, PaperExam> = {};
        detailsResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            byId[result.value.id] = result.value;
          } else {
            byId[normalized[index].id] = normalized[index];
          }
        });

        setExams((prev) => prev.map((exam) => byId[exam.id] || exam));
        setDetailsLoading(false);
      })();
    } catch (error) {
      console.error('Error loading control exams:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل اختبارات الكونترول',
        text2: 'تحقق من الاتصال وحاول مرة أخرى',
        position: 'bottom',
      });
      setExams([]);
      setDetailsLoading(false);
    }
  }, [REQUEST_TIMEOUT_MS, fetchExamDetails, withTimeout]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await loadExams();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadExams]);

  useEffect(() => {
    if (!permissionsLoading && canViewControl) {
      loadData();
    }
  }, [permissionsLoading, canViewControl, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredExams = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return exams;

    return exams.filter((exam) => {
      const title = (exam.title || '').toLowerCase();
      const contentName = (exam.trainingContent?.name || '').toLowerCase();
      const contentCode = (exam.trainingContent?.code || '').toLowerCase();
      return title.includes(q) || contentName.includes(q) || contentCode.includes(q);
    });
  }, [exams, filterText]);

  const stats = useMemo(() => {
    const totalExams = filteredExams.length;
    const completedExams = filteredExams.filter((e) => e.status === 'COMPLETED').length;
    const totalSheets = filteredExams.reduce((sum, e) => sum + (e._count?.answerSheets || 0), 0);
    const gradedSheets = filteredExams.reduce(
      (sum, e) => sum + ((e.answerSheets || []).filter((s) => s.status === 'GRADED').length || 0),
      0
    );

    return {
      totalExams,
      completedExams,
      totalSheets,
      gradedSheets,
    };
  }, [filteredExams]);

  const getGradeTypeLabel = (gradeType?: string) => {
    if (!gradeType) return 'غير محدد';
    return gradeTypeMap[gradeType] || gradeType;
  };

  const getStatusInfo = (status?: string) => {
    if (!status) return { label: 'غير محدد', bg: '#f3f4f6', text: '#374151' };
    return statusMap[status] || { label: status, bg: '#f3f4f6', text: '#374151' };
  };

  const getSheetStatus = (status?: string) => {
    if (status === 'GRADED') return { label: 'مُصحح', color: '#15803d' };
    if (status === 'SUBMITTED') return { label: 'تم التسليم', color: '#d97706' };
    if (status === 'VERIFIED') return { label: 'مُراجع', color: '#2563eb' };
    return { label: 'لم يُسلم', color: '#64748b' };
  };

  const getPercentageColors = (percentage?: number) => {
    if (percentage == null) return { bg: '#e2e8f0', text: '#64748b' };
    if (percentage >= 90) return { bg: '#dcfce7', text: '#15803d' };
    if (percentage >= 75) return { bg: '#dbeafe', text: '#1d4ed8' };
    if (percentage >= 50) return { bg: '#fef3c7', text: '#a16207' };
    return { bg: '#fee2e2', text: '#b91c1c' };
  };

  const openGradesModal = (exam: PaperExam) => {
    setSelectedExam(exam);
    setShowGradesModal(true);
  };

  const handleUploadExcel = async (examId: number) => {
    let pickerLib: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      pickerLib = require('@react-native-documents/picker');
      const picker = pickerLib.default || pickerLib;

      const result = await picker.pick({
        type: [
          picker.types.xlsx,
          picker.types.xls,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        allowMultiSelection: false,
      });

      const file = Array.isArray(result) ? result[0] : result;
      if (!file?.uri) {
        Toast.show({ type: 'error', text1: 'لم يتم اختيار ملف صالح', position: 'bottom' });
        return;
      }

      const name = file.name || 'grades.xlsx';
      const type = file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      setUploadingExamId(examId);
      const uploadResult = await AuthService.uploadPaperExamGradesExcel(examId, {
        uri: file.fileCopyUri || file.uri,
        name,
        type,
      });

      const success = Number(uploadResult?.success || 0);
      const failed = Number(uploadResult?.failed || 0);

      Toast.show({
        type: failed > 0 ? 'info' : 'success',
        text1: failed > 0 ? 'تم رفع الملف مع بعض الأخطاء' : 'تم رفع الدرجات بنجاح',
        text2: `تم تحديث ${success} متدرب${failed > 0 ? ` - فشل ${failed}` : ''}`,
        position: 'bottom',
      });

      await loadData();
    } catch (error: any) {
      const picker = pickerLib?.default || pickerLib;
      const isCancel =
        !!picker?.isErrorWithCode?.(error) && error?.code === picker?.errorCodes?.OPERATION_CANCELED;
      if (isCancel) {
        return;
      }

      console.error('Upload grades excel error:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل رفع ملف الدرجات',
        text2: error?.message || 'حدث خطأ أثناء الرفع',
        position: 'bottom',
      });
    } finally {
      setUploadingExamId(null);
    }
  };

  const handleDownloadTemplate = async (examId: number) => {
    try {
      setDownloadingExamId(examId);
      const result = await AuthService.downloadPaperExamGradesTemplate(examId);
      Toast.show({
        type: 'success',
        text1: 'تم تحميل شيت الدرجات',
        text2: `المسار: ${result.path}`,
        position: 'bottom',
      });
    } catch (error: any) {
      console.error('Download template error:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل شيت الدرجات',
        text2: error?.message || 'حدث خطأ أثناء التحميل',
        position: 'bottom',
      });
    } finally {
      setDownloadingExamId(null);
    }
  };

  const activeSelectedExam = useMemo(() => {
    if (!selectedExam) return null;
    return exams.find((exam) => exam.id === selectedExam.id) || selectedExam;
  }, [exams, selectedExam]);

  const selectedSheets = useMemo(() => {
    const sheets = activeSelectedExam?.answerSheets || [];
    return [...sheets].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [activeSelectedExam]);

  if (permissionsLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="ControlSystem" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>نظام الكونترول</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل بيانات الكونترول...</Text>
        </View>
      </View>
    );
  }

  if (!canViewControl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="ControlSystem" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>نظام الكونترول</Text>
            <Text style={styles.subtitle}>لا تملك صلاحية الوصول</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="block" size={44} color="#ef4444" />
          <Text style={styles.noAccessTitle}>غير متاح</Text>
          <Text style={styles.noAccessText}>ليس لديك صلاحية الوصول لنظام الكونترول.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="ControlSystem" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>نظام الكونترول</Text>
          <Text style={styles.subtitle}>
            {detailsLoading ? 'إدارة درجات المتدربين (جاري استكمال التفاصيل...)' : 'إدارة درجات المتدربين في الاختبارات الورقية'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} tintColor="#1a237e" />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="description" size={22} color="#2563eb" />
            <Text style={styles.statValue}>{stats.totalExams}</Text>
            <Text style={styles.statLabel}>إجمالي الاختبارات</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="check-circle" size={22} color="#16a34a" />
            <Text style={styles.statValue}>{stats.completedExams}</Text>
            <Text style={styles.statLabel}>اختبارات مكتملة</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="groups" size={22} color="#7c3aed" />
            <Text style={styles.statValue}>{stats.totalSheets}</Text>
            <Text style={styles.statLabel}>إجمالي أوراق الإجابة</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="bar-chart" size={22} color="#d97706" />
            <Text style={styles.statValue}>{stats.gradedSheets}</Text>
            <Text style={styles.statLabel}>أوراق مُصححة</Text>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Icon name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={filterText}
            onChangeText={setFilterText}
            placeholder="ابحث عن اختبار (العنوان، المادة، الكود...)"
            placeholderTextColor="#94a3b8"
          />
          {filterText.length > 0 && (
            <TouchableOpacity onPress={() => setFilterText('')}>
              <Icon name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={18} color="#2563eb" />
            <Text style={styles.infoTitle}>كيفية استخدام نظام الكونترول</Text>
          </View>
          <Text style={styles.infoStep}>1. اضغط تحميل شيت الدرجات لتحميل ملف Excel بقائمة المتدربين.</Text>
          <Text style={styles.infoStep}>2. أدخل الدرجات داخل عمود الدرجة في الملف.</Text>
          <Text style={styles.infoStep}>3. اضغط رفع لإدخال الدرجات تلقائيا في النظام.</Text>
          <Text style={styles.infoStep}>4. اضغط الدرجات لعرض تفاصيل نتائج المتدربين.</Text>
        </View>

        {filteredExams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="description" size={42} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد اختبارات</Text>
            <Text style={styles.emptySubtitle}>
              {filterText ? 'لا توجد اختبارات مطابقة للبحث' : 'لم يتم العثور على اختبارات ورقية'}
            </Text>
          </View>
        ) : (
          filteredExams.map((exam) => {
            const statusInfo = getStatusInfo(exam.status);
            const gradedCount = (exam.answerSheets || []).filter((s) => s.status === 'GRADED').length;
            const totalCount = exam._count?.answerSheets || exam.answerSheets?.length || 0;
            const progressPct = totalCount > 0 ? Math.round((gradedCount / totalCount) * 100) : 0;
            const programName = exam.trainingContent?.classroom?.program?.name || '';
            const classroomName = exam.trainingContent?.classroom?.name || '';

            return (
              <View key={exam.id} style={styles.examCard}>
                <View style={styles.examTopRow}>
                  <View style={styles.examMainInfo}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <Text style={styles.examSub}>
                      {(exam.trainingContent?.code || '-') + ' - ' + (exam.trainingContent?.name || '-')}
                    </Text>
                    {!!(programName || classroomName) && (
                      <Text style={styles.examSubMeta}>
                        {(programName || '-') + ' - ' + (classroomName || '-')}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{new Date(exam.examDate).toLocaleDateString('ar-EG')}</Text>
                    <Text style={styles.metaLabel}>التاريخ</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{exam.totalMarks || 0}</Text>
                    <Text style={styles.metaLabel}>الدرجة</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{getGradeTypeLabel(exam.gradeType)}</Text>
                    <Text style={styles.metaLabel}>النوع</Text>
                  </View>
                </View>

                <View style={styles.progressWrap}>
                  <View style={styles.progressRowText}>
                    <Text style={styles.progressLabel}>نسبة التصحيح</Text>
                    <Text style={styles.progressLabel}>{`${gradedCount}/${totalCount} (${progressPct}%)`}</Text>
                  </View>
                  <View style={styles.progressBarBase}>
                    <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.secondaryBtn]}
                    onPress={() => handleDownloadTemplate(exam.id)}
                    disabled={downloadingExamId === exam.id}
                  >
                    <Icon name="download" size={16} color="#1a237e" />
                    <Text style={styles.secondaryBtnText}>
                      {downloadingExamId === exam.id ? 'جاري التحميل...' : 'تحميل'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.primaryBtn]}
                    onPress={() => handleUploadExcel(exam.id)}
                    disabled={uploadingExamId === exam.id}
                  >
                    <Icon name="upload-file" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>{uploadingExamId === exam.id ? 'جاري الرفع...' : 'رفع'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => openGradesModal(exam)}>
                    <Icon name="bar-chart" size={16} color="#1a237e" />
                    <Text style={styles.secondaryBtnText}>الدرجات</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <Modal visible={showGradesModal} transparent animationType="slide" onRequestClose={() => setShowGradesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{activeSelectedExam?.title || 'الدرجات'}</Text>
                <Text style={styles.modalSubtitle}>
                  {(activeSelectedExam?.trainingContent?.name || '-') + ' - ' + getGradeTypeLabel(activeSelectedExam?.gradeType)}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowGradesModal(false)}>
                <Icon name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSheets.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Icon name="groups" size={40} color="#cbd5e1" />
                  <Text style={styles.modalEmptyText}>لا توجد أوراق إجابة لهذا الاختبار</Text>
                </View>
              ) : (
                selectedSheets.map((sheet, index) => {
                  const statusInfo = getSheetStatus(sheet.status);
                  const percentageColors = getPercentageColors(sheet.percentage);

                  return (
                    <View key={sheet.id} style={styles.sheetCard}>
                      <View style={styles.sheetTop}>
                        <Text style={styles.sheetName}>
                          {index + 1}. {sheet.trainee?.nameAr || 'غير معروف'}
                        </Text>
                        <Text style={[styles.sheetStatus, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                      </View>

                      <View style={styles.sheetMetaRow}>
                        <Text style={styles.sheetMeta}>النموذج: {sheet.model?.modelCode || '-'}</Text>
                        <Text style={styles.sheetMeta}>
                          الدرجة: {sheet.score ?? '-'} / {activeSelectedExam?.totalMarks || '-'}
                        </Text>
                        <View style={[styles.percentageBadge, { backgroundColor: percentageColors.bg }]}>
                          <Text style={[styles.percentageText, { color: percentageColors.text }]}>
                            {sheet.percentage != null ? `${sheet.percentage.toFixed(1)}%` : '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ControlSystemScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  loadingText: { color: '#6b7280' },
  noAccessTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 8 },
  noAccessText: { color: '#6b7280', textAlign: 'center' },
  backBtn: { marginTop: 8, backgroundColor: '#1a237e', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#0f172a',
    marginHorizontal: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: '#0f172a',
    fontWeight: '700',
    marginLeft: 6,
  },
  infoStep: {
    color: '#475569',
    marginBottom: 6,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 16,
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#64748b',
  },
  examCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  examTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  examMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  examTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  examSub: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  examSubMeta: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  metaItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginRight: 6,
  },
  metaValue: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  metaLabel: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 10,
  },
  progressWrap: {
    marginBottom: 10,
  },
  progressRowText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  progressBarBase: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  primaryBtn: {
    backgroundColor: '#1a237e',
    marginHorizontal: 6,
  },
  secondaryBtn: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 12,
  },
  secondaryBtnText: {
    color: '#1a237e',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  modalSubtitle: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 12,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalEmpty: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 8,
    color: '#64748b',
  },
  sheetCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sheetName: {
    color: '#111827',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  sheetStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetMetaRow: {
    gap: 6,
  },
  sheetMeta: {
    color: '#475569',
    fontSize: 12,
  },
  percentageBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

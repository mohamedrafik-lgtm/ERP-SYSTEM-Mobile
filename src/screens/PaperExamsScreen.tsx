import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

interface PaperExamsScreenProps {
  navigation: any;
}

type PaperExam = {
  id: number;
  title?: string;
  examDate?: string;
  examType?: string;
  status?: string;
  totalQuestions?: number;
  passingScore?: number;
  trainingContent?: {
    id?: number;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
  _count?: {
    models?: number;
    answerSheets?: number;
  };
};

const PaperExamsScreen: React.FC<PaperExamsScreenProps> = ({ navigation }) => {
  const [paperExams, setPaperExams] = useState<PaperExam[]>([]);
  const [trainingContents, setTrainingContents] = useState<any[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const normalizeTrainingContents = useCallback((response: any): any[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (response && Array.isArray(response.trainingContents)) {
      return response.trainingContents;
    }

    return [];
  }, []);

  const loadPaperExams = useCallback(async () => {
    try {
      const contentId = selectedContentId !== 'all' ? parseInt(selectedContentId, 10) : undefined;
      const exams = await AuthService.getAllPaperExams(contentId);
      setPaperExams(Array.isArray(exams) ? exams : []);
    } catch (error) {
      console.error('Error loading paper exams:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل الاختبارات الورقية',
        text2: 'تعذر الاتصال بالخادم',
        position: 'bottom',
      });
      setPaperExams([]);
    }
  }, [selectedContentId]);

  const loadTrainingContents = useCallback(async () => {
    try {
      const response = await AuthService.getTrainingContents();
      setTrainingContents(normalizeTrainingContents(response));
    } catch (error) {
      console.error('Error loading training contents:', error);
      setTrainingContents([]);
    }
  }, [normalizeTrainingContents]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadPaperExams(), loadTrainingContents()]);
    setLoading(false);
  }, [loadPaperExams, loadTrainingContents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPaperExams();
    setRefreshing(false);
  }, [loadPaperExams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = paperExams.length;
    const active = paperExams.filter((exam) => exam.status === 'active').length;
    const totalModels = paperExams.reduce((sum, exam) => sum + (exam._count?.models || 0), 0);
    const totalSheets = paperExams.reduce((sum, exam) => sum + (exam._count?.answerSheets || 0), 0);

    return { total, active, totalModels, totalSheets };
  }, [paperExams]);

  const contentOptions = useMemo(
    () => [
      { value: 'all', label: 'جميع المواد' },
      ...trainingContents.map((content) => ({
        value: String(content.id),
        label: content.nameAr || content.nameEn || content.name || `مادة #${content.id}`,
      })),
    ],
    [trainingContents]
  );

  const getStatusLabel = (status?: string) => {
    if (!status) return 'غير محدد';
    if (status === 'active') return 'نشط';
    if (status === 'draft') return 'مسودة';
    if (status === 'archived') return 'مؤرشف';
    return status;
  };

  const getExamTypeLabel = (type?: string) => {
    if (!type) return 'غير محدد';
    if (type === 'midterm') return 'منتصف الفصل';
    if (type === 'final') return 'نهائي';
    if (type === 'quiz') return 'كويز';
    return type;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'غير محدد';

    try {
      return new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  const handleDeleteExam = (exam: PaperExam) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف الاختبار "${exam.title || exam.id}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingId(exam.id);
            await AuthService.deletePaperExam(exam.id);
            Toast.show({
              type: 'success',
              text1: 'تم حذف الاختبار الورقي',
              position: 'bottom',
            });
            await loadPaperExams();
          } catch (error) {
            console.error('Error deleting paper exam:', error);
            Toast.show({
              type: 'error',
              text1: 'فشل حذف الاختبار الورقي',
              position: 'bottom',
            });
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل الاختبارات الورقية...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaperExams" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>الاختبارات الورقية</Text>
          <Text style={styles.subtitle}>إدارة الاختبارات الورقية ونماذجها</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.filterCard}>
          <SelectBox
            label="فلترة حسب المادة"
            selectedValue={selectedContentId}
            onValueChange={setSelectedContentId}
            items={contentOptions}
            placeholder="اختر المادة"
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>إجمالي الاختبارات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>اختبارات نشطة</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalModels}</Text>
            <Text style={styles.statLabel}>نماذج الإجابة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSheets}</Text>
            <Text style={styles.statLabel}>أوراق الإجابة</Text>
          </View>
        </View>

        {paperExams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="description" size={28} color="#9ca3af" />
            <Text style={styles.emptyTitle}>لا توجد اختبارات ورقية</Text>
            <Text style={styles.emptySubtitle}>لا توجد بيانات متاحة بالفلتر الحالي</Text>
          </View>
        ) : (
          paperExams.map((exam) => (
            <View key={exam.id} style={styles.examCard}>
              <View style={styles.examHeader}>
                <Text style={styles.examTitle}>{exam.title || `اختبار #${exam.id}`}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getStatusLabel(exam.status)}</Text>
                </View>
              </View>

              <Text style={styles.examMeta}>
                المادة: {exam.trainingContent?.nameAr || exam.trainingContent?.nameEn || exam.trainingContent?.name || 'غير محدد'}
              </Text>
              <Text style={styles.examMeta}>التاريخ: {formatDate(exam.examDate)}</Text>
              <Text style={styles.examMeta}>النوع: {getExamTypeLabel(exam.examType)}</Text>
              <Text style={styles.examMeta}>عدد الأسئلة: {exam.totalQuestions || 0}</Text>
              <Text style={styles.examMeta}>درجة النجاح: {exam.passingScore || 0}%</Text>
              <Text style={styles.examMeta}>نماذج الإجابة: {exam._count?.models || 0}</Text>
              <Text style={styles.examMeta}>أوراق الإجابة: {exam._count?.answerSheets || 0}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.infoBtn]}
                  onPress={() => navigation.navigate('PaperExamDetails', { examId: exam.id })}
                >
                  <Icon name="visibility" size={16} color="#fff" />
                  <Text style={styles.actionText}>عرض</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => navigation.navigate('EditPaperExam', { examId: exam.id })}
                >
                  <Icon name="edit" size={16} color="#fff" />
                  <Text style={styles.actionText}>تعديل</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn, deletingId === exam.id ? styles.disabledBtn : null]}
                  onPress={() => handleDeleteExam(exam)}
                  disabled={deletingId === exam.id}
                >
                  <Icon name="delete" size={16} color="#fff" />
                  <Text style={styles.actionText}>{deletingId === exam.id ? 'جاري الحذف...' : 'حذف'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('AddPaperExam')}
        >
          <Icon name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>إضافة اختبار ورقي</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PaperExamsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
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
  content: { flex: 1, padding: 20 },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    marginTop: 4,
    color: '#6b7280',
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  examTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: '700',
  },
  examMeta: {
    color: '#4b5563',
    marginBottom: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoBtn: {
    backgroundColor: '#0288d1',
    marginRight: 6,
  },
  editBtn: {
    backgroundColor: '#f9a825',
    marginRight: 6,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
  },
});

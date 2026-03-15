import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

interface PaperExamDetailsScreenProps {
  navigation: any;
  route: {
    params?: {
      examId?: number;
    };
  };
}

const gradeTypeMap: Record<string, string> = {
  YEAR_WORK: 'أعمال السنة',
  PRACTICAL: 'العملي',
  WRITTEN: 'التحريري',
  FINAL_EXAM: 'الميد تيرم',
};

const statusMap: Record<string, string> = {
  DRAFT: 'مسودة',
  PUBLISHED: 'منشور',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  ARCHIVED: 'مؤرشف',
};

const PaperExamDetailsScreen: React.FC<PaperExamDetailsScreenProps> = ({ navigation, route }) => {
  const examId = route.params?.examId;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exam, setExam] = useState<any>(null);

  const loadExam = useCallback(async () => {
    if (!examId) {
      Toast.show({ type: 'error', text1: 'لم يتم تحديد الاختبار', position: 'bottom' });
      navigation.goBack();
      return;
    }

    try {
      const data = await AuthService.getPaperExamById(examId);
      setExam(data);
    } catch (error) {
      console.error('Error loading paper exam details:', error);
      Toast.show({ type: 'error', text1: 'فشل تحميل تفاصيل الاختبار', position: 'bottom' });
      setExam(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, navigation]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExam();
  };

  const stats = useMemo(() => {
    if (!exam) {
      return { models: 0, sheets: 0, questions: 0 };
    }

    const modelsCount = Array.isArray(exam.models) ? exam.models.length : 0;
    const sheetsCount = exam._count?.answerSheets || 0;
    const questionsCount = Array.isArray(exam.models)
      ? exam.models.reduce((sum: number, model: any) => sum + (Array.isArray(model.questions) ? model.questions.length : 0), 0)
      : 0;

    return {
      models: modelsCount,
      sheets: sheetsCount,
      questions: questionsCount,
    };
  }, [exam]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('ar-EG');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل الاختبار...</Text>
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>تعذر تحميل بيانات الاختبار</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadExam}>
          <Text style={styles.retryText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaperExams" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تفاصيل الاختبار الورقي</Text>
          <Text style={styles.subtitle}>{exam.title}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.models}</Text>
            <Text style={styles.statLabel}>النماذج</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.sheets}</Text>
            <Text style={styles.statLabel}>أوراق الإجابة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.questions}</Text>
            <Text style={styles.statLabel}>إجمالي الأسئلة</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>بيانات الاختبار</Text>
          <Text style={styles.meta}>العنوان: {exam.title || '-'}</Text>
          <Text style={styles.meta}>المادة: {exam.trainingContent?.code || '-'} - {exam.trainingContent?.name || '-'}</Text>
          <Text style={styles.meta}>النوع: {gradeTypeMap[exam.gradeType] || exam.gradeType || '-'}</Text>
          <Text style={styles.meta}>الحالة: {statusMap[exam.status] || exam.status || '-'}</Text>
          <Text style={styles.meta}>إجمالي الدرجات: {exam.totalMarks || 0}</Text>
          <Text style={styles.meta}>درجة النجاح: {exam.passingScore || 0}%</Text>
          <Text style={styles.meta}>المدة: {exam.duration || 0} دقيقة</Text>
          <Text style={styles.meta}>تاريخ الاختبار: {formatDate(exam.examDate)}</Text>
          <Text style={styles.meta}>العام الدراسي: {exam.academicYear || '-'}</Text>
          <Text style={styles.meta}>الوصف: {exam.description || '-'}</Text>
          <Text style={styles.meta}>التعليمات: {exam.instructions || '-'}</Text>
          <Text style={styles.meta}>ملاحظات: {exam.notes || '-'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>نماذج الاختبار</Text>
          {Array.isArray(exam.models) && exam.models.length > 0 ? (
            exam.models.map((model: any) => (
              <View key={model.id} style={styles.modelCard}>
                <Text style={styles.modelTitle}>النموذج {model.modelCode || '-'}</Text>
                <Text style={styles.modelMeta}>اسم النموذج: {model.modelName || '-'}</Text>
                <Text style={styles.modelMeta}>عدد الأسئلة: {Array.isArray(model.questions) ? model.questions.length : 0}</Text>
                <Text style={styles.modelMeta}>أوراق الإجابة: {model._count?.answerSheets || 0}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد نماذج حتى الآن</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditPaperExam', { examId: exam.id })}
          >
            <Icon name="edit" size={16} color="#fff" />
            <Text style={styles.actionText}>تعديل الاختبار</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default PaperExamDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6fa' },
  loadingText: { marginTop: 10, color: '#64748b' },
  retryBtn: { marginTop: 10, backgroundColor: '#1a237e', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: { fontSize: 20, color: '#1a237e', fontWeight: '800' },
  statLabel: { marginTop: 3, color: '#64748b', fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { color: '#111827', fontWeight: '700', marginBottom: 8, fontSize: 15 },
  meta: { color: '#475569', marginBottom: 6, lineHeight: 20 },
  modelCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  modelTitle: { color: '#1f2937', fontWeight: '700', marginBottom: 4 },
  modelMeta: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  emptyText: { color: '#6b7280' },
  actionsRow: { marginTop: 4, marginBottom: 14 },
  editBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: { color: '#fff', fontWeight: '700' },
});

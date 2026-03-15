import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { QuizResponse, QuizAttemptsResponse, QuizAttempt } from '../types/quiz';

interface QuizDetailsScreenProps {
  navigation: any;
  route: {
    params?: {
      quizId?: number;
    };
  };
}

const QuizDetailsScreen: React.FC<QuizDetailsScreenProps> = ({ navigation, route }) => {
  const quizId = route.params?.quizId;
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!quizId) {
      Toast.show({
        type: 'error',
        text1: 'لم يتم تحديد الاختبار',
        position: 'bottom',
      });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [quizData, attemptsData]: [QuizResponse, QuizAttemptsResponse] = await Promise.all([
        AuthService.getQuizById(quizId),
        AuthService.getQuizAttempts(quizId, { page: 1, limit: 20 }),
      ]);

      setQuiz(quizData);
      setAttempts(attemptsData.attempts || []);
    } catch (error) {
      console.error('Error loading quiz details:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل تفاصيل الاختبار',
        text2: 'حاول مرة أخرى',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('ar-SA');
  };

  const getStatusText = () => {
    if (!quiz) return '';
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (!quiz.isActive) return 'غير نشط';
    if (!quiz.isPublished) return 'مسودة';
    if (now < startDate) return 'قريباً';
    if (now > endDate) return 'منتهي';
    return 'نشط';
  };

  const getStatusColor = () => {
    if (!quiz) return '#6b7280';
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (!quiz.isActive) return '#6b7280';
    if (!quiz.isPublished) return '#f59e0b';
    if (now < startDate) return '#3b82f6';
    if (now > endDate) return '#ef4444';
    return '#10b981';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل الاختبار</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل الاختبار</Text>
            <Text style={styles.subtitle}>غير متاح</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>تعذر تحميل بيانات الاختبار</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadData}>
            <Text style={styles.primaryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تفاصيل الاختبار</Text>
          <Text style={styles.subtitle}>{quiz.title}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          <Text style={styles.contentText}>
            {quiz.trainingContent?.nameAr || quiz.trainingContent?.nameEn || '-'}
          </Text>

          {!!quiz.description && <Text style={styles.description}>{quiz.description}</Text>}

          <View style={styles.infoGrid}>
            <Text style={styles.infoItem}>المدة: {quiz.duration} دقيقة</Text>
            <Text style={styles.infoItem}>الأسئلة: {quiz._count?.questions || 0}</Text>
            <Text style={styles.infoItem}>المحاولات: {quiz._count?.attempts || 0}</Text>
            <Text style={styles.infoItem}>النجاح: {quiz.passingScore ?? '-'}%</Text>
            <Text style={styles.infoItem}>البداية: {formatDate(quiz.startDate)}</Text>
            <Text style={styles.infoItem}>النهاية: {formatDate(quiz.endDate)}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('EditQuiz', { quizId: quiz.id })}
            >
              <Icon name="edit" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>تعديل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.reportBtn]}
              onPress={() => navigation.navigate('QuizReport', { quizId: quiz.id })}
            >
              <Icon name="assessment" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>التقرير</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>آخر المحاولات</Text>
            <TouchableOpacity onPress={() => navigation.navigate('QuizReport', { quizId: quiz.id })}>
              <Text style={styles.linkText}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {attempts.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد محاولات حتى الآن</Text>
          ) : (
            attempts.slice(0, 10).map((attempt) => (
              <View key={String(attempt.id)} style={styles.attemptRow}>
                <View style={styles.attemptInfo}>
                  <Text style={styles.attemptName}>{attempt.trainee?.nameAr || attempt.trainee?.nameEn || 'طالب'}</Text>
                  <Text style={styles.attemptMeta}>
                    النتيجة: {attempt.score ?? 0} | الصحيحة: {attempt.correctAnswers ?? 0}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('QuizAttemptDetails', {
                      quizId: quiz.id,
                      attemptId: attempt.id,
                    })
                  }
                >
                  <Icon name="chevron-left" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizDetailsScreen;

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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  content: { flex: 1, padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  quizTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1f2937' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  contentText: { marginTop: 8, color: '#4b5563', fontWeight: '600' },
  description: { marginTop: 10, color: '#6b7280', lineHeight: 20 },
  infoGrid: { marginTop: 14, gap: 6 },
  infoItem: { color: '#374151', fontSize: 13 },
  actionsRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: { backgroundColor: '#0f766e' },
  reportBtn: { backgroundColor: '#1d4ed8' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  linkText: { color: '#1d4ed8', fontWeight: '700' },
  attemptRow: {
    marginTop: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  attemptInfo: { flex: 1 },
  attemptName: { color: '#1f2937', fontWeight: '700' },
  attemptMeta: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  loadingText: { color: '#6b7280' },
  emptyText: { color: '#6b7280', textAlign: 'center' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#1a237e',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});

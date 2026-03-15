import React, { useEffect, useMemo, useState } from 'react';
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
import { QuizAttemptDetailsResponse } from '../types/quiz';

interface QuizAttemptDetailsScreenProps {
  navigation: any;
  route: {
    params?: {
      quizId?: number;
      attemptId?: string | number;
    };
  };
}

const QuizAttemptDetailsScreen: React.FC<QuizAttemptDetailsScreenProps> = ({ navigation, route }) => {
  const quizId = route.params?.quizId;
  const attemptId = route.params?.attemptId;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<QuizAttemptDetailsResponse | null>(null);

  const loadDetails = async () => {
    if (!attemptId) {
      Toast.show({ type: 'error', text1: 'لم يتم تحديد المحاولة', position: 'bottom' });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const data = await AuthService.getQuizAttemptDetails(String(attemptId));
      setDetails(data);
    } catch (error) {
      console.error('Error loading attempt details:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل تفاصيل المحاولة',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [attemptId]);

  const stats = useMemo(() => {
    const answers = details?.answers || [];
    const total = answers.length;
    const correct = answers.filter(a => !!a.isCorrect).length;
    return {
      total,
      correct,
      wrong: Math.max(0, total - correct),
    };
  }, [details]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل المحاولة</Text>
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

  if (!details) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل المحاولة</Text>
            <Text style={styles.subtitle}>غير متاح</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>لا توجد بيانات للمحاولة</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تفاصيل المحاولة</Text>
          <Text style={styles.subtitle}>{details.trainee.nameAr}</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (quizId) {
              navigation.navigate('QuizReport', { quizId });
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>معلومات المتدرب</Text>
          <Text style={styles.itemText}>الاسم: {details.trainee.nameAr}</Text>
          <Text style={styles.itemText}>الرقم القومي: {details.trainee.nationalId || '-'}</Text>
          <Text style={styles.itemText}>الاختبار: {details.quiz.title}</Text>
          <Text style={styles.itemText}>الحالة: {details.passed ? 'ناجح' : 'راسب'}</Text>
          <Text style={styles.itemText}>الدرجة: {Number(details.score || 0).toFixed(2)}</Text>
          <Text style={styles.itemText}>النسبة: {Number(details.percentage || 0).toFixed(2)}%</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>إجمالي الأسئلة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#15803d' }]}>{stats.correct}</Text>
            <Text style={styles.statLabel}>صحيحة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#b91c1c' }]}>{stats.wrong}</Text>
            <Text style={styles.statLabel}>خاطئة</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>تفاصيل الإجابات</Text>

          {(details.questions || [])
            .slice()
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
            .map((question, idx) => {
              const answer = (details.answers || []).find(a => String(a.questionId) === String(question.question.id));
              const isCorrect = !!answer?.isCorrect;

              return (
                <View
                  key={String(question.id)}
                  style={[
                    styles.questionCard,
                    { borderColor: isCorrect ? '#86efac' : '#fca5a5' },
                  ]}
                >
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionIndex}>س{idx + 1}</Text>
                    <Text style={[styles.badge, { backgroundColor: isCorrect ? '#16a34a' : '#dc2626' }]}>
                      {isCorrect ? 'صحيحة' : 'خاطئة'}
                    </Text>
                  </View>

                  <Text style={styles.questionText}>{question.question.text}</Text>

                  {(question.question.options || []).map(option => {
                    const isSelected = String(answer?.selectedOptionId) === String(option.id);
                    const isRightOption = !!option.isCorrect;

                    return (
                      <View
                        key={String(option.id)}
                        style={[
                          styles.optionRow,
                          isSelected && styles.selectedOption,
                          details.quiz.showCorrectAnswers && isRightOption && styles.correctOption,
                        ]}
                      >
                        <Text style={styles.optionText}>{option.text}</Text>
                        <View style={styles.optionIcons}>
                          {isSelected && <Icon name="check-circle" size={16} color="#2563eb" />}
                          {details.quiz.showCorrectAnswers && isRightOption && (
                            <Icon name="verified" size={16} color="#16a34a" />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizAttemptDetailsScreen;

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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  itemText: { color: '#374151', marginBottom: 5 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  statLabel: { marginTop: 3, color: '#6b7280', fontSize: 12 },
  questionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionIndex: { color: '#1e3a8a', fontWeight: '700' },
  badge: {
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  questionText: { color: '#111827', fontWeight: '600', marginBottom: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  selectedOption: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  correctOption: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  optionText: { flex: 1, color: '#374151' },
  optionIcons: { flexDirection: 'row', gap: 6 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
});

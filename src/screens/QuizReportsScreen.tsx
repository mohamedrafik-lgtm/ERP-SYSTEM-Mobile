import React, { useEffect, useState } from 'react';
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
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { QuizListResponse, QuizResponse } from '../types/quiz';

interface QuizReportsScreenProps {
  navigation: any;
}

const QuizReportsScreen: React.FC<QuizReportsScreenProps> = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data: QuizListResponse = await AuthService.getAllQuizzes({ limit: 100 });
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error loading quizzes for reports:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل قائمة الاختبارات',
        position: 'bottom',
      });
      setQuizzes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuizzes();
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString('ar-SA');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="QuizReports" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تقارير الاختبارات</Text>
          <Text style={styles.subtitle}>{quizzes.length} اختبار</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الاختبارات...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1a237e']}
              tintColor="#1a237e"
            />
          }
        >
          {quizzes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="assessment" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>لا توجد اختبارات</Text>
              <Text style={styles.emptySubtitle}>أنشئ اختبارًا أولاً لتظهر تقاريره هنا</Text>
            </View>
          ) : (
            quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                style={styles.quizCard}
                onPress={() => navigation.navigate('QuizReport', { quizId: quiz.id })}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <Icon name="chevron-left" size={24} color="#64748b" />
                </View>

                <Text style={styles.quizSub}>
                  {quiz.trainingContent?.nameAr || quiz.trainingContent?.nameEn || '-'}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>الأسئلة: {quiz._count?.questions || 0}</Text>
                  <Text style={styles.metaText}>المحاولات: {quiz._count?.attempts || 0}</Text>
                </View>

                <Text style={styles.dateText}>
                  {formatDate(quiz.startDate)} - {formatDate(quiz.endDate)}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default QuizReportsScreen;

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
  content: { flex: 1, padding: 20 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
  emptyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { color: '#1f2937', fontWeight: '700', fontSize: 16 },
  emptySubtitle: { color: '#6b7280', textAlign: 'center' },
  quizCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  quizTitle: { flex: 1, color: '#111827', fontWeight: '700', fontSize: 15 },
  quizSub: { marginTop: 6, color: '#475569' },
  metaRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: '#6b7280', fontSize: 12 },
  dateText: { marginTop: 8, color: '#334155', fontSize: 12 },
});

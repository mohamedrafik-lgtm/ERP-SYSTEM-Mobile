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
import { QuizReportResponse, QuizReportAttempt } from '../types/quiz';

interface QuizReportScreenProps {
  navigation: any;
  route: {
    params?: {
      quizId?: number;
    };
  };
}

const QuizReportScreen: React.FC<QuizReportScreenProps> = ({ navigation, route }) => {
  const quizId = route.params?.quizId;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<QuizReportResponse | null>(null);
  const [showPassed, setShowPassed] = useState(true);
  const [showFailed, setShowFailed] = useState(false);
  const [showNotTaken, setShowNotTaken] = useState(false);

  const loadReport = async () => {
    if (!quizId) {
      Toast.show({ type: 'error', text1: 'لم يتم تحديد الاختبار', position: 'bottom' });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const data = await AuthService.getQuizReport(quizId);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل تقرير الاختبار',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [quizId]);

  const completedAttempts = useMemo(
    () => (report?.attempts || []).filter(a => String(a.status).toUpperCase() === 'SUBMITTED'),
    [report],
  );

  const passedAttempts = useMemo(
    () => completedAttempts.filter(a => !!a.passed),
    [completedAttempts],
  );

  const failedAttempts = useMemo(
    () => completedAttempts.filter(a => !a.passed),
    [completedAttempts],
  );

  const openAttempt = (attempt: QuizReportAttempt) => {
    navigation.navigate('QuizAttemptDetails', {
      quizId,
      attemptId: attempt.id,
    });
  };

  const renderAttemptRow = (attempt: QuizReportAttempt, index: number) => (
    <TouchableOpacity key={String(attempt.id)} style={styles.attemptRow} onPress={() => openAttempt(attempt)}>
      <View style={styles.rankBox}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>

      <View style={styles.attemptInfo}>
        <Text style={styles.name}>{attempt.trainee?.nameAr || 'طالب'}</Text>
        <Text style={styles.meta}>رقم قومي: {attempt.trainee?.nationalId || '-'}</Text>
      </View>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreText}>{Number(attempt.percentage || 0).toFixed(1)}%</Text>
        <Text style={styles.scoreSub}>{Number(attempt.score || 0).toFixed(1)}</Text>
      </View>

      <Icon name="chevron-left" size={22} color="#6b7280" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تقرير الاختبار</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تقرير الاختبار</Text>
            <Text style={styles.subtitle}>غير متاح</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>لا توجد بيانات للتقرير</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={loadReport}>
            <Text style={styles.reloadText}>إعادة المحاولة</Text>
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
          <Text style={styles.title}>تقرير الاختبار</Text>
          <Text style={styles.subtitle}>{report.quiz.title}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedAttempts.length}</Text>
            <Text style={styles.statLabel}>إجمالي المحاولات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#15803d' }]}>{passedAttempts.length}</Text>
            <Text style={styles.statLabel}>ناجح</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#b91c1c' }]}>{failedAttempts.length}</Text>
            <Text style={styles.statLabel}>راسب</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#7c3aed' }]}>{report.traineesWhoDidNotTakeQuiz.length}</Text>
            <Text style={styles.statLabel}>لم يختبر</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowPassed(v => !v)}>
            <Text style={styles.sectionTitle}>الناجحون ({passedAttempts.length})</Text>
            <Icon name={showPassed ? 'expand-less' : 'expand-more'} size={24} color="#111827" />
          </TouchableOpacity>
          {showPassed && (
            <View>
              {passedAttempts.length === 0 ? (
                <Text style={styles.emptyText}>لا يوجد ناجحون</Text>
              ) : (
                passedAttempts.map((a, i) => renderAttemptRow(a, i))
              )}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowFailed(v => !v)}>
            <Text style={styles.sectionTitle}>الراسبون ({failedAttempts.length})</Text>
            <Icon name={showFailed ? 'expand-less' : 'expand-more'} size={24} color="#111827" />
          </TouchableOpacity>
          {showFailed && (
            <View>
              {failedAttempts.length === 0 ? (
                <Text style={styles.emptyText}>لا يوجد راسبون</Text>
              ) : (
                failedAttempts.map((a, i) => renderAttemptRow(a, i))
              )}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowNotTaken(v => !v)}>
            <Text style={styles.sectionTitle}>
              لم يؤدوا الاختبار ({report.traineesWhoDidNotTakeQuiz.length})
            </Text>
            <Icon name={showNotTaken ? 'expand-less' : 'expand-more'} size={24} color="#111827" />
          </TouchableOpacity>
          {showNotTaken && (
            <View>
              {report.traineesWhoDidNotTakeQuiz.length === 0 ? (
                <Text style={styles.emptyText}>كل المتدربين أدوا الاختبار</Text>
              ) : (
                report.traineesWhoDidNotTakeQuiz.map((t, idx) => (
                  <View key={String(t.id)} style={styles.notTakenRow}>
                    <Text style={styles.notTakenName}>{idx + 1}. {t.nameAr}</Text>
                    <Text style={styles.notTakenMeta}>{t.nationalId || '-'}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizReportScreen;

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '700', color: '#1a237e' },
  statLabel: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: { color: '#1e3a8a', fontWeight: '700', fontSize: 12 },
  attemptInfo: { flex: 1 },
  name: { color: '#111827', fontWeight: '700' },
  meta: { marginTop: 2, color: '#6b7280', fontSize: 12 },
  scoreBox: { alignItems: 'flex-end', marginRight: 8 },
  scoreText: { color: '#111827', fontWeight: '700' },
  scoreSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  notTakenRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  notTakenName: { color: '#111827', fontWeight: '600' },
  notTakenMeta: { marginTop: 2, color: '#6b7280', fontSize: 12 },
  emptyText: { color: '#6b7280', textAlign: 'center', padding: 12 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
  reloadBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reloadText: { color: '#fff', fontWeight: '700' },
});

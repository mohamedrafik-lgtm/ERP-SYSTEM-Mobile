import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { QuizResponse, QuizListResponse } from '../types/quiz';

interface QuizManagementScreenProps {
  navigation: any;
}

const QuizManagementScreen: React.FC<QuizManagementScreenProps> = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    activeQuizzes: 0,
    publishedQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0,
  });

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data: QuizListResponse = await AuthService.getAllQuizzes({ limit: 50 });
      setQuizzes(data.quizzes || []);
      
      // جلب الإحصائيات
      const statsData = await AuthService.getQuizStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل الاختبارات',
        text2: 'تعذر الاتصال بالخادم',
        position: 'bottom'
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

  const handleDeleteQuiz = (quizId: number, quizTitle: string) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف الاختبار "${quizTitle}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteQuiz(quizId);
              Toast.show({
                type: 'success',
                text1: 'تم حذف الاختبار بنجاح',
                position: 'bottom'
              });
              loadQuizzes();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'فشل في حذف الاختبار',
                text2: 'حاول مرة أخرى',
                position: 'bottom'
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (quiz: QuizResponse) => {
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (!quiz.isActive) return '#6b7280';
    if (!quiz.isPublished) return '#f59e0b';
    if (now < startDate) return '#3b82f6';
    if (now > endDate) return '#ef4444';
    return '#10b981';
  };

  const getStatusText = (quiz: QuizResponse) => {
    const now = new Date();
    const startDate = new Date(quiz.startDate);
    const endDate = new Date(quiz.endDate);

    if (!quiz.isActive) return 'غير نشط';
    if (!quiz.isPublished) return 'غير منشور';
    if (now < startDate) return 'لم يبدأ';
    if (now > endDate) return 'انتهى';
    return 'نشط';
  };

  const renderQuizCard = ({ item }: { item: QuizResponse }) => (
    <View style={styles.quizCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.quizTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
            <Text style={styles.statusText}>{getStatusText(item)}</Text>
          </View>
        </View>
        <Text style={styles.trainingContent}>{item.trainingContent.nameAr}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item.duration} دقيقة</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="quiz" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item._count.questions} سؤال</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="people" size={16} color="#6b7280" />
            <Text style={styles.infoText}>{item._count.attempts} محاولة</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>يبدأ:</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>ينتهي:</Text>
            <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.viewBtn}
          onPress={() => navigation.navigate('QuizDetails', { quizId: item.id })}
        >
          <Icon name="visibility" size={16} color="#1a237e" />
          <Text style={styles.viewText}>عرض</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditQuiz', { quizId: item.id })}
        >
          <Icon name="edit" size={16} color="#059669" />
          <Text style={styles.editText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDeleteQuiz(item.id, item.title)}
        >
          <Icon name="delete" size={16} color="#ef4444" />
          <Text style={styles.deleteText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>الاختبار المصغر</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الاختبارات...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>الاختبار المصغر</Text>
          <Text style={styles.subtitle}>
            {quizzes.length} اختبار • {stats.activeQuizzes} نشط
          </Text>
        </View>
      </View>

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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalQuizzes}</Text>
              <Text style={styles.statLabel}>إجمالي الاختبارات</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeQuizzes}</Text>
              <Text style={styles.statLabel}>اختبارات نشطة</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalAttempts}</Text>
              <Text style={styles.statLabel}>إجمالي المحاولات</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.averageScore)}%</Text>
              <Text style={styles.statLabel}>متوسط الدرجات</Text>
            </View>
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('AddQuiz')}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.primaryText}>اختبار مصغر جديد</Text>
          </TouchableOpacity>
          <View style={styles.rightTools}>
            <TouchableOpacity 
              style={styles.ghostBtn} 
              onPress={handleRefresh}
            >
              <Text style={styles.ghostText}>تحديث ↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="quiz" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد اختبارات مصغرة</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم إنشاء أي اختبارات مصغرة بعد
            </Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddQuiz')}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>إنشاء اختبار مصغر جديد</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.quizzesContainer}>
            <Text style={styles.sectionTitle}>جميع الاختبارات المصغرة</Text>
            <FlatList
              data={quizzes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderQuizCard}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
      <Toast />
    </View>
  );
};

export default QuizManagementScreen;

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
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  content: { flex: 1, padding: 20 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  
  // Stats
  statsContainer: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rightTools: { flexDirection: 'row', gap: 12 },
  ghostBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  ghostText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Quizzes List
  quizzesContainer: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  trainingContent: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderColor: '#1a237e',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewText: {
    color: '#1a237e',
    fontWeight: '600',
    fontSize: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
});

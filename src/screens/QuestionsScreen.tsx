import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { IQuestion, QuestionType, QuestionSkill, QuestionDifficulty } from '../types/student';

interface QuestionsScreenProps {
  route: {
    params?: {
      content?: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
  navigation: any;
}

const QuestionsScreen = ({ route, navigation }: QuestionsScreenProps) => {
  // معالجة آمنة للـ params
  const content = route?.params?.content;
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // التحقق من وجود المحتوى
  if (!content) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>خطأ</Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#ff3b30" />
          <Text style={styles.errorTitle}>خطأ في البيانات</Text>
          <Text style={styles.errorMessage}>
            لم يتم العثور على معلومات المحتوى التدريبي
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    fetchQuestions();
  }, []);

  // إعادة تحميل الأسئلة عند العودة للصفحة
  useFocusEffect(
    React.useCallback(() => {
      fetchQuestions();
    }, [])
  );

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('=== FETCHING QUESTIONS DEBUG ===');
      console.log('Content ID:', content.id);
      console.log('Content:', content);
      
      // محاولة جلب الأسئلة من بنك الأسئلة أولاً
      try {
        console.log('Attempting to load from question bank...');
        const bankData = await AuthService.getAllQuestions({ 
          contentId: content.id,
          limit: 100
        });
        console.log('Question bank response:', bankData);
        console.log('Question bank response type:', typeof bankData);
        console.log('Question bank response is array:', Array.isArray(bankData));
        console.log('Question bank response length:', Array.isArray(bankData) ? bankData.length : 'N/A');
        
        if (Array.isArray(bankData) && bankData.length > 0) {
          console.log('✅ Successfully loaded from question bank:', bankData.length, 'questions');
          setQuestions(bankData);
          return;
        } else {
          console.log('⚠️ Question bank returned empty or invalid data');
        }
      } catch (bankError) {
        console.warn('❌ Failed to load from question bank:', bankError);
        console.warn('Error details:', (bankError as Error).message);
      }
      
      // إذا فشل، جرب الـ API endpoint القديم
      try {
        console.log('Attempting to load from content-specific endpoint...');
        const data = await AuthService.getQuestionsByContent(content.id);
        console.log('Content endpoint response:', data);
        console.log('Content endpoint response type:', typeof data);
        console.log('Content endpoint response is array:', Array.isArray(data));
        
        // معالجة البيانات من الـ API القديم
        let questions: IQuestion[] = [];
        if (Array.isArray(data)) {
          questions = data;
        } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
          questions = (data as any).data;
        } else if (data && typeof data === 'object' && 'questions' in data && Array.isArray((data as any).questions)) {
          questions = (data as any).questions;
        }
        
        console.log('Processed questions:', questions);
        console.log('Processed questions length:', questions.length);
        
        if (questions.length > 0) {
          console.log('✅ Successfully loaded from content endpoint:', questions.length, 'questions');
          setQuestions(questions);
        } else {
          console.log('⚠️ Content endpoint returned no questions');
          setQuestions([]);
        }
      } catch (contentError) {
        console.error('❌ Failed to load questions from content endpoint:', contentError);
        console.error('Error details:', (contentError as Error).message);
        throw contentError;
      }
      
    } catch (error) {
      console.error('❌ Final error fetching questions:', error);
      Alert.alert('خطأ', 'فشل في تحميل الأسئلة');
      setQuestions([]);
    } finally {
      console.log('=== END FETCHING QUESTIONS DEBUG ===');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'اختيار من متعدد';
      case 'TRUE_FALSE':
        return 'صح أو خطأ';
      default:
        return type;
    }
  };

  const getSkillLabel = (skill: QuestionSkill): string => {
    switch (skill) {
      case 'RECALL':
        return 'استدعاء';
      case 'COMPREHENSION':
        return 'فهم';
      case 'DEDUCTION':
        return 'استنتاج';
      default:
        return skill;
    }
  };

  const getDifficultyLabel = (difficulty: QuestionDifficulty): string => {
    switch (difficulty) {
      case 'EASY':
        return 'سهل';
      case 'MEDIUM':
        return 'متوسط';
      case 'HARD':
        return 'صعب';
      case 'VERY_HARD':
        return 'صعب جداً';
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: QuestionDifficulty): string => {
    switch (difficulty) {
      case 'EASY':
        return '#4CAF50';
      case 'MEDIUM':
        return '#FF9800';
      case 'HARD':
        return '#F44336';
      case 'VERY_HARD':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const renderQuestion = ({ item }: { item: IQuestion }) => {
    console.log('Rendering question:', item);
    
    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionInfo}>
            <Text style={styles.questionText}>
              {item.text || 'نص السؤال غير متوفر'}
            </Text>
            <View style={styles.questionMeta}>
              <Text style={styles.chapterText}>الفصل: {item.chapter || 'غير محدد'}</Text>
              <Text style={styles.createdText}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : 'تاريخ غير محدد'}
              </Text>
            </View>
          </View>
          <View style={styles.questionBadges}>
            <View style={[styles.badge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
              <Text style={[styles.badgeText, { color: getDifficultyColor(item.difficulty) }]}>
                {getDifficultyLabel(item.difficulty)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.badgeText, { color: '#1a237e' }]}>
                {getQuestionTypeLabel(item.type)}
              </Text>
            </View>
            {item.skill && (
              <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                <Text style={[styles.badgeText, { color: '#059669' }]}>
                  {getSkillLabel(item.skill)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.questionDetails}>
          <View style={styles.detailRow}>
            <Icon name="quiz" size={16} color="#666" />
            <Text style={styles.detailText}>{getQuestionTypeLabel(item.type)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="psychology" size={16} color="#666" />
            <Text style={styles.detailText}>{getSkillLabel(item.skill)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="trending-up" size={16} color="#666" />
            <Text style={styles.detailText}>{getDifficultyLabel(item.difficulty)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>أسئلة المحتوى التدريبي</Text>
            <Text style={styles.headerSubtitle}>{content.name} ({content.code})</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddQuestion', { content })}
          >
            <Icon name="add" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الأسئلة...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>أسئلة المحتوى التدريبي</Text>
          <Text style={styles.headerSubtitle}>{content.name} ({content.code})</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddQuestion', { content })}
        >
          <Icon name="add" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{questions.length}</Text>
          <Text style={styles.statLabel}>إجمالي الأسئلة</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {questions.filter(q => q.type === 'MULTIPLE_CHOICE').length}
          </Text>
          <Text style={styles.statLabel}>اختيار متعدد</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {questions.filter(q => q.type === 'TRUE_FALSE').length}
          </Text>
          <Text style={styles.statLabel}>صح أو خطأ</Text>
        </View>
      </View>

      {questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="quiz" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>لا توجد أسئلة</Text>
          <Text style={styles.emptySubtitle}>
            لم يتم إضافة أي أسئلة لهذا المحتوى التدريبي بعد
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={20} color="#1a237e" />
            <Text style={styles.refreshButtonText}>إعادة تحميل</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuestion}
          contentContainerStyle={styles.questionsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1a237e']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  questionsList: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  questionInfo: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    lineHeight: 24,
  },
  questionMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chapterText: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  createdText: {
    fontSize: 12,
    color: '#666',
  },
  questionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default QuestionsScreen;
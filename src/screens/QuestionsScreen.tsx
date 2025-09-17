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
    params: {
      content: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
  navigation: any;
}

const QuestionsScreen = ({ route, navigation }: QuestionsScreenProps) => {
  const { content } = route.params;
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const data = await AuthService.getQuestionsByContent(content.id);
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('خطأ', 'فشل في تحميل الأسئلة');
    } finally {
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

  const renderQuestion = ({ item }: { item: IQuestion }) => (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionText}>{item.text}</Text>
          <View style={styles.questionMeta}>
            <Text style={styles.chapterText}>الفصل: {item.chapter}</Text>
            <Text style={styles.createdText}>
              {new Date(item.createdAt).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        </View>
        <View style={styles.questionBadges}>
          <View style={[styles.badge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
            <Text style={[styles.badgeText, { color: getDifficultyColor(item.difficulty) }]}>
              {getDifficultyLabel(item.difficulty)}
            </Text>
          </View>
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
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.detailText}>{item.createdBy.name}</Text>
        </View>
      </View>

      {item.options && item.options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>الخيارات:</Text>
          {item.options.map((option, index) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>
                  {String.fromCharCode(65 + index)}. {option.text}
                </Text>
                {option.isCorrect && (
                  <Icon name="check-circle" size={20} color="#4CAF50" />
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل الأسئلة...</Text>
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
        <View style={styles.statCard}>
          <Icon name="quiz" size={24} color="#1a237e" />
          <Text style={styles.statNumber}>{questions.length}</Text>
          <Text style={styles.statLabel}>إجمالي الأسئلة</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="multiple-choice" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>
            {questions.filter(q => q.type === 'MULTIPLE_CHOICE').length}
          </Text>
          <Text style={styles.statLabel}>اختيار من متعدد</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-box" size={24} color="#FF9800" />
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
          <Text style={styles.emptySubtitle}>لم يتم إضافة أي أسئلة لهذا المحتوى التدريبي بعد</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  questionsList: {
    padding: 16,
    paddingTop: 8,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterText: {
    fontSize: 12,
    color: '#666',
  },
  createdText: {
    fontSize: 12,
    color: '#666',
  },
  questionBadges: {
    alignItems: 'flex-end',
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
    marginBottom: 12,
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
  optionsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  optionItem: {
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
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
});

export default QuestionsScreen;

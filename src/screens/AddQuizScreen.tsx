import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { CreateQuizRequest, QuizQuestionDto } from '../types/quiz';

interface AddQuizScreenProps {
  navigation: any;
}

const AddQuizScreen: React.FC<AddQuizScreenProps> = ({ navigation }) => {
  const [trainingContents, setTrainingContents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [selectedContentId, setSelectedContentId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Selected questions
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestionDto[]>([]);

  useEffect(() => {
    loadTrainingContents();
  }, []);

  const loadTrainingContents = async () => {
    try {
      setIsLoadingContents(true);
      const data = await AuthService.getAllTrainingContents();
      setTrainingContents(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل المحتويات التدريبية',
        position: 'bottom'
      });
    } finally {
      setIsLoadingContents(false);
    }
  };

  const loadQuestions = async (contentId: number) => {
    try {
      setIsLoadingQuestions(true);
      const data = await AuthService.getAllQuestions({ trainingContentId: contentId });
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الأسئلة',
        position: 'bottom'
      });
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleContentChange = (contentId: number) => {
    setSelectedContentId(contentId);
    setSelectedQuestions([]);
    loadQuestions(contentId);
  };

  const handleQuestionToggle = (questionId: number) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.questionId === questionId);
      if (exists) {
        return prev.filter(q => q.questionId !== questionId);
      } else {
        return [...prev, { questionId, order: prev.length + 1, points: 1 }];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!selectedContentId) {
        Toast.show({ type: 'error', text1: 'اختر المحتوى التدريبي', position: 'bottom' });
        return;
      }
      if (!title.trim()) {
        Toast.show({ type: 'error', text1: 'أدخل عنوان الاختبار', position: 'bottom' });
        return;
      }
      if (!startDate) {
        Toast.show({ type: 'error', text1: 'اختر تاريخ بداية الاختبار', position: 'bottom' });
        return;
      }
      if (!endDate) {
        Toast.show({ type: 'error', text1: 'اختر تاريخ نهاية الاختبار', position: 'bottom' });
        return;
      }
      if (!duration || parseInt(duration) < 1) {
        Toast.show({ type: 'error', text1: 'أدخل مدة الاختبار (دقيقة واحدة على الأقل)', position: 'bottom' });
        return;
      }
      if (selectedQuestions.length === 0) {
        Toast.show({ type: 'error', text1: 'اختر أسئلة للاختبار', position: 'bottom' });
        return;
      }

      const quizData: CreateQuizRequest = {
        trainingContentId: selectedContentId,
        title: title.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        duration: parseInt(duration),
        questions: selectedQuestions,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        passingScore: passingScore ? parseInt(passingScore) : undefined,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : undefined,
        shuffleQuestions,
        shuffleAnswers,
        showResults,
        showCorrectAnswers,
        isActive,
        isPublished,
      };

      setIsSubmitting(true);
      await AuthService.createQuiz(quizData);
      
      Toast.show({
        type: 'success',
        text1: 'تم إنشاء الاختبار بنجاح',
        position: 'bottom'
      });
      
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل في إنشاء الاختبار',
        text2: 'حاول مرة أخرى',
        position: 'bottom'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const getDefaultStartDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // بعد 30 دقيقة
    return formatDateForInput(now);
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 7); // بعد أسبوع
    return formatDateForInput(now);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AddQuiz" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>إنشاء اختبار مصغر جديد</Text>
          <Text style={styles.subtitle}>قم بإنشاء اختبار مصغر جديد</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>المحتوى التدريبي *</Text>
            <SelectBox
              data={trainingContents.map(content => ({
                id: content.id,
                name: content.nameAr,
              }))}
              selectedId={selectedContentId}
              onSelect={handleContentChange}
              placeholder="اختر المحتوى التدريبي"
              loading={isLoadingContents}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>عنوان الاختبار *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="أدخل عنوان الاختبار"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>وصف الاختبار</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="أدخل وصف الاختبار (اختياري)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>تعليمات الاختبار</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="أدخل تعليمات الاختبار (اختياري)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التوقيت والمدة</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>تاريخ ووقت البداية *</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setStartDate(getDefaultStartDate())}
            >
              <Text style={styles.dateBtnText}>الآن + 30 دقيقة</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>تاريخ ووقت النهاية *</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setEndDate(getDefaultEndDate())}
            >
              <Text style={styles.dateBtnText}>بعد أسبوع</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>مدة الاختبار (بالدقائق) *</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="مثال: 60"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Scoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التقييم</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>درجة النجاح (%)</Text>
            <TextInput
              style={styles.input}
              value={passingScore}
              onChangeText={setPassingScore}
              placeholder="مثال: 70"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>عدد المحاولات المسموحة</Text>
            <TextInput
              style={styles.input}
              value={maxAttempts}
              onChangeText={setMaxAttempts}
              placeholder="مثال: 3"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأسئلة</Text>
          
          {selectedContentId ? (
            isLoadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل الأسئلة...</Text>
              </View>
            ) : questions.length > 0 ? (
              <View style={styles.questionsContainer}>
                {questions.map((question) => (
                  <TouchableOpacity
                    key={question.id}
                    style={[
                      styles.questionItem,
                      selectedQuestions.some(q => q.questionId === question.id) && styles.selectedQuestion
                    ]}
                    onPress={() => handleQuestionToggle(question.id)}
                  >
                    <View style={styles.questionContent}>
                      <Text style={styles.questionText} numberOfLines={2}>
                        {question.questionText}
                      </Text>
                      <Text style={styles.questionType}>
                        {question.type === 'MULTIPLE_CHOICE' ? 'اختيار متعدد' : 'صحيح/خطأ'}
                      </Text>
                    </View>
                    <Icon
                      name={selectedQuestions.some(q => q.questionId === question.id) ? 'check-circle' : 'radio-button-unchecked'}
                      size={24}
                      color={selectedQuestions.some(q => q.questionId === question.id) ? '#10b981' : '#d1d5db'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.selectedCount}>
                  تم اختيار {selectedQuestions.length} سؤال
                </Text>
              </View>
            ) : (
              <Text style={styles.noQuestionsText}>
                لا توجد أسئلة متاحة لهذا المحتوى التدريبي
              </Text>
            )
          ) : (
            <Text style={styles.selectContentText}>
              اختر المحتوى التدريبي أولاً لعرض الأسئلة المتاحة
            </Text>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإعدادات</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>خلط ترتيب الأسئلة</Text>
            <Switch
              value={shuffleQuestions}
              onValueChange={setShuffleQuestions}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={shuffleQuestions ? '#fff' : '#f4f4f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>خلط ترتيب الإجابات</Text>
            <Switch
              value={shuffleAnswers}
              onValueChange={setShuffleAnswers}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={shuffleAnswers ? '#fff' : '#f4f4f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>عرض النتائج للمتدرب</Text>
            <Switch
              value={showResults}
              onValueChange={setShowResults}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={showResults ? '#fff' : '#f4f4f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>عرض الإجابات الصحيحة</Text>
            <Switch
              value={showCorrectAnswers}
              onValueChange={setShowCorrectAnswers}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={showCorrectAnswers ? '#fff' : '#f4f4f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>الاختبار نشط</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={isActive ? '#fff' : '#f4f4f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>نشر الاختبار</Text>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: '#d1d5db', true: '#1a237e' }}
              thumbColor={isPublished ? '#fff' : '#f4f4f4'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.submitText}>إنشاء الاختبار المصغر</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};

export default AddQuizScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, padding: 20 },
  
  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 16,
  },
  
  // Input Groups
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateBtn: {
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  dateBtnText: {
    color: '#1a237e',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Questions
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: { color: '#6b7280', fontSize: 14 },
  questionsContainer: { marginTop: 8 },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedQuestion: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  questionContent: { flex: 1, marginRight: 12 },
  questionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  questionType: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  noQuestionsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectContentText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  
  // Submit
  submitContainer: { marginBottom: 20 },
  submitBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

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
  const [programs, setPrograms] = useState<any[]>([]);
  const [trainingContents, setTrainingContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isLoadingContents, setIsLoadingContents] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
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
    loadPrograms();
    loadTrainingContents();
  }, []);

  const loadPrograms = async () => {
    try {
      setIsLoadingPrograms(true);
      const data = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل البرامج التدريبية',
        position: 'bottom'
      });
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const loadTrainingContents = async () => {
    try {
      setIsLoadingContents(true);
      // تحميل جميع المحتويات التدريبية مع معلومات البرنامج
      const data = await AuthService.getTrainingContents({
        includeQuestionCount: true
      });
      console.log('Loaded training contents response:', data);
      
      // معالجة البيانات إذا كانت في بنية pagination
      let contents = [];
      if (Array.isArray(data)) {
        contents = data;
      } else if (data && Array.isArray(data.data)) {
        contents = data.data;
      } else if (data && Array.isArray(data.contents)) {
        contents = data.contents;
      } else if (data && Array.isArray(data.items)) {
        contents = data.items;
      } else {
        console.warn('Unexpected data structure:', data);
        contents = [];
      }
      
      console.log('Processed training contents:', contents);
      console.log('Training contents count:', contents.length);
      setTrainingContents(contents);
    } catch (error) {
      console.error('Error loading training contents:', error);
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
      console.log('=== LOADING QUESTIONS DEBUG ===');
      console.log('Content ID:', contentId);
      console.log('Content ID type:', typeof contentId);
      
      // محاولة جلب الأسئلة من بنك الأسئلة أولاً
      try {
        console.log('Attempting to load from question bank...');
        const data = await AuthService.getAllQuestions({ 
          contentId: contentId,
          limit: 100
        });
        console.log('Question bank response:', data);
        console.log('Question bank response type:', typeof data);
        console.log('Question bank response is array:', Array.isArray(data));
        console.log('Question bank response length:', Array.isArray(data) ? data.length : 'N/A');
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('✅ Successfully loaded from question bank:', data.length, 'questions');
          setQuestions(data);
          return;
        } else {
          console.log('⚠️ Question bank returned empty or invalid data');
        }
      } catch (bankError) {
        console.warn('❌ Failed to load from question bank:', bankError);
        console.warn('Error details:', bankError.message);
      }
      
      // إذا فشل، جرب الـ API endpoint القديم
      try {
        console.log('Attempting to load from content-specific endpoint...');
        const data = await AuthService.getQuestionsByContent(contentId);
        console.log('Content endpoint response:', data);
        console.log('Content endpoint response type:', typeof data);
        console.log('Content endpoint response is array:', Array.isArray(data));
        
        // معالجة البيانات من الـ API القديم
        let questions = [];
        if (Array.isArray(data)) {
          questions = data;
        } else if (data && Array.isArray(data.data)) {
          questions = data.data;
        } else if (data && Array.isArray(data.questions)) {
          questions = data.questions;
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
        console.error('Error details:', contentError.message);
        throw contentError;
      }
      
    } catch (error) {
      console.error('❌ Final error loading questions:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الأسئلة',
        text2: error.message || 'حدث خطأ غير متوقع',
        position: 'bottom'
      });
      setQuestions([]);
    } finally {
      console.log('=== END LOADING QUESTIONS DEBUG ===');
      setIsLoadingQuestions(false);
    }
  };

  const handleProgramChange = (programId: number) => {
    console.log('Selected program ID:', programId);
    console.log('All training contents:', trainingContents);
    
    setSelectedProgramId(programId);
    setSelectedContentId(undefined);
    setSelectedQuestions([]);
    
    // فلترة المحتوى التدريبي حسب البرنامج المختار
    const filtered = trainingContents.filter(content => {
      console.log('Checking content:', content);
      
      // تحقق من جميع الطرق المحتملة لربط المحتوى بالبرنامج
      // 1. programId مباشر
      if (content.programId && content.programId === programId) {
        console.log('Found match by programId:', content.programId);
        return true;
      }
      
      // 2. programIds مصفوفة
      if (content.programIds && Array.isArray(content.programIds) && content.programIds.includes(programId)) {
        console.log('Found match by programIds:', content.programIds);
        return true;
      }
      
      // 3. program object
      if (content.program && content.program.id === programId) {
        console.log('Found match by program.id:', content.program.id);
        return true;
      }
      
      // 4. trainingProgramId (إذا كان موجود)
      if (content.trainingProgramId && content.trainingProgramId === programId) {
        console.log('Found match by trainingProgramId:', content.trainingProgramId);
        return true;
      }
      
      // 5. trainingProgram object (إذا كان موجود)
      if (content.trainingProgram && content.trainingProgram.id === programId) {
        console.log('Found match by trainingProgram.id:', content.trainingProgram.id);
        return true;
      }
      
      console.log('No match found for content:', content.id, 'name:', content.name);
      return false;
    });
    
    console.log('Filtered contents:', filtered);
    console.log('Filtered contents count:', filtered.length);
    setFilteredContents(filtered);
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
            <Text style={styles.label}>البرنامج التدريبي *</Text>
            <SelectBox
              label=""
              items={programs.map(program => ({
                value: program.id,
                label: program.nameAr,
              }))}
              selectedValue={selectedProgramId}
              onValueChange={handleProgramChange}
              placeholder="اختر البرنامج التدريبي"
              loading={isLoadingPrograms}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>المحتوى التدريبي *</Text>
            {selectedProgramId ? (
              filteredContents.length > 0 ? (
                <SelectBox
                  label=""
                  items={filteredContents.map(content => ({
                    value: content.id,
                    label: content.name || content.nameAr || `${content.code} - ${content.name}`,
                  }))}
                  selectedValue={selectedContentId}
                  onValueChange={handleContentChange}
                  placeholder="اختر المحتوى التدريبي"
                  loading={isLoadingContents}
                />
              ) : (
                <View style={styles.noContentContainer}>
                  <Icon name="info" size={24} color="#6b7280" />
                  <Text style={styles.noContentText}>
                    لا يوجد محتوى تدريبي مرتبط بهذا البرنامج
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.disabledSelectBox}>
                <Text style={styles.disabledText}>اختر البرنامج التدريبي أولاً</Text>
              </View>
            )}
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
                {console.log('Rendering questions:', questions)}
                {console.log('Questions count:', questions.length)}
                {questions.map((question, index) => {
                  console.log(`Question ${index}:`, question);
                  return (
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
                          {question.text || question.questionText}
                        </Text>
                        <View style={styles.questionMeta}>
                          <Text style={styles.questionType}>
                            {question.type === 'MULTIPLE_CHOICE' ? 'اختيار متعدد' : 
                             question.type === 'TRUE_FALSE' ? 'صحيح/خطأ' : 
                             question.type || 'غير محدد'}
                          </Text>
                          {question.skill && (
                            <Text style={styles.questionSkill}>
                              {question.skill === 'KNOWLEDGE' ? 'معرفة' :
                               question.skill === 'COMPREHENSION' ? 'فهم' :
                               question.skill === 'APPLICATION' ? 'تطبيق' :
                               question.skill === 'ANALYSIS' ? 'تحليل' :
                               question.skill === 'SYNTHESIS' ? 'تركيب' :
                               question.skill === 'EVALUATION' ? 'تقييم' :
                               question.skill}
                            </Text>
                          )}
                          {question.difficulty && (
                            <Text style={styles.questionDifficulty}>
                              {question.difficulty === 'EASY' ? 'سهل' :
                               question.difficulty === 'MEDIUM' ? 'متوسط' :
                               question.difficulty === 'HARD' ? 'صعب' :
                               question.difficulty}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Icon
                        name={selectedQuestions.some(q => q.questionId === question.id) ? 'check-circle' : 'radio-button-unchecked'}
                        size={24}
                        color={selectedQuestions.some(q => q.questionId === question.id) ? '#10b981' : '#d1d5db'}
                      />
                    </TouchableOpacity>
                  );
                })}
                <Text style={styles.selectedCount}>
                  تم اختيار {selectedQuestions.length} سؤال من {questions.length} سؤال متاح
                </Text>
              </View>
            ) : (
              <View>
                {console.log('No questions available. Questions array:', questions)}
                {console.log('Questions length:', questions.length)}
                {console.log('Is loading:', isLoadingQuestions)}
                <Text style={styles.noQuestionsText}>
                  لا توجد أسئلة متاحة لهذا المحتوى التدريبي
                </Text>
              </View>
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
  questionContent: { 
    flex: 1, 
    marginRight: 12 
  },
  questionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionType: {
    fontSize: 12,
    color: '#1a237e',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  questionSkill: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  questionDifficulty: {
    fontSize: 12,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
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
  
  // Disabled SelectBox
  disabledSelectBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  disabledText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // No Content Container
  noContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  noContentText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
});

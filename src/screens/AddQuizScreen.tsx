import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import DateTimePickerField from '../components/DateTimePickerField';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { CreateQuizRequest, QuizQuestionDto } from '../types/quiz';

interface AddQuizScreenProps {
  navigation: any;
}

interface QuestionItem {
  id: number;
  text: string;
  type?: string;
  skill?: string;
  difficulty?: string;
  chapter?: number;
}

interface SelectedQuestionItem extends QuizQuestionDto {
  order: number;
  points: number;
  question: QuestionItem;
}

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.questions)) return data.questions;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
};

const normalizeQuestion = (raw: any): QuestionItem | null => {
  const id = Number(raw?.id ?? raw?.questionId ?? raw?.question?.id);
  if (!id) return null;

  const textRaw = raw?.text ?? raw?.questionText ?? raw?.content ?? raw?.question?.text ?? raw?.question?.content;
  const text = typeof textRaw === 'string' && textRaw.trim().length > 0
    ? textRaw.trim()
    : `سؤال رقم ${id}`;

  const chapterValue = Number(raw?.chapter ?? raw?.question?.chapter);

  return {
    id,
    text,
    type: raw?.type ?? raw?.question?.type,
    skill: raw?.skill ?? raw?.question?.skill,
    difficulty: raw?.difficulty ?? raw?.question?.difficulty,
    chapter: Number.isFinite(chapterValue) && chapterValue > 0 ? chapterValue : undefined,
  };
};

const reindexSelectedQuestions = (items: SelectedQuestionItem[]): SelectedQuestionItem[] => {
  return items.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
};

const mapQuestionType = (type?: string) => {
  if (type === 'MULTIPLE_CHOICE') return 'اختيار متعدد';
  if (type === 'TRUE_FALSE') return 'صح/خطأ';
  return type || 'غير محدد';
};

const mapSkill = (skill?: string) => {
  if (skill === 'KNOWLEDGE') return 'معرفة';
  if (skill === 'COMPREHENSION') return 'فهم';
  if (skill === 'APPLICATION') return 'تطبيق';
  if (skill === 'ANALYSIS') return 'تحليل';
  if (skill === 'SYNTHESIS') return 'تركيب';
  if (skill === 'EVALUATION') return 'تقييم';
  return skill;
};

const mapDifficulty = (difficulty?: string) => {
  if (difficulty === 'EASY') return 'سهل';
  if (difficulty === 'MEDIUM') return 'متوسط';
  if (difficulty === 'HARD') return 'صعب';
  return difficulty;
};

const AddQuizScreen: React.FC<AddQuizScreenProps> = ({ navigation }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [trainingContents, setTrainingContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isLoadingContents, setIsLoadingContents] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

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
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleAnswers, setShuffleAnswers] = useState(true);
  const [showResults, setShowResults] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Question selection state
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestionItem[]>([]);
  const [selectedQuestionPickerId, setSelectedQuestionPickerId] = useState<number | undefined>(undefined);
  const [autoSelectCount, setAutoSelectCount] = useState('10');
  const [questionSearch, setQuestionSearch] = useState('');

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
        position: 'bottom',
      });
    } finally {
      setIsLoadingPrograms(false);
    }
  };

  const loadTrainingContents = async () => {
    try {
      setIsLoadingContents(true);
      const data = await AuthService.getTrainingContents({ includeQuestionCount: true });
      setTrainingContents(extractArray(data));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل المحتويات التدريبية',
        position: 'bottom',
      });
    } finally {
      setIsLoadingContents(false);
    }
  };

  const loadQuestions = async (contentId: number) => {
    try {
      setIsLoadingQuestions(true);

      let normalized: QuestionItem[] = [];

      try {
        const questionBankData = await AuthService.getAllQuestions({
          contentId,
          limit: 200,
        });
        normalized = extractArray(questionBankData)
          .map(normalizeQuestion)
          .filter((q): q is QuestionItem => q !== null);
      } catch (error) {
        const contentData = await AuthService.getQuestionsByContent(contentId);
        normalized = extractArray(contentData)
          .map(normalizeQuestion)
          .filter((q): q is QuestionItem => q !== null);
      }

      const unique = normalized.filter((question, index, arr) => {
        return arr.findIndex(item => item.id === question.id) === index;
      });

      setQuestions(unique);
    } catch (error: any) {
      setQuestions([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الأسئلة',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleProgramChange = (programId: number) => {
    setSelectedProgramId(programId);
    setSelectedContentId(undefined);
    setQuestions([]);
    setSelectedQuestions([]);
    setSelectedQuestionPickerId(undefined);

    const filtered = trainingContents.filter(content => {
      if (content.programId === programId) return true;
      if (Array.isArray(content.programIds) && content.programIds.includes(programId)) return true;
      if (content.program?.id === programId) return true;
      if (content.trainingProgramId === programId) return true;
      if (content.trainingProgram?.id === programId) return true;
      return false;
    });

    setFilteredContents(filtered);
  };

  const handleContentChange = (contentId: number) => {
    setSelectedContentId(contentId);
    setQuestions([]);
    setSelectedQuestions([]);
    setSelectedQuestionPickerId(undefined);
    setQuestionSearch('');
    loadQuestions(contentId);
  };

  const addQuestion = (question: QuestionItem) => {
    setSelectedQuestions(prev => {
      const exists = prev.some(item => item.questionId === question.id);
      if (exists) {
        Toast.show({
          type: 'error',
          text1: 'هذا السؤال مضاف مسبقاً',
          position: 'bottom',
        });
        return prev;
      }

      return [
        ...prev,
        {
          questionId: question.id,
          order: prev.length + 1,
          points: 1,
          question,
        },
      ];
    });
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions(prev => reindexSelectedQuestions(prev.filter(item => item.questionId !== questionId)));
  };

  const updateQuestionPoints = (questionId: number, value: string) => {
    const points = Number(value);
    const safePoints = Number.isFinite(points) && points >= 0.5 ? points : 0.5;

    setSelectedQuestions(prev =>
      prev.map(item => (item.questionId === questionId ? { ...item, points: safePoints } : item))
    );
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setSelectedQuestions(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return reindexSelectedQuestions(next);
    });
  };

  const handleQuestionPickerChange = (questionId: number) => {
    setSelectedQuestionPickerId(questionId);
    const question = unselectedQuestions.find(item => item.id === questionId);
    if (question) {
      addQuestion(question);
      setSelectedQuestionPickerId(undefined);
    }
  };

  const handleAutoSelectQuestions = () => {
    if (!selectedContentId) {
      Toast.show({
        type: 'error',
        text1: 'اختر المحتوى التدريبي أولاً',
        position: 'bottom',
      });
      return;
    }

    const count = Number(autoSelectCount);
    if (!Number.isFinite(count) || count <= 0) {
      Toast.show({
        type: 'error',
        text1: 'أدخل عدد صحيح للأسئلة',
        position: 'bottom',
      });
      return;
    }

    if (unselectedQuestions.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'لا توجد أسئلة إضافية متاحة',
        position: 'bottom',
      });
      return;
    }

    if (count > unselectedQuestions.length) {
      Toast.show({
        type: 'error',
        text1: `المتاح حالياً ${unselectedQuestions.length} سؤال فقط`,
        position: 'bottom',
      });
      return;
    }

    setIsAutoSelecting(true);

    const shuffled = [...unselectedQuestions].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, count).map((question, index) => ({
      questionId: question.id,
      order: selectedQuestions.length + index + 1,
      points: 1,
      question,
    }));

    setSelectedQuestions(prev => [...prev, ...toAdd]);
    setIsAutoSelecting(false);

    Toast.show({
      type: 'success',
      text1: `تمت إضافة ${count} سؤال تلقائياً`,
      position: 'bottom',
    });
  };

  const handleSubmit = async () => {
    try {
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
      if (new Date(startDate) >= new Date(endDate)) {
        Toast.show({ type: 'error', text1: 'تاريخ البداية يجب أن يكون قبل النهاية', position: 'bottom' });
        return;
      }
      if (!duration || parseInt(duration, 10) < 1) {
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
        duration: parseInt(duration, 10),
        questions: selectedQuestions.map(item => ({
          questionId: item.questionId,
          order: item.order,
          points: item.points,
        })),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        passingScore: passingScore ? parseInt(passingScore, 10) : undefined,
        maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : undefined,
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
        position: 'bottom',
      });

      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل في إنشاء الاختبار',
        text2: 'حاول مرة أخرى',
        position: 'bottom',
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
    now.setMinutes(now.getMinutes() + 30);
    return formatDateForInput(now);
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return formatDateForInput(now);
  };

  const unselectedQuestions = useMemo(
    () => questions.filter(question => !selectedQuestions.some(item => item.questionId === question.id)),
    [questions, selectedQuestions]
  );

  const filteredUnselectedQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    if (!query) return unselectedQuestions;
    return unselectedQuestions.filter(question => question.text.toLowerCase().includes(query));
  }, [unselectedQuestions, questionSearch]);

  const totalPoints = selectedQuestions.reduce((sum, item) => sum + (item.points || 0), 0);

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
                    label: content.name || content.nameAr || `${content.code || ''} - ${content.name || ''}`,
                  }))}
                  selectedValue={selectedContentId}
                  onValueChange={handleContentChange}
                  placeholder="اختر المحتوى التدريبي"
                  loading={isLoadingContents}
                />
              ) : (
                <View style={styles.noContentContainer}>
                  <Icon name="info" size={24} color="#6b7280" />
                  <Text style={styles.noContentText}>لا يوجد محتوى تدريبي مرتبط بهذا البرنامج</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التوقيت والمدة</Text>

          <View style={styles.inputGroup}>
            <DateTimePickerField
              label="تاريخ ووقت البداية *"
              value={startDate}
              onChange={setStartDate}
              placeholder="اختر تاريخ ووقت البداية"
            />
            <TouchableOpacity style={styles.dateBtn} onPress={() => setStartDate(getDefaultStartDate())}>
              <Text style={styles.dateBtnText}>الآن + 30 دقيقة</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <DateTimePickerField
              label="تاريخ ووقت النهاية *"
              value={endDate}
              onChange={setEndDate}
              placeholder="اختر تاريخ ووقت النهاية"
            />
            <TouchableOpacity style={styles.dateBtn} onPress={() => setEndDate(getDefaultEndDate())}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأسئلة</Text>

          {!selectedContentId ? (
            <Text style={styles.selectContentText}>اختر المحتوى التدريبي أولاً لعرض بنك الأسئلة</Text>
          ) : isLoadingQuestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل الأسئلة...</Text>
            </View>
          ) : (
            <View style={styles.questionsContainer}>
              <View style={styles.questionStatsCard}>
                <Text style={styles.statsText}>المتاح: {unselectedQuestions.length}</Text>
                <Text style={styles.statsText}>المختار: {selectedQuestions.length}</Text>
                <Text style={styles.statsText}>إجمالي الدرجات: {totalPoints}</Text>
              </View>

              <View style={styles.autoSelectContainer}>
                <Text style={styles.autoSelectTitle}>اختيار تلقائي من بنك الأسئلة</Text>
                <View style={styles.autoSelectRow}>
                  <TextInput
                    style={[styles.input, styles.autoSelectInput]}
                    value={autoSelectCount}
                    onChangeText={setAutoSelectCount}
                    placeholder="عدد الأسئلة"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.secondaryButton, isAutoSelecting && styles.secondaryButtonDisabled]}
                    onPress={handleAutoSelectQuestions}
                    disabled={isAutoSelecting}
                  >
                    {isAutoSelecting ? (
                      <ActivityIndicator size="small" color="#1a237e" />
                    ) : (
                      <>
                        <Icon name="auto-fix-high" size={18} color="#1a237e" />
                        <Text style={styles.secondaryButtonText}>اختيار تلقائي</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>بحث في بنك الأسئلة</Text>
                <TextInput
                  style={styles.input}
                  value={questionSearch}
                  onChangeText={setQuestionSearch}
                  placeholder="اكتب جزءاً من نص السؤال"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>إضافة سؤال يدوياً</Text>
                <SelectBox
                  label=""
                  items={filteredUnselectedQuestions.map(question => ({
                    value: question.id,
                    label: question.text.length > 90 ? `${question.text.slice(0, 90)}...` : question.text,
                  }))}
                  selectedValue={selectedQuestionPickerId}
                  onValueChange={handleQuestionPickerChange}
                  placeholder={filteredUnselectedQuestions.length ? 'اختر سؤالاً للإضافة' : 'لا توجد أسئلة مطابقة'}
                  disabled={!filteredUnselectedQuestions.length}
                />
              </View>

              {selectedQuestions.length === 0 ? (
                <Text style={styles.noQuestionsText}>لم يتم إضافة أسئلة بعد</Text>
              ) : (
                selectedQuestions.map((item, index) => (
                  <View key={item.questionId} style={styles.selectedQuestionCard}>
                    <View style={styles.selectedQuestionHeader}>
                      <Text style={styles.selectedQuestionIndex}>#{index + 1}</Text>
                      <View style={styles.selectedQuestionActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <Icon name="arrow-upward" size={18} color={index === 0 ? '#9ca3af' : '#1a237e'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => moveQuestion(index, 'down')}
                          disabled={index === selectedQuestions.length - 1}
                        >
                          <Icon
                            name="arrow-downward"
                            size={18}
                            color={index === selectedQuestions.length - 1 ? '#9ca3af' : '#1a237e'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => removeQuestion(item.questionId)}>
                          <Icon name="delete-outline" size={18} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.selectedQuestionText}>{item.question.text}</Text>

                    <View style={styles.questionMetaRow}>
                      <Text style={styles.questionMetaBadge}>{mapQuestionType(item.question.type)}</Text>
                      {item.question.skill ? <Text style={styles.questionMetaBadge}>{mapSkill(item.question.skill)}</Text> : null}
                      {item.question.difficulty ? (
                        <Text style={styles.questionMetaBadge}>{mapDifficulty(item.question.difficulty)}</Text>
                      ) : null}
                      {item.question.chapter ? (
                        <Text style={styles.questionMetaBadge}>الباب {item.question.chapter}</Text>
                      ) : null}
                    </View>

                    <View style={styles.pointsRow}>
                      <Text style={styles.pointsLabel}>الدرجة</Text>
                      <TextInput
                        style={styles.pointsInput}
                        value={String(item.points)}
                        onChangeText={value => updateQuestionPoints(item.questionId, value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: { color: '#6b7280', fontSize: 14 },
  questionsContainer: { marginTop: 8 },
  questionStatsCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsText: {
    color: '#3730a3',
    fontSize: 13,
    fontWeight: '700',
  },
  autoSelectContainer: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    padding: 12,
    marginBottom: 12,
  },
  autoSelectTitle: {
    color: '#5b21b6',
    fontWeight: '700',
    marginBottom: 10,
  },
  autoSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoSelectInput: {
    flex: 1,
    marginBottom: 0,
  },
  secondaryButton: {
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 13,
  },
  selectedQuestionCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
  },
  selectedQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedQuestionIndex: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 13,
  },
  selectedQuestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
  },
  selectedQuestionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  questionMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  questionMetaBadge: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsLabel: {
    color: '#374151',
    fontWeight: '600',
  },
  pointsInput: {
    width: 88,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: '#111827',
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
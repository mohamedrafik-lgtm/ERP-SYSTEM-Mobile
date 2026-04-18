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
import { QuizQuestionDto, QuizResponse } from '../types/quiz';

interface EditQuizScreenProps {
  navigation: any;
  route: {
    params?: {
      quizId?: number;
    };
  };
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

const EditQuizScreen: React.FC<EditQuizScreenProps> = ({ navigation, route }) => {
  const quizId = route.params?.quizId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

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

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestionItem[]>([]);
  const [selectedQuestionPickerId, setSelectedQuestionPickerId] = useState<number | undefined>(undefined);
  const [questionSearch, setQuestionSearch] = useState('');

  const toInputDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 16);
  };

  const loadQuestionsForContent = async (contentId: number) => {
    try {
      setLoadingQuestions(true);

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

      setAvailableQuestions(unique);

      setSelectedQuestions(prev =>
        prev.map(item => {
          const matched = unique.find(question => question.id === item.questionId);
          return matched ? { ...item, question: matched } : item;
        })
      );
    } catch (error) {
      setAvailableQuestions([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل بنك الأسئلة',
        position: 'bottom',
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadQuiz = async () => {
    if (!quizId) {
      Toast.show({ type: 'error', text1: 'لم يتم تحديد الاختبار', position: 'bottom' });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const data = await AuthService.getQuizById(quizId);
      setQuiz(data);

      setTitle(data.title || '');
      setDescription(data.description || '');
      setInstructions(data.instructions || '');
      setStartDate(toInputDate(data.startDate));
      setEndDate(toInputDate(data.endDate));
      setDuration(String(data.duration || ''));
      setPassingScore(data.passingScore != null ? String(data.passingScore) : '');
      setMaxAttempts(data.maxAttempts != null ? String(data.maxAttempts) : '');
      setShuffleQuestions(!!data.shuffleQuestions);
      setShuffleAnswers(!!data.shuffleAnswers);
      setShowResults(!!data.showResults);
      setShowCorrectAnswers(!!data.showCorrectAnswers);
      setIsActive(!!data.isActive);
      setIsPublished(!!data.isPublished);

      const mappedQuestions = extractArray((data as any).questions)
        .map((item: any, index: number) => {
          const normalized = normalizeQuestion(item?.question || item);
          const questionId = Number(item?.questionId ?? item?.question?.id ?? normalized?.id);
          if (!questionId) return null;

          const fallbackQuestion: QuestionItem =
            normalized || {
              id: questionId,
              text: `سؤال رقم ${questionId}`,
            };

          return {
            questionId,
            order: Number(item?.order ?? index + 1) || index + 1,
            points: Number(item?.points ?? 1) || 1,
            question: fallbackQuestion,
          } as SelectedQuestionItem;
        })
        .filter((item: SelectedQuestionItem | null): item is SelectedQuestionItem => item !== null)
        .sort((a, b) => a.order - b.order);

      setSelectedQuestions(reindexSelectedQuestions(mappedQuestions));

      const contentId = Number((data as any)?.trainingContent?.id ?? (data as any)?.trainingContentId);
      if (contentId) {
        await loadQuestionsForContent(contentId);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل بيانات الاختبار',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

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

  const handleSave = async () => {
    if (!quizId) return;

    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'أدخل عنوان الاختبار', position: 'bottom' });
      return;
    }
    if (!startDate || !endDate) {
      Toast.show({ type: 'error', text1: 'أدخل تاريخ البداية والنهاية', position: 'bottom' });
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      Toast.show({ type: 'error', text1: 'تاريخ البداية يجب أن يكون قبل النهاية', position: 'bottom' });
      return;
    }
    if (!duration || Number(duration) < 1) {
      Toast.show({ type: 'error', text1: 'مدة الاختبار غير صحيحة', position: 'bottom' });
      return;
    }
    if (selectedQuestions.length === 0) {
      Toast.show({ type: 'error', text1: 'يجب إضافة سؤال واحد على الأقل', position: 'bottom' });
      return;
    }

    try {
      setSaving(true);

      await AuthService.updateQuiz(quizId, {
        id: quizId,
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        duration: Number(duration),
        passingScore: passingScore ? Number(passingScore) : undefined,
        maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
        shuffleQuestions,
        shuffleAnswers,
        showResults,
        showCorrectAnswers,
        isActive,
        isPublished,
        questions: selectedQuestions.map(item => ({
          questionId: item.questionId,
          order: item.order,
          points: item.points,
        })),
      });

      Toast.show({
        type: 'success',
        text1: 'تم تحديث الاختبار بنجاح',
        position: 'bottom',
      });

      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'فشل تحديث الاختبار',
        text2: 'حاول مرة أخرى',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  const unselectedQuestions = useMemo(
    () => availableQuestions.filter(question => !selectedQuestions.some(item => item.questionId === question.id)),
    [availableQuestions, selectedQuestions]
  );

  const filteredUnselectedQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    if (!query) return unselectedQuestions;
    return unselectedQuestions.filter(question => question.text.toLowerCase().includes(query));
  }, [unselectedQuestions, questionSearch]);

  const totalPoints = selectedQuestions.reduce((sum, item) => sum + (item.points || 0), 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تعديل الاختبار</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="QuizManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تعديل الاختبار</Text>
          <Text style={styles.subtitle}>{quiz?.title || ''}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

          <Text style={styles.label}>المحتوى التدريبي</Text>
          <View style={styles.readonlyBox}>
            <Text style={styles.readonlyText}>{quiz?.trainingContent?.nameAr || quiz?.trainingContent?.nameEn || '-'}</Text>
          </View>

          <Text style={styles.label}>عنوان الاختبار *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="عنوان الاختبار" />

          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder="وصف الاختبار"
          />

          <Text style={styles.label}>التعليمات</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            placeholder="تعليمات الاختبار"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التوقيت والإعدادات</Text>

          <DateTimePickerField
            label="البداية *"
            value={startDate}
            onChange={setStartDate}
            placeholder="اختر تاريخ ووقت البداية"
          />

          <DateTimePickerField
            label="النهاية *"
            value={endDate}
            onChange={setEndDate}
            placeholder="اختر تاريخ ووقت النهاية"
          />

          <Text style={styles.label}>المدة بالدقائق *</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />

          <Text style={styles.label}>درجة النجاح %</Text>
          <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore} keyboardType="numeric" />

          <Text style={styles.label}>عدد المحاولات</Text>
          <TextInput style={styles.input} value={maxAttempts} onChangeText={setMaxAttempts} keyboardType="numeric" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأسئلة</Text>

          {loadingQuestions ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل بنك الأسئلة...</Text>
            </View>
          ) : (
            <>
              <View style={styles.questionStatsCard}>
                <Text style={styles.statsText}>المتاح: {unselectedQuestions.length}</Text>
                <Text style={styles.statsText}>المختار: {selectedQuestions.length}</Text>
                <Text style={styles.statsText}>إجمالي الدرجات: {totalPoints}</Text>
              </View>

              <Text style={styles.label}>بحث في بنك الأسئلة</Text>
              <TextInput
                style={styles.input}
                value={questionSearch}
                onChangeText={setQuestionSearch}
                placeholder="اكتب جزءاً من نص السؤال"
              />

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

              {selectedQuestions.length === 0 ? (
                <Text style={styles.emptyText}>لم يتم إضافة أسئلة بعد</Text>
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
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>خيارات العرض والنشر</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>خلط الأسئلة</Text>
            <Switch value={shuffleQuestions} onValueChange={setShuffleQuestions} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>خلط الإجابات</Text>
            <Switch value={shuffleAnswers} onValueChange={setShuffleAnswers} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>عرض النتائج</Text>
            <Switch value={showResults} onValueChange={setShowResults} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>عرض الإجابات الصحيحة</Text>
            <Switch value={showCorrectAnswers} onValueChange={setShowCorrectAnswers} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>نشط</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>منشور</Text>
            <Switch value={isPublished} onValueChange={setIsPublished} />
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التعديلات</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default EditQuizScreen;

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
  section: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  label: { color: '#374151', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  readonlyBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  readonlyText: { color: '#4b5563' },
  switchRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { color: '#1f2937', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: { color: '#6b7280' },
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
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
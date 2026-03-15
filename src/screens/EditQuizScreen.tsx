import React, { useEffect, useState } from 'react';
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
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { QuizResponse } from '../types/quiz';

interface EditQuizScreenProps {
  navigation: any;
  route: {
    params?: {
      quizId?: number;
    };
  };
}

const EditQuizScreen: React.FC<EditQuizScreenProps> = ({ navigation, route }) => {
  const quizId = route.params?.quizId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const toInputDate = (value?: string) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 16);
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
    } catch (error) {
      console.error('Error loading quiz for edit:', error);
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
    if (!duration || Number(duration) < 1) {
      Toast.show({ type: 'error', text1: 'مدة الاختبار غير صحيحة', position: 'bottom' });
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
      });

      Toast.show({
        type: 'success',
        text1: 'تم تحديث الاختبار بنجاح',
        position: 'bottom',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error updating quiz:', error);
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
            <Text style={styles.readonlyText}>
              {quiz?.trainingContent?.nameAr || quiz?.trainingContent?.nameEn || '-'}
            </Text>
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

          <Text style={styles.label}>البداية *</Text>
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DDTHH:MM" />

          <Text style={styles.label}>النهاية *</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DDTHH:MM" />

          <Text style={styles.label}>المدة بالدقائق *</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />

          <Text style={styles.label}>درجة النجاح %</Text>
          <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore} keyboardType="numeric" />

          <Text style={styles.label}>عدد المحاولات</Text>
          <TextInput style={styles.input} value={maxAttempts} onChangeText={setMaxAttempts} keyboardType="numeric" />
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

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
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
  loadingText: { color: '#6b7280' },
});

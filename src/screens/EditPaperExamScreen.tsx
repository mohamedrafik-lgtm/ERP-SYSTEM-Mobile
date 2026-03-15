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
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

interface EditPaperExamScreenProps {
  navigation: any;
  route: {
    params?: {
      examId?: number;
    };
  };
}

const gradeTypeOptions = [
  { value: 'YEAR_WORK', label: 'أعمال السنة' },
  { value: 'PRACTICAL', label: 'العملي' },
  { value: 'WRITTEN', label: 'التحريري' },
  { value: 'FINAL_EXAM', label: 'الميد تيرم' },
];

const semesterOptions = [
  { value: 'FIRST', label: 'الفصل الأول' },
  { value: 'SECOND', label: 'الفصل الثاني' },
];

const EditPaperExamScreen: React.FC<EditPaperExamScreenProps> = ({ navigation, route }) => {
  const examId = route.params?.examId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainingContents, setTrainingContents] = useState<any[]>([]);

  const [trainingContentId, setTrainingContentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [examDate, setExamDate] = useState('');
  const [duration, setDuration] = useState('120');
  const [gradeType, setGradeType] = useState('WRITTEN');
  const [totalMarks, setTotalMarks] = useState('20');
  const [passingScore, setPassingScore] = useState('50');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const contentOptions = useMemo(
    () =>
      trainingContents.map((content) => ({
        value: String(content.id),
        label: `${content.code || ''} - ${content.nameAr || content.nameEn || content.name || `مادة #${content.id}`}`,
      })),
    [trainingContents]
  );

  useEffect(() => {
    loadData();
  }, [examId]);

  const loadData = async () => {
    if (!examId) {
      Toast.show({ type: 'error', text1: 'لم يتم تحديد الاختبار', position: 'bottom' });
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [contentsResRaw, exam] = await Promise.all([
        AuthService.getTrainingContents(),
        AuthService.getPaperExamById(examId),
      ]);
      const contentsRes: any = contentsResRaw;

      if (Array.isArray(contentsRes)) {
        setTrainingContents(contentsRes);
      } else if (contentsRes && Array.isArray(contentsRes.data)) {
        setTrainingContents(contentsRes.data);
      } else if (contentsRes && Array.isArray(contentsRes.trainingContents)) {
        setTrainingContents(contentsRes.trainingContents);
      } else {
        setTrainingContents([]);
      }

      setTrainingContentId(String(exam.trainingContentId || exam.trainingContent?.id || ''));
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setInstructions(exam.instructions || '');

      const parsedExamDate = exam.examDate ? new Date(exam.examDate) : null;
      setExamDate(parsedExamDate && !Number.isNaN(parsedExamDate.getTime()) ? parsedExamDate.toISOString() : '');

      setDuration(String(exam.duration || 120));
      setGradeType(exam.gradeType || 'WRITTEN');
      setTotalMarks(String(exam.totalMarks || 20));
      setPassingScore(String(exam.passingScore || 50));
      setAcademicYear(exam.academicYear || String(new Date().getFullYear()));
      setSemester(exam.semester || '');
      setNotes(exam.notes || '');
      setIsPublished(!!exam.isPublished);
    } catch (error) {
      console.error('Error loading paper exam for edit:', error);
      Toast.show({ type: 'error', text1: 'فشل تحميل بيانات الاختبار', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!trainingContentId) return 'اختر المادة التدريبية';
    if (!title.trim()) return 'أدخل عنوان الاختبار';
    if (!examDate.trim()) return 'أدخل تاريخ الاختبار بصيغة صحيحة';

    const durationNum = Number(duration);
    const totalMarksNum = Number(totalMarks);
    const passingScoreNum = Number(passingScore);

    if (!durationNum || durationNum <= 0) return 'المدة يجب أن تكون أكبر من صفر';
    if (!totalMarksNum || totalMarksNum <= 0) return 'إجمالي الدرجات يجب أن يكون أكبر من صفر';
    if (Number.isNaN(passingScoreNum) || passingScoreNum < 0 || passingScoreNum > 100) {
      return 'درجة النجاح يجب أن تكون بين 0 و 100';
    }

    const parsedDate = new Date(examDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'صيغة تاريخ الاختبار غير صحيحة';
    }

    return null;
  };

  const handleSave = async () => {
    if (!examId) return;

    const errorMessage = validateForm();
    if (errorMessage) {
      Toast.show({ type: 'error', text1: errorMessage, position: 'bottom' });
      return;
    }

    try {
      setSaving(true);

      await AuthService.updatePaperExam(examId, {
        trainingContentId: Number(trainingContentId),
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        examDate: new Date(examDate).toISOString(),
        duration: Number(duration),
        gradeType: gradeType as 'YEAR_WORK' | 'PRACTICAL' | 'WRITTEN' | 'FINAL_EXAM',
        totalMarks: Number(totalMarks),
        passingScore: Number(passingScore),
        academicYear: academicYear.trim(),
        semester: semester ? (semester as 'FIRST' | 'SECOND') : undefined,
        notes: notes.trim() || undefined,
        isPublished,
      });

      Toast.show({ type: 'success', text1: 'تم تحديث الاختبار بنجاح', position: 'bottom' });
      navigation.replace('PaperExamDetails', { examId });
    } catch (error) {
      console.error('Error updating paper exam:', error);
      Toast.show({ type: 'error', text1: 'فشل تحديث الاختبار', position: 'bottom' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل بيانات الاختبار...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaperExams" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>تعديل الاختبار الورقي</Text>
          <Text style={styles.subtitle}>تحديث بيانات الاختبار</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <SelectBox
            label="المادة التدريبية"
            selectedValue={trainingContentId}
            onValueChange={setTrainingContentId}
            items={contentOptions}
            placeholder="اختر المادة التدريبية"
          />

          <Text style={styles.label}>عنوان الاختبار</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>وصف الاختبار</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} />

          <Text style={styles.label}>تعليمات الاختبار</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>تاريخ الاختبار</Text>
          <TextInput style={styles.input} value={examDate} onChangeText={setExamDate} />

          <Text style={styles.label}>نوع الدرجة</Text>
          <SelectBox label="" selectedValue={gradeType} onValueChange={setGradeType} items={gradeTypeOptions} placeholder="-" />

          <Text style={styles.label}>الفصل الدراسي (اختياري)</Text>
          <SelectBox label="" selectedValue={semester} onValueChange={setSemester} items={semesterOptions} placeholder="اختر الفصل الدراسي" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>المدة (دقيقة)</Text>
              <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>إجمالي الدرجات</Text>
              <TextInput style={styles.input} value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>درجة النجاح (%)</Text>
              <TextInput style={styles.input} value={passingScore} onChangeText={setPassingScore} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>العام الدراسي</Text>
              <TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} />
            </View>
          </View>

          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>نشر الاختبار</Text>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={isPublished ? '#2563eb' : '#f8fafc'}
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelBtnText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={16} color="#fff" />}
            <Text style={styles.saveBtnText}>حفظ التعديلات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditPaperExamScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6fa' },
  loadingText: { marginTop: 10, color: '#64748b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14 },
  label: { color: '#334155', fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 90, height: 90, paddingTop: 10 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  switchRow: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { color: '#334155', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 16 },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: { color: '#334155', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    gap: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});

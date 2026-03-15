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

interface AddPaperExamScreenProps {
  navigation: any;
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

const AddPaperExamScreen: React.FC<AddPaperExamScreenProps> = ({ navigation }) => {
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
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
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
    loadTrainingContents();
  }, []);

  const loadTrainingContents = async () => {
    try {
      setLoading(true);
      const response: any = await AuthService.getTrainingContents();
      if (Array.isArray(response)) {
        setTrainingContents(response);
      } else if (response && Array.isArray(response.data)) {
        setTrainingContents(response.data);
      } else if (response && Array.isArray(response.trainingContents)) {
        setTrainingContents(response.trainingContents);
      } else {
        setTrainingContents([]);
      }
    } catch (error) {
      console.error('Error loading training contents:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل المواد التدريبية',
        position: 'bottom',
      });
      setTrainingContents([]);
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
      return 'صيغة تاريخ الاختبار غير صحيحة (مثال: 2026-03-20T10:00:00)';
    }

    return null;
  };

  const handleSave = async () => {
    const errorMessage = validateForm();
    if (errorMessage) {
      Toast.show({
        type: 'error',
        text1: errorMessage,
        position: 'bottom',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
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
      };

      const created = await AuthService.createPaperExam(payload);
      Toast.show({
        type: 'success',
        text1: 'تم إنشاء الاختبار الورقي بنجاح',
        position: 'bottom',
      });

      navigation.replace('PaperExamDetails', { examId: created.id });
    } catch (error) {
      console.error('Error creating paper exam:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل إنشاء الاختبار الورقي',
        position: 'bottom',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaperExams" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>إضافة اختبار ورقي</Text>
          <Text style={styles.subtitle}>إعداد اختبار ورقي جديد</Text>
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
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="مثال: اختبار نهاية الفصل"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>وصف الاختبار</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="اختياري"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>تعليمات الاختبار</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="اختياري"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>تاريخ الاختبار</Text>
          <TextInput
            style={styles.input}
            value={examDate}
            onChangeText={setExamDate}
            placeholder="2026-03-20T10:00:00"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>نوع الدرجة</Text>
          <SelectBox
            label=""
            selectedValue={gradeType}
            onValueChange={setGradeType}
            items={gradeTypeOptions}
            placeholder="اختر نوع الدرجة"
          />

          <Text style={styles.label}>الفصل الدراسي (اختياري)</Text>
          <SelectBox
            label=""
            selectedValue={semester}
            onValueChange={setSemester}
            items={semesterOptions}
            placeholder="اختر الفصل الدراسي"
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>المدة (دقيقة)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>إجمالي الدرجات</Text>
              <TextInput
                style={styles.input}
                value={totalMarks}
                onChangeText={setTotalMarks}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>درجة النجاح (%)</Text>
              <TextInput
                style={styles.input}
                value={passingScore}
                onChangeText={setPassingScore}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>العام الدراسي</Text>
              <TextInput
                style={styles.input}
                value={academicYear}
                onChangeText={setAcademicYear}
              />
            </View>
          </View>

          <Text style={styles.label}>ملاحظات</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="اختياري"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>نشر الاختبار مباشرة</Text>
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
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check" size={18} color="#fff" />}
            <Text style={styles.saveBtnText}>حفظ الاختبار</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AddPaperExamScreen;

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
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    gap: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});

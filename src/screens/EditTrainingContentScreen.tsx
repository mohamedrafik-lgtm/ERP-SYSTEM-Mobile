import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styles from './AddTrainingContentScreen.styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import SelectBox from '../components/SelectBox';
import MultiSelectBox from '../components/MultiSelectBox';
import { ISemester, ISemesterArabic, Year, YearArabic } from '../types/enums';
import { Program } from './ProgramsScreen';
import { ITrainingContent } from '../types/student';
import AuthService from '../services/AuthService';

interface User {
  id: string;
  name: string;
}

export interface IEditTrainingContent {
  code: string;
  name: string;
  semester: ISemester;
  year: Year;
  programIds: number[];
  instructorId: string;
  theoryAttendanceRecorderId: string;
  practicalAttendanceRecorderId: string;
  durationMonths: number;
  theorySessionsPerWeek: number;
  practicalSessionsPerWeek: number;
  chaptersCount: number;
  yearWorkMarks: number;
  practicalMarks: number;
  writtenMarks: number;
  attendanceMarks: number;
  quizzesMarks: number;
  finalExamMarks: number;
}

const EditTrainingContentScreen = ({ route, navigation }: any) => {
  const { content } = route.params;
  const [formData, setFormData] = useState<IEditTrainingContent>({
    code: content?.code || '',
    name: content?.name || '',
    semester: content?.semester || ISemester.FIRST,
    year: content?.year || Year.FIRST,
    programIds: content?.programIds || [],
    instructorId: content?.instructorId || '',
    theoryAttendanceRecorderId: content?.theoryAttendanceRecorderId || '',
    practicalAttendanceRecorderId: content?.practicalAttendanceRecorderId || '',
    durationMonths: content?.durationMonths || 0,
    theorySessionsPerWeek: content?.theorySessionsPerWeek || 0,
    practicalSessionsPerWeek: content?.practicalSessionsPerWeek || 0,
    chaptersCount: content?.chaptersCount || 0,
    yearWorkMarks: content?.yearWorkMarks || 0,
    practicalMarks: content?.practicalMarks || 0,
    writtenMarks: content?.writtenMarks || 0,
    attendanceMarks: content?.attendanceMarks || 0,
    quizzesMarks: content?.quizzesMarks || 0,
    finalExamMarks: content?.finalExamMarks || 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<IEditTrainingContent>>({});
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [recorders, setRecorders] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setProgramsLoading(true);
        const fetchedPrograms = await AuthService.getAllPrograms();
        setPrograms(fetchedPrograms);
      } catch (error) {
        console.error('Error fetching programs:', error);
        Alert.alert('خطأ', 'فشل في تحميل قائمة البرامج التدريبية. يرجى المحاولة مرة أخرى');
      } finally {
        setProgramsLoading(false);
        setInitialLoad(false);
      }
    };
    fetchPrograms();

    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const fetchedInstructors = await AuthService.getAllUsers('INSTRUCTOR');
        const fetchedRecorders = await AuthService.getAllUsers('RECORDER');
        setInstructors(fetchedInstructors);
        setRecorders(fetchedRecorders);
      } catch (error) {
        Alert.alert('خطأ', 'فشل في تحميل قائمة المستخدمين.');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (field: keyof IEditTrainingContent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const newErrors: Partial<IEditTrainingContent> = {};

    if (!formData.code) newErrors.code = 'كود المادة مطلوب';
    if (!formData.name) newErrors.name = 'اسم المادة مطلوب';
    if (formData.programIds.length === 0) newErrors.programIds = 'يجب اختيار برنامج واحد على الأقل' as any;
    if (!formData.instructorId) newErrors.instructorId = 'يجب اختيار محاضر';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.show({
        type: 'error',
        text1: 'بيانات غير مكتملة',
        text2: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sending update data:', JSON.stringify(formData, null, 2));
      await AuthService.updateTrainingContent(content.id, formData);
      Toast.show({
        type: 'success',
        text1: 'تم بنجاح!',
        text2: 'تم تحديث المحتوى التدريبي بنجاح',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating training content:', error);
      
      Alert.alert(
        'خطأ',
        error.message || 'حدث خطأ أثناء تحديث المحتوى',
        [
          {
            text: 'حسناً',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTextInput = (
    field: keyof IEditTrainingContent,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    disabled: boolean = false
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, disabled && styles.inputDisabled]}>
        <TextInput
          style={[styles.input, disabled && styles.inputTextDisabled]}
          value={String(formData[field])}
          onChangeText={(text) => handleInputChange(field, keyboardType === 'numeric' ? Number(text) : text)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          editable={!disabled}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field] as any}</Text>}
    </View>
  );

  const renderSelectBox = <T extends string>(
    field: keyof IEditTrainingContent,
    label: string,
    enumObj: Record<string, T>,
    labels: Record<T, string>
  ) => (
    <View style={styles.formGroup}>
      <SelectBox
        label={label}
        selectedValue={formData[field] as string | undefined}
        onValueChange={(value: string) => handleInputChange(field, value)}
        items={Object.values(enumObj).map(value => ({ value, label: labels[value] }))}
        placeholder={`اختر ${label}`}
        error={errors[field] as string | undefined}
      />
    </View>
  );

  if (initialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-forward-ios" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>تعديل محتوى تدريبي</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>معلومات المحتوى</Text>
          {renderTextInput('code', 'كود المادة', 'كود المادة', 'default', true)}
          {renderTextInput('name', 'اسم المادة', 'ادخل اسم المادة')}
          {renderSelectBox('semester', 'الفصل الدراسي', ISemester, ISemesterArabic)}
          {renderSelectBox('year', 'السنة الدراسية', Year, YearArabic)}
          {renderTextInput('durationMonths', 'مدة الدراسة (أشهر)', '0', 'numeric')}
          {renderTextInput('theorySessionsPerWeek', 'حصص نظري أسبوعياً', '0', 'numeric')}
          {renderTextInput('practicalSessionsPerWeek', 'حصص عملي أسبوعياً', '0', 'numeric')}
          {renderTextInput('chaptersCount', 'عدد الفصول', '0', 'numeric')}

          <Text style={styles.sectionTitle}>توزيع الدرجات</Text>
          {renderTextInput('yearWorkMarks', 'أعمال السنة', '0', 'numeric')}
          {renderTextInput('practicalMarks', 'عملي', '0', 'numeric')}
          {renderTextInput('writtenMarks', 'تحريري', '0', 'numeric')}
          {renderTextInput('attendanceMarks', 'حضور', '0', 'numeric')}
          {renderTextInput('quizzesMarks', 'اختبارات قصيرة', '0', 'numeric')}
          {renderTextInput('finalExamMarks', 'امتحان نهائي', '0', 'numeric')}

          <Text style={styles.sectionTitle}>التسكين</Text>
          <MultiSelectBox
            label="البرامج التدريبية *"
            items={programs.map(p => ({ id: p.id, name: p.nameAr }))}
            selectedItems={formData.programIds}
            onSelectionChange={(selectedIds) => handleInputChange('programIds', selectedIds)}
            placeholder="اختر البرامج"
            loading={programsLoading}
            error={errors.programIds as string | undefined}
          />
          <SelectBox
            label="المحاضر"
            selectedValue={formData.instructorId}
            onValueChange={(value) => handleInputChange('instructorId', value)}
            items={instructors.map(i => ({ value: i.id, label: i.name }))}
            placeholder="اختر المحاضر"
            loading={usersLoading}
            error={errors.instructorId as string | undefined}
          />
          <SelectBox
            label="مسجل حضور النظري"
            selectedValue={formData.theoryAttendanceRecorderId}
            onValueChange={(value) => handleInputChange('theoryAttendanceRecorderId', value)}
            items={recorders.map(r => ({ value: r.id, label: r.name }))}
            placeholder="اختر مسجل الحضور"
            loading={usersLoading}
            error={errors.theoryAttendanceRecorderId as string | undefined}
          />
          <SelectBox
            label="مسجل حضور العملي"
            selectedValue={formData.practicalAttendanceRecorderId}
            onValueChange={(value) => handleInputChange('practicalAttendanceRecorderId', value)}
            items={recorders.map(r => ({ value: r.id, label: r.name }))}
            placeholder="اختر مسجل الحضور"
            loading={usersLoading}
            error={errors.practicalAttendanceRecorderId as string | undefined}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>تحديث المحتوى</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default EditTrainingContentScreen;

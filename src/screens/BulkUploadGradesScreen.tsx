import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import * as XLSX from 'xlsx';
import CustomMenu from '../components/CustomMenu';
import MultiSelectBox from '../components/MultiSelectBox';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

type Program = {
  id: number;
  nameAr: string;
};

type Classroom = {
  id: number;
  name: string;
  classNumber?: number;
};

type TrainingContent = {
  id: number;
  name: string;
  code?: string;
  maxMarks: {
    yearWorkMarks: number;
    practicalMarks: number;
    writtenMarks: number;
    attendanceMarks: number;
    quizzesMarks: number;
    finalExamMarks: number;
    total: number;
  };
};

type Trainee = {
  id: number;
  nameAr: string;
  nationalId: string;
};

type ParsedSheet = {
  contentId: number;
  contentName: string;
  data: any[];
};

type ValidationError = {
  row: number;
  trainee: string;
  field: string;
  error: string;
};

type SelectedGrades = {
  yearWorkMarks: boolean;
  practicalMarks: boolean;
  writtenMarks: boolean;
  attendanceMarks: boolean;
  quizzesMarks: boolean;
  finalExamMarks: boolean;
};

type GradeField = {
  key: string;
  field: keyof SelectedGrades;
  maxField: keyof TrainingContent['maxMarks'];
};

const gradeFields: GradeField[] = [
  { key: 'أعمال السنة', field: 'yearWorkMarks', maxField: 'yearWorkMarks' },
  { key: 'العملي', field: 'practicalMarks', maxField: 'practicalMarks' },
  { key: 'التحريري', field: 'writtenMarks', maxField: 'writtenMarks' },
  { key: 'الحضور', field: 'attendanceMarks', maxField: 'attendanceMarks' },
  { key: 'اختبارات مصغرة', field: 'quizzesMarks', maxField: 'quizzesMarks' },
  { key: 'الميد تيرم', field: 'finalExamMarks', maxField: 'finalExamMarks' },
];

const stepTitles = ['اختيار البرنامج والفصل', 'اختيار المواد', 'تحميل القالب', 'رفع الدرجات'];

const normalizePath = (uri?: string): string => {
  if (!uri) return '';
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri;
};

const toNumberOrNull = (value: any): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const BulkUploadGradesScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [loadingTrainees, setLoadingTrainees] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [contents, setContents] = useState<TrainingContent[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [selectedContentIds, setSelectedContentIds] = useState<(number | string)[]>([]);

  const [selectedGrades, setSelectedGrades] = useState<SelectedGrades>({
    yearWorkMarks: true,
    practicalMarks: true,
    writtenMarks: true,
    attendanceMarks: true,
    quizzesMarks: true,
    finalExamMarks: true,
  });

  const [selectedFileName, setSelectedFileName] = useState('');
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const selectedContents = useMemo(
    () =>
      contents.filter((c) => selectedContentIds.map(Number).includes(c.id)),
    [contents, selectedContentIds]
  );

  const hasSelectedGrades = useMemo(() => Object.values(selectedGrades).some(Boolean), [selectedGrades]);

  const selectedProgram = programs.find((p) => p.id === Number(selectedProgramId));
  const selectedClassroom = classrooms.find((c) => c.id === Number(selectedClassroomId));

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const result = await AuthService.getAllPrograms();
      const normalized = Array.isArray(result)
        ? result.map((p: any) => ({
            id: Number(p.id),
            nameAr: p.nameAr || p.name || `برنامج ${p.id}`,
          }))
        : [];
      setPrograms(normalized);
    } catch (error) {
      setPrograms([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل البرامج التدريبية', position: 'bottom' });
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  const loadClassrooms = useCallback(async (programId: number) => {
    try {
      setLoadingClassrooms(true);
      const program = await AuthService.getProgramById(programId);
      const list = Array.isArray(program?.classrooms) ? program.classrooms : [];
      const normalized = list.map((c: any) => ({
        id: Number(c.id),
        name: c.name || `فصل ${c.id}`,
        classNumber: typeof c.classNumber === 'number' ? c.classNumber : undefined,
      }));
      setClassrooms(normalized);
    } catch (error) {
      setClassrooms([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل الفصول الدراسية', position: 'bottom' });
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  const loadContents = useCallback(async (classroomId: number) => {
    try {
      setLoadingContents(true);
      const list = await AuthService.getTrainingContentsByClassroom(classroomId);
      const normalized = Array.isArray(list)
        ? list.map((content: any) => ({
            id: Number(content.id),
            name: content.name || `مادة ${content.id}`,
            code: content.code,
            maxMarks: {
              yearWorkMarks: Number(content.yearWorkMarks || 0),
              practicalMarks: Number(content.practicalMarks || 0),
              writtenMarks: Number(content.writtenMarks || 0),
              attendanceMarks: Number(content.attendanceMarks || 0),
              quizzesMarks: Number(content.quizzesMarks || 0),
              finalExamMarks: Number(content.finalExamMarks || 0),
              total:
                Number(content.yearWorkMarks || 0) +
                Number(content.practicalMarks || 0) +
                Number(content.writtenMarks || 0) +
                Number(content.attendanceMarks || 0) +
                Number(content.quizzesMarks || 0) +
                Number(content.finalExamMarks || 0),
            },
          }))
        : [];
      setContents(normalized);
    } catch (error) {
      setContents([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل المواد التدريبية', position: 'bottom' });
    } finally {
      setLoadingContents(false);
    }
  }, []);

  const loadTrainees = useCallback(async (classroomId: number) => {
    try {
      setLoadingTrainees(true);
      const list = await AuthService.getTraineesByClassroom(classroomId);
      const normalized = Array.isArray(list)
        ? list.map((t: any) => ({
            id: Number(t.id),
            nameAr: t.nameAr || t.name || `متدرب ${t.id}`,
            nationalId: t.nationalId || '-',
          }))
        : [];
      setTrainees(normalized);
    } catch (error) {
      setTrainees([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل قائمة المتدربين', position: 'bottom' });
    } finally {
      setLoadingTrainees(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgramId) {
      setClassrooms([]);
      setSelectedClassroomId('');
      return;
    }

    loadClassrooms(Number(selectedProgramId));
    setSelectedClassroomId('');
    setContents([]);
    setTrainees([]);
    setSelectedContentIds([]);
    setParsedSheets([]);
    setValidationErrors([]);
  }, [selectedProgramId, loadClassrooms]);

  useEffect(() => {
    if (!selectedClassroomId) {
      setContents([]);
      setTrainees([]);
      setSelectedContentIds([]);
      return;
    }

    const classroomId = Number(selectedClassroomId);
    loadContents(classroomId);
    loadTrainees(classroomId);
    setSelectedContentIds([]);
    setParsedSheets([]);
    setValidationErrors([]);
  }, [selectedClassroomId, loadContents, loadTrainees]);

  const validateSheetData = (rows: any[], content: TrainingContent, errors: ValidationError[], sheetName: string) => {
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const traineeName = row['اسم المتدرب'] || 'غير معروف';

      if (!row['رقم المتدرب']) {
        errors.push({
          row: rowNumber,
          trainee: `[${sheetName}] ${traineeName}`,
          field: 'رقم المتدرب',
          error: 'رقم المتدرب مطلوب',
        });
        return;
      }

      gradeFields.forEach(({ key, field, maxField }) => {
        if (!selectedGrades[field]) return;

        const max = content.maxMarks[maxField] || 0;
        if (max === 0) return;

        const value = row[key];
        if (value === undefined || value === null || value === '') return;

        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          errors.push({
            row: rowNumber,
            trainee: `[${sheetName}] ${traineeName}`,
            field: key,
            error: 'قيمة غير صحيحة',
          });
          return;
        }

        if (parsed < 0) {
          errors.push({
            row: rowNumber,
            trainee: `[${sheetName}] ${traineeName}`,
            field: key,
            error: 'القيمة لا يمكن أن تكون سالبة',
          });
          return;
        }

        if (parsed > max) {
          errors.push({
            row: rowNumber,
            trainee: `[${sheetName}] ${traineeName}`,
            field: key,
            error: `القيمة تتجاوز الحد الأقصى (${max})`,
          });
        }
      });
    });
  };

  const handlePickExcel = async () => {
    try {
      const pickerModule = require('@react-native-documents/picker');
      const picker = pickerModule.default || pickerModule;

      const result = await picker.pick({
        type: [
          picker.types.xlsx,
          picker.types.xls,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        allowMultiSelection: false,
      });

      const file = Array.isArray(result) ? result[0] : result;
      const filePath = normalizePath(file?.fileCopyUri || file?.uri);
      if (!filePath) {
        Toast.show({ type: 'error', text1: 'لم يتم اختيار ملف صالح', position: 'bottom' });
        return;
      }

      const BlobUtilModule = require('react-native-blob-util');
      const BlobUtil = BlobUtilModule.default || BlobUtilModule;
      const base64Content = await BlobUtil.fs.readFile(filePath, 'base64');

      const workbook = XLSX.read(base64Content, { type: 'base64' });
      const sheets: ParsedSheet[] = [];
      const allErrors: ValidationError[] = [];

      workbook.SheetNames.forEach((sheetName: string) => {
        const matchedContent = selectedContents.find(
          (c) => c.name === sheetName || `${c.name.substring(0, 27)}...` === sheetName
        );

        if (!matchedContent) return;

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
        const filtered = jsonData.filter((row: any) => row['#'] !== 'تعليمات:' && row['رقم المتدرب']);

        sheets.push({
          contentId: matchedContent.id,
          contentName: matchedContent.name,
          data: filtered,
        });

        validateSheetData(filtered, matchedContent, allErrors, sheetName);
      });

      if (sheets.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'لم يتم العثور على شيتات مطابقة للمواد المختارة',
          position: 'bottom',
        });
        return;
      }

      setSelectedFileName(file?.name || 'grades.xlsx');
      setParsedSheets(sheets);
      setValidationErrors(allErrors);
      setStep(4);

      Toast.show({
        type: 'success',
        text1: `تم قراءة ${sheets.length} شيت بنجاح`,
        position: 'bottom',
      });
    } catch (error: any) {
      const pickerModule = require('@react-native-documents/picker');
      const picker = pickerModule.default || pickerModule;
      const isCancel = picker?.isErrorWithCode?.(error) && error?.code === picker?.errorCodes?.OPERATION_CANCELED;
      if (isCancel) return;

      Toast.show({ type: 'error', text1: error?.message || 'فشل قراءة ملف Excel', position: 'bottom' });
    }
  };

  const handleDownloadTemplate = async () => {
    if (selectedContents.length === 0 || trainees.length === 0) {
      Toast.show({ type: 'error', text1: 'يرجى اختيار المواد أولاً', position: 'bottom' });
      return;
    }

    if (!hasSelectedGrades) {
      Toast.show({ type: 'error', text1: 'يرجى اختيار نوع درجات واحد على الأقل', position: 'bottom' });
      return;
    }

    try {
      setCreatingTemplate(true);

      const workbook = XLSX.utils.book_new();
      const classroomId = Number(selectedClassroomId);

      for (const content of selectedContents) {
        let existingGradesMap: Record<number, any> = {};

        try {
          const gradesData = await AuthService.getGradesByContent(content.id, classroomId);
          const list = Array.isArray(gradesData?.data) ? gradesData.data : [];
          list.forEach((item: any) => {
            if (item?.grade && item?.trainee?.id) {
              existingGradesMap[Number(item.trainee.id)] = item.grade;
            }
          });
        } catch (error) {
          // keep template generation running even if no previous grades exist
          existingGradesMap = {};
        }

        const rows = trainees.map((trainee, index) => {
          const existing = existingGradesMap[trainee.id] || {};
          const row: Record<string, any> = {
            '#': index + 1,
            'رقم المتدرب': trainee.id,
            'الرقم القومي': trainee.nationalId,
            'اسم المتدرب': trainee.nameAr,
          };

          gradeFields.forEach(({ key, field, maxField }) => {
            if (!selectedGrades[field]) return;
            if ((content.maxMarks[maxField] || 0) <= 0) return;
            row[key] = existing[maxField] ?? '';
          });

          row['ملاحظات'] = existing?.notes || '';
          return row;
        });

        const instructions: Record<string, any> = {
          '#': 'تعليمات:',
          'رقم المتدرب': 'لا تعدل هذا العمود',
          'الرقم القومي': 'لا تعدل هذا العمود',
          'اسم المتدرب': 'لا تعدل هذا العمود',
        };

        gradeFields.forEach(({ key, field, maxField }) => {
          if (!selectedGrades[field]) return;
          const max = content.maxMarks[maxField] || 0;
          if (max <= 0) return;
          instructions[key] = `الحد الأقصى: ${max}`;
        });

        instructions['ملاحظات'] = 'اختياري';

        const finalData = [instructions, ...rows];
        const worksheet = XLSX.utils.json_to_sheet(finalData, { skipHeader: false });

        const wscols: any[] = [
          { wch: 5 },
          { wch: 14 },
          { wch: 18 },
          { wch: 28 },
        ];

        gradeFields.forEach(({ field, maxField }) => {
          if (selectedGrades[field] && (content.maxMarks[maxField] || 0) > 0) {
            wscols.push({ wch: 14 });
          }
        });

        wscols.push({ wch: 22 });
        worksheet['!cols'] = wscols;

        const sheetName = content.name.length > 30 ? `${content.name.substring(0, 27)}...` : content.name;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      const BlobUtilModule = require('react-native-blob-util');
      const BlobUtil = BlobUtilModule.default || BlobUtilModule;
      const dirs = BlobUtil.fs.dirs;
      const fileName = `درجات_${new Date().toISOString().split('T')[0]}.xlsx`;
      const path = Platform.OS === 'android' ? `${dirs.DownloadDir}/${fileName}` : `${dirs.DocumentDir}/${fileName}`;

      await BlobUtil.fs.writeFile(path, wbout, 'base64');

      Toast.show({
        type: 'success',
        text1: `تم حفظ القالب بنجاح (${selectedContents.length} مادة)`,
        text2: path,
        position: 'bottom',
      });

      setStep(4);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'فشل إنشاء قالب Excel', position: 'bottom' });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleUploadGrades = async () => {
    if (!selectedClassroomId || parsedSheets.length === 0) {
      Toast.show({ type: 'error', text1: 'يرجى إكمال الخطوات أولاً', position: 'bottom' });
      return;
    }

    if (validationErrors.length > 0) {
      Alert.alert('يوجد أخطاء', 'يرجى تصحيح أخطاء الملف قبل الرفع.');
      return;
    }

    try {
      setUploading(true);
      let totalUploaded = 0;
      const classroomId = Number(selectedClassroomId);

      for (const sheet of parsedSheets) {
        const content = selectedContents.find((c) => c.id === sheet.contentId);
        if (!content) continue;

        let existingGradesMap: Record<number, any> = {};
        try {
          const gradesData = await AuthService.getGradesByContent(sheet.contentId, classroomId);
          const list = Array.isArray(gradesData?.data) ? gradesData.data : [];
          list.forEach((item: any) => {
            if (item?.grade && item?.trainee?.id) {
              existingGradesMap[Number(item.trainee.id)] = item.grade;
            }
          });
        } catch (error) {
          existingGradesMap = {};
        }

        const grades = sheet.data.map((row: any) => {
          const traineeId = Number(row['رقم المتدرب']);
          const existing = existingGradesMap[traineeId] || {};

          const pick = (field: keyof SelectedGrades, excelKey: string, dbField: keyof TrainingContent['maxMarks']) => {
            const max = content.maxMarks[dbField] || 0;
            if (!selectedGrades[field] || max <= 0) {
              return Number(existing[dbField] ?? 0);
            }

            const parsed = toNumberOrNull(row[excelKey]);
            if (parsed === null) {
              return Number(existing[dbField] ?? 0);
            }

            return parsed;
          };

          return {
            traineeId,
            yearWorkMarks: pick('yearWorkMarks', 'أعمال السنة', 'yearWorkMarks'),
            practicalMarks: pick('practicalMarks', 'العملي', 'practicalMarks'),
            writtenMarks: pick('writtenMarks', 'التحريري', 'writtenMarks'),
            attendanceMarks: pick('attendanceMarks', 'الحضور', 'attendanceMarks'),
            quizzesMarks: pick('quizzesMarks', 'اختبارات مصغرة', 'quizzesMarks'),
            finalExamMarks: pick('finalExamMarks', 'الميد تيرم', 'finalExamMarks'),
            notes: String(row['ملاحظات'] || existing.notes || ''),
          };
        });

        await AuthService.bulkUpdateGrades({
          trainingContentId: sheet.contentId,
          classroomId,
          grades,
        });

        totalUploaded += grades.length;
      }

      Toast.show({
        type: 'success',
        text1: `تم رفع ${totalUploaded} سجل بنجاح`,
        text2: `${parsedSheets.length} مادة`,
        position: 'bottom',
      });

      setStep(1);
      setSelectedContentIds([]);
      setSelectedFileName('');
      setParsedSheets([]);
      setValidationErrors([]);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'فشل رفع الدرجات', position: 'bottom' });
    } finally {
      setUploading(false);
    }
  };

  const toggleGrade = (key: keyof SelectedGrades) => {
    setSelectedGrades((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const nextFromStep1Allowed = !!selectedClassroomId && !loadingClassrooms && !loadingContents && !loadingTrainees;

  return (
    <View style={styles.container}>
      <CustomMenu navigation={navigation} activeRouteName="BulkUploadGrades" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رفع درجات المتدربين</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepsWrap}>
          {stepTitles.map((title, index) => {
            const stepNumber = index + 1;
            const active = step >= stepNumber;
            return (
              <View key={title} style={styles.stepItem}>
                <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
                  {step > stepNumber ? (
                    <Icon name="check" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{stepNumber}</Text>
                  )}
                </View>
                <Text style={[styles.stepText, active && styles.stepTextActive]}>{title}</Text>
              </View>
            );
          })}
        </View>

        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1) اختيار البرنامج والفصل</Text>

            <SelectBox
              label="البرنامج التدريبي"
              selectedValue={selectedProgramId}
              onValueChange={(v: any) => setSelectedProgramId(String(v))}
              items={programs.map((p) => ({ value: String(p.id), label: p.nameAr }))}
              placeholder="اختر البرنامج"
              loading={loadingPrograms}
            />

            <SelectBox
              label="الفصل الدراسي"
              selectedValue={selectedClassroomId}
              onValueChange={(v: any) => setSelectedClassroomId(String(v))}
              items={classrooms.map((c) => ({
                value: String(c.id),
                label: c.classNumber ? `${c.name} (فصل ${c.classNumber})` : c.name,
              }))}
              placeholder={selectedProgramId ? 'اختر الفصل' : 'اختر البرنامج أولاً'}
              disabled={!selectedProgramId}
              loading={loadingClassrooms}
            />

            {!!selectedClassroomId && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>البرنامج: {selectedProgram?.nameAr || '-'}</Text>
                <Text style={styles.infoText}>الفصل: {selectedClassroom?.name || '-'}</Text>
                <Text style={styles.infoText}>عدد المتدربين: {loadingTrainees ? '...' : trainees.length}</Text>
                <Text style={styles.infoText}>عدد المواد: {loadingContents ? '...' : contents.length}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, !nextFromStep1Allowed && styles.disabledBtn]}
              disabled={!nextFromStep1Allowed}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryBtnText}>التالي</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2) اختيار المواد + أنواع الدرجات</Text>

            <MultiSelectBox
              label="المواد التدريبية"
              items={contents.map((c) => ({ id: c.id, name: c.name }))}
              selectedItems={selectedContentIds}
              onSelectionChange={setSelectedContentIds}
              placeholder={
                selectedContentIds.length > 0
                  ? `${selectedContentIds.length} مادة مختارة`
                  : 'اختر المواد التدريبية'
              }
              loading={loadingContents}
            />

            <View style={styles.gradeList}>
              {gradeFields.map((item) => (
                <TouchableOpacity key={item.field} style={styles.gradeItem} onPress={() => toggleGrade(item.field)}>
                  <Icon
                    name={selectedGrades[item.field] ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={selectedGrades[item.field] ? '#1d4ed8' : '#6b7280'}
                  />
                  <Text style={styles.gradeLabel}>{item.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                <Text style={styles.secondaryBtnText}>السابق</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, (selectedContentIds.length === 0 || !hasSelectedGrades) && styles.disabledBtn]}
                disabled={selectedContentIds.length === 0 || !hasSelectedGrades}
                onPress={() => setStep(3)}
              >
                <Text style={styles.primaryBtnText}>التالي</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3) تحميل قالب Excel</Text>
            <Text style={styles.subText}>سيتم إنشاء شيت منفصل لكل مادة مختارة، مع إدراج المتدربين الحاليين.</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>عدد المواد المختارة: {selectedContents.length}</Text>
              <Text style={styles.infoText}>عدد المتدربين: {trainees.length}</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, creatingTemplate && styles.disabledBtn]}
              onPress={handleDownloadTemplate}
              disabled={creatingTemplate}
            >
              {creatingTemplate ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>تحميل قالب الدرجات</Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
                <Text style={styles.secondaryBtnText}>السابق</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(4)}>
                <Text style={styles.secondaryBtnText}>الانتقال للرفع</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>4) رفع ملف الدرجات</Text>

            <TouchableOpacity style={styles.pickBtn} onPress={handlePickExcel}>
              <Icon name="upload-file" size={20} color="#1d4ed8" />
              <Text style={styles.pickBtnText}>اختيار ملف Excel</Text>
            </TouchableOpacity>

            {!!selectedFileName && <Text style={styles.fileName}>الملف المختار: {selectedFileName}</Text>}

            {parsedSheets.length > 0 && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>عدد الشيتات المطابقة: {parsedSheets.length}</Text>
                <Text style={styles.infoText}>
                  السجلات الجاهزة: {parsedSheets.reduce((sum, s) => sum + s.data.length, 0)}
                </Text>
              </View>
            )}

            {validationErrors.length > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>يوجد أخطاء في الملف ({validationErrors.length})</Text>
                {validationErrors.slice(0, 12).map((err, idx) => (
                  <Text key={`${err.row}-${idx}`} style={styles.errorItem}>
                    • {err.trainee} | صف {err.row} | {err.field}: {err.error}
                  </Text>
                ))}
                {validationErrors.length > 12 && (
                  <Text style={styles.errorItem}>... و {validationErrors.length - 12} أخطاء إضافية</Text>
                )}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(3)}>
                <Text style={styles.secondaryBtnText}>السابق</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (parsedSheets.length === 0 || validationErrors.length > 0 || uploading) && styles.disabledBtn,
                ]}
                disabled={parsedSheets.length === 0 || validationErrors.length > 0 || uploading}
                onPress={handleUploadGrades}
              >
                {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryBtnText}>رفع الدرجات</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  stepsWrap: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCircleActive: {
    backgroundColor: '#2563eb',
  },
  stepNumber: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  stepTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  subText: {
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    color: '#1e3a8a',
    fontSize: 13,
    marginBottom: 3,
  },
  gradeList: {
    marginTop: 8,
    marginBottom: 14,
  },
  gradeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gradeLabel: {
    marginLeft: 8,
    color: '#1f2937',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flex: 1,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginRight: 8,
  },
  secondaryBtnText: {
    color: '#3730a3',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  pickBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#60a5fa',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    marginBottom: 10,
  },
  pickBtnText: {
    color: '#1d4ed8',
    fontWeight: '700',
    marginLeft: 8,
  },
  fileName: {
    color: '#111827',
    marginBottom: 10,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  errorTitle: {
    color: '#b91c1c',
    fontWeight: '800',
    marginBottom: 6,
  },
  errorItem: {
    color: '#991b1b',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default BulkUploadGradesScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

const authService = AuthService as any;

type Program = {
  id: number;
  nameAr: string;
};

type Classroom = {
  id: number;
  name: string;
};

type TrainingContent = {
  id: number;
  name: string;
  code?: string;
};

type PreviewItem = {
  gradeId: number;
  traineeId: number;
  traineeName: string;
  nationalId: string;
  contentId: number;
  contentName: string;
  classroomName: string;
  componentValue: number;
  currentTotal: number;
  projectedTotal: number;
};

type PreviewResult = {
  component: string;
  threshold: number;
  totalAffected: number;
  preview: PreviewItem[];
};

type ApplyDetail = {
  traineeId: number;
  traineeName: string;
  contentName: string;
  oldValue: number;
  oldTotal: number;
  newTotal: number;
};

type ApplyResult = {
  component: string;
  threshold: number;
  totalUpdated: number;
  totalErrors: number;
  details: ApplyDetail[];
  errors: string[];
};

type GroupedPreview = Record<string, PreviewItem[]>;
type GroupedApply = Record<string, ApplyDetail[]>;

const componentOptions = [
  { value: 'yearWorkMarks', label: 'أعمال السنة' },
  { value: 'practicalMarks', label: 'العملي' },
  { value: 'writtenMarks', label: 'التحريري' },
  { value: 'attendanceMarks', label: 'الحضور' },
  { value: 'quizzesMarks', label: 'اختبارات اونلاين' },
  { value: 'finalExamMarks', label: 'الميد تيرم' },
];

const ResetGradeComponentScreen = ({ navigation }: any) => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [contents, setContents] = useState<TrainingContent[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedContents, setSelectedContents] = useState<number[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [threshold, setThreshold] = useState<string>('10');

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  const getComponentLabel = (value: string) => {
    return componentOptions.find(c => c.value === value)?.label || value;
  };

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const list = await authService.getTrainingPrograms();
      const normalized = Array.isArray(list)
        ? list.map((p: any) => ({ id: Number(p.id), nameAr: p.nameAr || p.name || `برنامج ${p.id}` }))
        : [];
      setPrograms(normalized);
    } catch (error) {
      setPrograms([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل البرامج التدريبية', position: 'bottom' });
    } finally {
      setLoadingPrograms(false);
      setRefreshing(false);
    }
  }, []);

  const loadClassrooms = useCallback(async (programId: number) => {
    try {
      setLoadingClassrooms(true);
      const program = await authService.getProgramById(programId);
      const list = Array.isArray(program?.classrooms) ? program.classrooms : [];
      setClassrooms(list.map((c: any) => ({ id: Number(c.id), name: c.name || `فصل ${c.id}` })));
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
      const list = await authService.getTrainingContentsByClassroom(classroomId);
      const normalized = Array.isArray(list)
        ? list.map((c: any) => ({ id: Number(c.id), name: c.name || `مادة ${c.id}`, code: c.code }))
        : [];
      setContents(normalized);
    } catch (error) {
      setContents([]);
      Toast.show({ type: 'error', text1: 'فشل تحميل المواد التدريبية', position: 'bottom' });
    } finally {
      setLoadingContents(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgram) {
      setClassrooms([]);
      setSelectedClassroom('');
      setContents([]);
      setSelectedContents([]);
      return;
    }

    const programId = Number(selectedProgram);
    if (!Number.isNaN(programId)) {
      loadClassrooms(programId);
      setSelectedClassroom('');
      setContents([]);
      setSelectedContents([]);
      setPreview(null);
      setApplyResult(null);
    }
  }, [selectedProgram, loadClassrooms]);

  useEffect(() => {
    if (!selectedClassroom) {
      setContents([]);
      setSelectedContents([]);
      return;
    }

    const classroomId = Number(selectedClassroom);
    if (!Number.isNaN(classroomId)) {
      loadContents(classroomId);
      setSelectedContents([]);
      setPreview(null);
      setApplyResult(null);
    }
  }, [selectedClassroom, loadContents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPrograms();
  }, [loadPrograms]);

  const toggleContent = (contentId: number) => {
    setSelectedContents(prev =>
      prev.includes(contentId) ? prev.filter(id => id !== contentId) : [...prev, contentId],
    );
    setPreview(null);
    setApplyResult(null);
  };

  const selectAllContents = () => {
    if (selectedContents.length === contents.length) {
      setSelectedContents([]);
    } else {
      setSelectedContents(contents.map(c => c.id));
    }
    setPreview(null);
    setApplyResult(null);
  };

  const thresholdNumber = useMemo(() => {
    const parsed = Number(threshold);
    if (Number.isNaN(parsed)) {
      return 10;
    }
    return Math.max(0, Math.min(100, parsed));
  }, [threshold]);

  const canPreview = selectedContents.length > 0 && !!selectedComponent;

  const handlePreview = async () => {
    if (!canPreview) {
      Toast.show({ type: 'error', text1: 'يرجى اختيار المواد ومكون الدرجة', position: 'bottom' });
      return;
    }

    try {
      setLoadingPreview(true);
      setPreview(null);
      setApplyResult(null);

      const data = await authService.previewResetGradeComponent({
        contentIds: selectedContents,
        component: selectedComponent,
        threshold: thresholdNumber,
      });

      setPreview(data);

      if (Number(data?.totalAffected || 0) === 0) {
        Toast.show({ type: 'info', text1: 'لا يوجد متدربون تنطبق عليهم الشروط', position: 'bottom' });
      } else {
        Toast.show({
          type: 'success',
          text1: `تم العثور على ${data.totalAffected} سجل`,
          position: 'bottom',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل المعاينة',
        text2: error?.message || 'حدث خطأ أثناء المعاينة',
        position: 'bottom',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!preview || Number(preview.totalAffected || 0) === 0 || !canPreview) {
      return;
    }

    Alert.alert(
      'تأكيد تصفير الدرجات',
      `سيتم تصفير ${getComponentLabel(selectedComponent)} لعدد ${preview.totalAffected} سجل. هل تريد المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تصفير',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingApply(true);
              const data = await authService.applyResetGradeComponent({
                contentIds: selectedContents,
                component: selectedComponent,
                threshold: thresholdNumber,
              });

              setApplyResult(data);
              setPreview(null);

              if (Number(data?.totalUpdated || 0) > 0) {
                Toast.show({
                  type: 'success',
                  text1: `تم تصفير ${data.totalUpdated} سجل بنجاح`,
                  position: 'bottom',
                });
              } else {
                Toast.show({ type: 'info', text1: 'لا توجد سجلات تحتاج تحديث', position: 'bottom' });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'فشل التطبيق',
                text2: error?.message || 'حدث خطأ أثناء تطبيق التصفير',
                position: 'bottom',
              });
            } finally {
              setLoadingApply(false);
            }
          },
        },
      ],
    );
  };

  const groupedPreview = useMemo<GroupedPreview>(() => {
    if (!preview?.preview?.length) {
      return {};
    }

    return preview.preview.reduce((acc: GroupedPreview, item) => {
      if (!acc[item.contentName]) {
        acc[item.contentName] = [];
      }
      acc[item.contentName].push(item);
      return acc;
    }, {});
  }, [preview]);

  const groupedApply = useMemo<GroupedApply>(() => {
    if (!applyResult?.details?.length) {
      return {};
    }

    return applyResult.details.reduce((acc: GroupedApply, item) => {
      if (!acc[item.contentName]) {
        acc[item.contentName] = [];
      }
      acc[item.contentName].push(item);
      return acc;
    }, {});
  }, [applyResult]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="ResetGradeComponent" />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
              } else {
                navigation.navigate('TraineeGrades');
              }
            }}
          >
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>تصفير مكون الدرجات</Text>
          <Text style={styles.subtitle}>تصفير مكون محدد للدرجات الأقل من الحد المطلوب</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.warningCard}>
          <View style={styles.warningHead}>
            <Icon name="warning-amber" size={22} color="#b91c1c" />
            <Text style={styles.warningTitle}>تنبيه مهم</Text>
          </View>
          <Text style={styles.warningText}>هذه الأداة تقوم بتصفير مكون الدرجة للمتدربين المستهدفين.</Text>
          <Text style={styles.warningText}>سيتم استهداف الدرجات الأكبر من 0 والأقل من أو تساوي الحد المحدد.</Text>
          <Text style={styles.warningTextStrong}>هذا الإجراء لا يمكن التراجع عنه بسهولة.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>الإعدادات</Text>

          <SelectBox<string>
            label="البرنامج التدريبي"
            selectedValue={selectedProgram}
            onValueChange={setSelectedProgram}
            items={programs.map(p => ({ value: String(p.id), label: p.nameAr }))}
            placeholder={loadingPrograms ? 'جاري تحميل البرامج...' : 'اختر البرنامج'}
            loading={loadingPrograms}
          />

          <SelectBox<string>
            label="الفصل الدراسي"
            selectedValue={selectedClassroom}
            onValueChange={setSelectedClassroom}
            items={classrooms.map(c => ({ value: String(c.id), label: c.name }))}
            placeholder={selectedProgram ? 'اختر الفصل' : 'اختر البرنامج أولا'}
            disabled={!selectedProgram}
            loading={loadingClassrooms}
          />

          {!!selectedClassroom && (
            <View style={styles.contentsContainer}>
              <View style={styles.contentsHeader}>
                <Text style={styles.contentsLabel}>المواد التدريبية</Text>
                {contents.length > 0 && (
                  <TouchableOpacity onPress={selectAllContents}>
                    <Text style={styles.selectAllText}>
                      {selectedContents.length === contents.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingContents ? (
                <View style={styles.contentsLoading}>
                  <ActivityIndicator size="small" color="#1a237e" />
                  <Text style={styles.loadingInlineText}>جاري تحميل المواد...</Text>
                </View>
              ) : contents.length === 0 ? (
                <Text style={styles.emptyText}>لا توجد مواد في هذا الفصل</Text>
              ) : (
                <View style={styles.contentChips}>
                  {contents.map(content => {
                    const selected = selectedContents.includes(content.id);
                    return (
                      <TouchableOpacity
                        key={content.id}
                        style={[styles.contentChip, selected && styles.contentChipSelected]}
                        onPress={() => toggleContent(content.id)}
                      >
                        <Text style={[styles.contentChipName, selected && styles.contentChipNameSelected]}>
                          {content.name}
                        </Text>
                        {!!content.code && (
                          <Text style={[styles.contentChipCode, selected && styles.contentChipCodeSelected]}>
                            {content.code}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <SelectBox<string>
            label="مكون الدرجة"
            selectedValue={selectedComponent}
            onValueChange={(value) => {
              setSelectedComponent(value);
              setPreview(null);
              setApplyResult(null);
            }}
            items={componentOptions}
            placeholder="اختر مكون الدرجة"
          />

          <Text style={styles.inputLabel}>الحد الأقصى (≤)</Text>
          <TextInput
            style={styles.input}
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={[styles.previewButton, !canPreview && styles.previewButtonDisabled]}
            onPress={handlePreview}
            disabled={!canPreview || loadingPreview}
          >
            {loadingPreview ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="search" size={18} color="#ffffff" />
                <Text style={styles.previewButtonText}>معاينة المتدربين المستهدفين</Text>
              </>
            )}
          </TouchableOpacity>

          {preview && Number(preview.totalAffected || 0) > 0 && (
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} disabled={loadingApply}>
              {loadingApply ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Icon name="restart-alt" size={18} color="#ffffff" />
                  <Text style={styles.applyButtonText}>تصفير الدرجات ({preview.totalAffected})</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {!!preview && Number(preview.totalAffected || 0) > 0 && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>نتائج المعاينة</Text>
              <Text style={styles.resultBadge}>{preview.totalAffected} سجل</Text>
            </View>

            {Object.entries(groupedPreview).map(([contentName, items]) => (
              <View key={contentName} style={styles.resultCard}>
                <View style={styles.resultCardHead}>
                  <Text style={styles.resultCardTitle}>{contentName}</Text>
                  <Text style={styles.resultCardCount}>{items.length} متدرب</Text>
                </View>

                {items.slice(0, 40).map((item, index) => (
                  <View key={`${item.gradeId}-${index}`} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowName}>{item.traineeName}</Text>
                      <Text style={styles.rowMeta}>{item.nationalId || '-'}</Text>
                    </View>
                    <View style={styles.rowMarks}>
                      <Text style={styles.oldMark}>{item.componentValue}</Text>
                      <Text style={styles.arrowMark}>→</Text>
                      <Text style={styles.newMark}>0</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {!!applyResult && (
          <View style={styles.resultSection}>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.summarySuccess]}>
                <Text style={styles.summaryLabel}>تم تصفيرها</Text>
                <Text style={styles.summaryValue}>{applyResult.totalUpdated}</Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryNeutral]}>
                <Text style={styles.summaryLabel}>المكون</Text>
                <Text style={styles.summaryValueSmall}>{getComponentLabel(applyResult.component)}</Text>
              </View>
              {Number(applyResult.totalErrors || 0) > 0 && (
                <View style={[styles.summaryCard, styles.summaryError]}>
                  <Text style={styles.summaryLabel}>أخطاء</Text>
                  <Text style={styles.summaryValue}>{applyResult.totalErrors}</Text>
                </View>
              )}
            </View>

            {Object.entries(groupedApply).map(([contentName, items]) => (
              <View key={contentName} style={styles.resultCard}>
                <View style={styles.resultCardHead}>
                  <Text style={styles.resultCardTitle}>{contentName}</Text>
                  <Text style={styles.resultCardCount}>{items.length} متدرب</Text>
                </View>

                {items.slice(0, 40).map((item, index) => (
                  <View key={`${item.traineeId}-${index}`} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowName}>{item.traineeName}</Text>
                      <Text style={styles.rowMeta}>الإجمالي: {item.oldTotal} → {item.newTotal}</Text>
                    </View>
                    <View style={styles.rowMarks}>
                      <Text style={styles.oldMark}>{item.oldValue}</Text>
                      <Text style={styles.arrowMark}>→</Text>
                      <Text style={styles.newMark}>0</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {!!applyResult.errors?.length && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>الأخطاء ({applyResult.errors.length})</Text>
                {applyResult.errors.slice(0, 15).map((error, index) => (
                  <Text key={`${index}-${error}`} style={styles.errorText}>• {error}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    gap: 12,
    paddingBottom: 28,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12,
  },
  warningHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991b1b',
  },
  warningText: {
    fontSize: 13,
    color: '#b91c1c',
    marginBottom: 4,
    lineHeight: 19,
  },
  warningTextStrong: {
    fontSize: 13,
    color: '#7f1d1d',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  contentsContainer: {
    marginBottom: 14,
  },
  contentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  contentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingInlineText: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    textAlign: 'center',
  },
  contentChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  contentChip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: '47%',
  },
  contentChipSelected: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  contentChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  contentChipNameSelected: {
    color: '#1e3a8a',
  },
  contentChipCode: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  contentChipCodeSelected: {
    color: '#1d4ed8',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  previewButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewButtonDisabled: {
    opacity: 0.5,
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  applyButton: {
    marginTop: 10,
    backgroundColor: '#b91c1c',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  resultSection: {
    gap: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  resultCardHead: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  resultCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  resultCardCount: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  rowMain: {
    flex: 1,
    paddingRight: 8,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  rowMarks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oldMark: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  arrowMark: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  newMark: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
    backgroundColor: '#ccfbf1',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  summarySuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  summaryNeutral: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  summaryError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '800',
  },
  summaryValueSmall: {
    marginTop: 8,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 10,
  },
  errorTitle: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '800',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    marginBottom: 2,
  },
});

export default ResetGradeComponentScreen;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import {
  MercyApplyDetail,
  MercyApplyResult,
  MercyGradeTrainingContent,
  MercyPreviewItem,
  MercyPreviewResult,
} from '../types/grades';

type Program = {
  id: number;
  nameAr: string;
};

type Classroom = {
  id: number;
  name: string;
  classNumber?: number;
};

type GroupedTrainee<T> = {
  traineeId: number;
  traineeName: string;
  nationalId?: string;
  subjects: T[];
};

const MercyGradesScreen = ({ navigation }: any) => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingApply, setLoadingApply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [contents, setContents] = useState<MercyGradeTrainingContent[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [selectedContents, setSelectedContents] = useState<number[]>([]);

  const [bonusPoints, setBonusPoints] = useState<number>(5);
  const [threshold, setThreshold] = useState<number>(50);
  const [minThreshold, setMinThreshold] = useState<number>(0);

  const [preview, setPreview] = useState<MercyPreviewResult | null>(null);
  const [applyResult, setApplyResult] = useState<MercyApplyResult | null>(null);
  const [expandedTrainees, setExpandedTrainees] = useState<Record<number, boolean>>({});

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const list = await AuthService.getAllPrograms();
      const normalized = Array.isArray(list)
        ? list.map((p: any) => ({ id: Number(p.id), nameAr: p.nameAr || p.name || `برنامج ${p.id}` }))
        : [];
      setPrograms(normalized);
    } catch (error) {
      console.error('Error loading programs for mercy grades:', error);
      Toast.show({ type: 'error', text1: 'فشل تحميل البرامج التدريبية', position: 'bottom' });
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
      setRefreshing(false);
    }
  }, []);

  const loadClassrooms = useCallback(async (programId: number) => {
    try {
      setLoadingClassrooms(true);
      const program = await AuthService.getProgramById(programId);
      const list = Array.isArray(program?.classrooms) ? program.classrooms : [];
      setClassrooms(
        list.map((c: any) => ({
          id: Number(c.id),
          name: c.name || `فصل ${c.id}`,
          classNumber: typeof c.classNumber === 'number' ? c.classNumber : undefined,
        }))
      );
    } catch (error) {
      console.error('Error loading classrooms for mercy grades:', error);
      Toast.show({ type: 'error', text1: 'فشل تحميل الفصول الدراسية', position: 'bottom' });
      setClassrooms([]);
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  const loadContents = useCallback(async (classroomId: number) => {
    try {
      setLoadingContents(true);
      const list = await AuthService.getTrainingContentsByClassroom(classroomId);
      const normalized = Array.isArray(list)
        ? list.map((c: any) => ({ id: Number(c.id), name: c.name || `مادة ${c.id}`, code: c.code }))
        : [];
      setContents(normalized);
    } catch (error) {
      console.error('Error loading classroom contents for mercy grades:', error);
      Toast.show({ type: 'error', text1: 'فشل تحميل المواد التدريبية', position: 'bottom' });
      setContents([]);
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
      setExpandedTrainees({});
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
      setExpandedTrainees({});
    }
  }, [selectedClassroom, loadContents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPrograms();
  }, [loadPrograms]);

  const canPreview = !!selectedClassroom && bonusPoints > 0 && bonusPoints <= 20;

  const toggleContent = (contentId: number) => {
    setSelectedContents((prev) =>
      prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId]
    );
  };

  const toggleSelectAllContents = () => {
    if (selectedContents.length === contents.length) {
      setSelectedContents([]);
    } else {
      setSelectedContents(contents.map((c) => c.id));
    }
  };

  const groupedPreview = useMemo<GroupedTrainee<MercyPreviewItem>[]>(() => {
    if (!preview) return [];

    const map: Record<number, GroupedTrainee<MercyPreviewItem>> = {};
    (preview.preview || []).forEach((item) => {
      if (!map[item.traineeId]) {
        map[item.traineeId] = {
          traineeId: item.traineeId,
          traineeName: item.traineeName,
          nationalId: item.nationalId,
          subjects: [],
        };
      }
      map[item.traineeId].subjects.push(item);
    });

    return Object.values(map);
  }, [preview]);

  const groupedApply = useMemo<GroupedTrainee<MercyApplyDetail>[]>(() => {
    if (!applyResult) return [];

    const map: Record<number, GroupedTrainee<MercyApplyDetail>> = {};
    (applyResult.details || []).forEach((item) => {
      if (!map[item.traineeId]) {
        map[item.traineeId] = {
          traineeId: item.traineeId,
          traineeName: item.traineeName,
          subjects: [],
        };
      }
      map[item.traineeId].subjects.push(item);
    });

    return Object.values(map);
  }, [applyResult]);

  const previewMercy = async () => {
    if (!canPreview) {
      Toast.show({
        type: 'error',
        text1: 'يرجى اختيار الفصل وتحديد درجات رأفة صحيحة',
        position: 'bottom',
      });
      return;
    }

    try {
      setLoadingPreview(true);
      setPreview(null);
      setApplyResult(null);
      setExpandedTrainees({});

      const result = await AuthService.previewMercyGrades({
        classroomId: Number(selectedClassroom),
        bonusPoints,
        threshold,
        minThreshold,
        contentIds: selectedContents.length > 0 ? selectedContents : undefined,
      });

      setPreview(result);

      if (Number(result?.totalAffected || 0) === 0) {
        Toast.show({ type: 'info', text1: 'لا توجد حالات تحتاج رأفة بهذه المعايير', position: 'bottom' });
      } else {
        Toast.show({
          type: 'success',
          text1: `تم العثور على ${result.totalAffected} سجل يحتاج رأفة`,
          position: 'bottom',
        });
      }
    } catch (error: any) {
      console.error('Error preview mercy grades:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل المعاينة',
        text2: error?.message || 'حدث خطأ أثناء معاينة درجات الرأفة',
        position: 'bottom',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const applyMercy = async () => {
    if (!preview || Number(preview.totalAffected || 0) === 0) {
      return;
    }

    Alert.alert(
      'تأكيد التطبيق',
      `سيتم تطبيق درجات الرأفة على ${preview.totalAffected} سجل. هل تريد المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تطبيق',
          onPress: async () => {
            try {
              setLoadingApply(true);
              const result = await AuthService.applyMercyGrades({
                classroomId: Number(selectedClassroom),
                bonusPoints,
                threshold,
                minThreshold,
                contentIds: selectedContents.length > 0 ? selectedContents : undefined,
              });

              setApplyResult(result);
              setPreview(null);
              setExpandedTrainees({});

              const updated = Number(result?.totalUpdated || 0);
              if (updated > 0) {
                Toast.show({
                  type: 'success',
                  text1: `تم تطبيق درجات الرأفة على ${updated} سجل`,
                  position: 'bottom',
                });
              } else {
                Toast.show({ type: 'info', text1: 'لا توجد سجلات تحتاج تحديث', position: 'bottom' });
              }
            } catch (error: any) {
              console.error('Error applying mercy grades:', error);
              Toast.show({
                type: 'error',
                text1: 'فشل التطبيق',
                text2: error?.message || 'حدث خطأ أثناء تطبيق درجات الرأفة',
                position: 'bottom',
              });
            } finally {
              setLoadingApply(false);
            }
          },
        },
      ]
    );
  };

  const toggleExpanded = (traineeId: number) => {
    setExpandedTrainees((prev) => ({
      ...prev,
      [traineeId]: !prev[traineeId],
    }));
  };

  const selectedClassroomObj = classrooms.find((c) => String(c.id) === selectedClassroom);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MercyGrades" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>درجات الرأفة</Text>
          <Text style={styles.subtitle}>إضافة درجات تعويضية للحالات القريبة من النجاح</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHead}>
            <Icon name="info-outline" size={20} color="#2563eb" />
            <Text style={styles.infoTitle}>آلية العمل</Text>
          </View>
          <Text style={styles.infoText}>يتم اختيار الحالات الأقل من الحد الأعلى والأعلى من الحد الأدنى، ثم توزيع درجات الرأفة على المكونات المتاحة.</Text>
          <Text style={styles.infoText}>يمكنك المعاينة أولاً قبل التطبيق الفعلي.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>الإعدادات</Text>

          <SelectBox<string>
            label="البرنامج التدريبي"
            selectedValue={selectedProgram}
            onValueChange={setSelectedProgram}
            items={programs.map((p) => ({ value: String(p.id), label: p.nameAr }))}
            placeholder={loadingPrograms ? 'جاري تحميل البرامج...' : 'اختر البرنامج'}
            loading={loadingPrograms}
          />

          <SelectBox<string>
            label="الفصل الدراسي"
            selectedValue={selectedClassroom}
            onValueChange={setSelectedClassroom}
            items={classrooms.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder={selectedProgram ? 'اختر الفصل' : 'اختر البرنامج أولاً'}
            disabled={!selectedProgram}
            loading={loadingClassrooms}
          />

          <View style={styles.numberRow}>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setBonusPoints((v) => Math.max(1, Number((v - 0.5).toFixed(1))))}>
              <Icon name="remove" size={20} color="#334155" />
            </TouchableOpacity>
            <View style={styles.counterCenter}>
              <Text style={styles.counterLabel}>درجات الرأفة</Text>
              <Text style={styles.counterValue}>{bonusPoints.toFixed(1)}</Text>
            </View>
            <TouchableOpacity style={styles.counterBtn} onPress={() => setBonusPoints((v) => Math.min(20, Number((v + 0.5).toFixed(1))))}>
              <Icon name="add" size={20} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.thresholdRow}>
            <TouchableOpacity style={styles.thresholdCard} onPress={() => setMinThreshold((v) => Math.max(0, v - 1))}>
              <Text style={styles.thresholdTitle}>الحد الأدنى</Text>
              <Text style={styles.thresholdValue}>{minThreshold}</Text>
              <Text style={styles.thresholdHint}>اضغط للتقليل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.thresholdCard} onPress={() => setThreshold((v) => Math.max(10, v - 1))}>
              <Text style={styles.thresholdTitle}>الحد الأعلى</Text>
              <Text style={styles.thresholdValue}>{threshold}</Text>
              <Text style={styles.thresholdHint}>اضغط للتقليل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.thresholdCard} onPress={() => setThreshold((v) => Math.min(100, v + 1))}>
              <Text style={styles.thresholdTitle}>رفع الحد الأعلى</Text>
              <Text style={styles.thresholdValue}>+1</Text>
              <Text style={styles.thresholdHint}>كل ضغطة +1</Text>
            </TouchableOpacity>
          </View>

          {!!selectedClassroom && (
            <View style={styles.contentsCard}>
              <View style={styles.contentsHeader}>
                <Text style={styles.contentsTitle}>المواد المستهدفة</Text>
                <TouchableOpacity onPress={toggleSelectAllContents}>
                  <Text style={styles.selectAllText}>
                    {selectedContents.length === contents.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingContents ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" color="#1a237e" />
                  <Text style={styles.loadingInlineText}>جاري تحميل المواد...</Text>
                </View>
              ) : contents.length === 0 ? (
                <Text style={styles.emptyInline}>لا توجد مواد تدريبية لهذا الفصل</Text>
              ) : (
                <View style={styles.chipsWrap}>
                  {contents.map((content) => {
                    const selected = selectedContents.includes(content.id);
                    return (
                      <TouchableOpacity
                        key={content.id}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => toggleContent(content.id)}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{content.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.previewBtn, (!canPreview || loadingPreview) && styles.disabledBtn]}
              onPress={previewMercy}
              disabled={!canPreview || loadingPreview}
            >
              {loadingPreview ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="search" size={18} color="#fff" />}
              <Text style={styles.actionBtnText}>{loadingPreview ? 'جاري المعاينة...' : 'معاينة النتائج'}</Text>
            </TouchableOpacity>

            {preview && Number(preview.totalAffected || 0) > 0 ? (
              <TouchableOpacity
                style={[styles.applyBtn, loadingApply && styles.disabledBtn]}
                onPress={applyMercy}
                disabled={loadingApply}
              >
                {loadingApply ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="check-circle" size={18} color="#fff" />}
                <Text style={styles.actionBtnText}>تطبيق ({preview.totalAffected})</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {preview ? (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>نتيجة المعاينة</Text>
              <Text style={styles.resultBadge}>{preview.totalAffected} مادة</Text>
            </View>
            <Text style={styles.resultSub}>الفصل: {preview.classroomName || selectedClassroomObj?.name || '-'}</Text>

            {groupedPreview.length === 0 ? (
              <Text style={styles.emptyInline}>لا توجد حالات مطابقة للمعايير المحددة.</Text>
            ) : (
              groupedPreview.map((trainee) => (
                <View key={trainee.traineeId} style={styles.traineeCard}>
                  <View style={styles.traineeHeader}>
                    <View>
                      <Text style={styles.traineeName}>{trainee.traineeName}</Text>
                      <Text style={styles.traineeMeta}>{trainee.nationalId || 'بدون رقم قومي'}</Text>
                    </View>
                    <Text style={styles.subjectCount}>{trainee.subjects.length} مواد</Text>
                  </View>
                  {(trainee.subjects || []).map((subj) => (
                    <View key={`${trainee.traineeId}-${subj.contentId}`} style={styles.subjectRow}>
                      <Text style={styles.subjectName}>{subj.contentName}</Text>
                      <Text style={styles.subjectScores}>
                        {subj.currentTotal} + {subj.addedPoints} = {subj.projectedTotal}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        ) : null}

        {applyResult ? (
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>نتيجة التطبيق</Text>
              <Text style={styles.resultBadgeSuccess}>{applyResult.totalUpdated} تم تحديثها</Text>
            </View>

            <View style={styles.statsApplyRow}>
              <View style={styles.applyStatCard}>
                <Text style={styles.applyStatValue}>{groupedApply.length}</Text>
                <Text style={styles.applyStatLabel}>متدرب</Text>
              </View>
              <View style={styles.applyStatCard}>
                <Text style={styles.applyStatValue}>{applyResult.totalUpdated}</Text>
                <Text style={styles.applyStatLabel}>سجل محدث</Text>
              </View>
              <View style={styles.applyStatCard}>
                <Text style={styles.applyStatValue}>{applyResult.totalErrors}</Text>
                <Text style={styles.applyStatLabel}>أخطاء</Text>
              </View>
            </View>

            {groupedApply.map((trainee) => {
              const expanded = !!expandedTrainees[trainee.traineeId];
              const totalAdded = trainee.subjects.reduce((sum, s) => sum + Number(s.addedPoints || 0), 0);

              return (
                <View key={trainee.traineeId} style={styles.traineeCard}>
                  <TouchableOpacity style={styles.traineeHeader} onPress={() => toggleExpanded(trainee.traineeId)}>
                    <View>
                      <Text style={styles.traineeName}>{trainee.traineeName}</Text>
                      <Text style={styles.traineeMeta}>{trainee.subjects.length} مواد - +{totalAdded.toFixed(1)} درجة</Text>
                    </View>
                    <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color="#64748b" />
                  </TouchableOpacity>

                  {expanded
                    ? trainee.subjects.map((subj, idx) => (
                        <View key={`${trainee.traineeId}-${idx}`} style={styles.subjectRow}>
                          <Text style={styles.subjectName}>{subj.contentName}</Text>
                          <Text style={styles.subjectScores}>
                            {subj.oldTotal} + {subj.addedPoints} = {subj.newTotal}
                          </Text>
                        </View>
                      ))
                    : null}
                </View>
              );
            })}

            {(applyResult.errors || []).length > 0 ? (
              <View style={styles.errorsBox}>
                <Text style={styles.errorsTitle}>الأخطاء</Text>
                {applyResult.errors.map((err, idx) => (
                  <Text key={idx} style={styles.errorItem}>• {err}</Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
  content: { flex: 1, padding: 16 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
    marginBottom: 12,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  infoText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 10 },
  numberRow: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterCenter: { alignItems: 'center' },
  counterLabel: { fontSize: 12, color: '#64748b' },
  counterValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  thresholdRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  thresholdCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  thresholdTitle: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  thresholdValue: { fontSize: 16, color: '#0f172a', fontWeight: '800', marginTop: 2 },
  thresholdHint: { fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  contentsCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 10,
  },
  contentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contentsTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
  selectAllText: { fontSize: 12, color: '#2563eb', fontWeight: '700' },
  loadingInline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingInlineText: { fontSize: 12, color: '#64748b' },
  emptyInline: { fontSize: 12, color: '#64748b', marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#dbeafe', borderColor: '#60a5fa' },
  chipText: { fontSize: 12, color: '#475569' },
  chipTextSelected: { color: '#1d4ed8', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  disabledBtn: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontSize: 16, color: '#0f172a', fontWeight: '800' },
  resultBadge: { backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  resultBadgeSuccess: { backgroundColor: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  resultSub: { marginTop: 6, fontSize: 12, color: '#64748b' },
  traineeCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  traineeHeader: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  traineeName: { fontSize: 14, color: '#0f172a', fontWeight: '700' },
  traineeMeta: { marginTop: 2, fontSize: 11, color: '#64748b' },
  subjectCount: { fontSize: 11, color: '#1d4ed8', fontWeight: '700' },
  subjectRow: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: { fontSize: 12, color: '#334155', flex: 1, marginRight: 8 },
  subjectScores: { fontSize: 12, color: '#0f766e', fontWeight: '700' },
  statsApplyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  applyStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyStatValue: { fontSize: 17, color: '#0f172a', fontWeight: '800' },
  applyStatLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  errorsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    padding: 10,
  },
  errorsTitle: { fontSize: 13, color: '#b91c1c', fontWeight: '800', marginBottom: 6 },
  errorItem: { fontSize: 12, color: '#b91c1c', marginBottom: 3 },
});

export default MercyGradesScreen;

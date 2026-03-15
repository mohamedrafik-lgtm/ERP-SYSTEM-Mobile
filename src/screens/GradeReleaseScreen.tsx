import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

interface GradeReleaseScreenProps {
  navigation: any;
}

type Classroom = {
  id: number;
  name: string;
  classNumber: number;
  startDate?: string | null;
  endDate?: string | null;
};

type GradeReleaseSetting = {
  id: string;
  programId: number;
  semester: 'FIRST' | 'SECOND';
  academicYear: string;
  isReleased: boolean;
  releasedAt?: string | null;
  requirePayment: boolean;
  linkedFeeType?: string | null;
  notes?: string | null;
};

type TraineeFee = {
  id: number;
  name: string;
  amount: number;
  type: string;
};

type Program = {
  id: number;
  nameAr: string;
  nameEn?: string;
  classrooms: Classroom[];
  gradeReleaseSettings: GradeReleaseSetting[];
  traineeFees: TraineeFee[];
};

const academicYear = '2024-2025';

const GradeReleaseScreen: React.FC<GradeReleaseScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [requirePayment, setRequirePayment] = useState(false);
  const [linkedFeeType, setLinkedFeeType] = useState('');
  const [notes, setNotes] = useState('');
  const [savingRelease, setSavingRelease] = useState(false);

  const mergePrograms = useCallback((basePrograms: any[], settingsPrograms: any[]): Program[] => {
    const safeBase = Array.isArray(basePrograms) ? basePrograms : [];
    const safeSettings = Array.isArray(settingsPrograms) ? settingsPrograms : [];

    return safeBase.map((program) => {
      const settingsProgram = safeSettings.find((p) => p.id === program.id);
      return {
        ...program,
        classrooms: Array.isArray(program.classrooms) ? program.classrooms : [],
        gradeReleaseSettings: Array.isArray(settingsProgram?.gradeReleaseSettings)
          ? settingsProgram.gradeReleaseSettings
          : [],
        traineeFees: Array.isArray(settingsProgram?.traineeFees) ? settingsProgram.traineeFees : [],
      };
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [programsData, gradeReleaseData] = await Promise.all([
        AuthService.getAllPrograms(),
        AuthService.getGradeReleasePrograms(),
      ]);

      setPrograms(mergePrograms(programsData, gradeReleaseData));
    } catch (error) {
      console.error('Error loading grade release data:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل بيانات إعلان الدرجات',
        position: 'bottom',
      });
      setPrograms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mergePrograms]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getSettingForClassroom = useCallback(
    (programId: number, classroomNumber: number): GradeReleaseSetting | null => {
      const semester: 'FIRST' | 'SECOND' = classroomNumber % 2 === 1 ? 'FIRST' : 'SECOND';
      const uniqueYear = `${academicYear}-P${programId}-C${classroomNumber}`;

      for (const program of programs) {
        const setting = program.gradeReleaseSettings.find(
          (s) => s.semester === semester && s.academicYear === uniqueYear
        );
        if (setting) {
          return setting;
        }
      }

      return null;
    },
    [programs]
  );

  const openReleaseDialog = (classroom: Classroom, programId: number) => {
    const existing = getSettingForClassroom(programId, classroom.classNumber);

    if (existing?.isReleased) {
      Alert.alert('تأكيد إلغاء الإعلان', 'سيتم إخفاء الدرجات عن المتدربين. هل تريد المتابعة؟', [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'إلغاء الإعلان',
          style: 'destructive',
          onPress: () => cancelRelease(existing.id),
        },
      ]);
      return;
    }

    setSelectedClassroom(classroom);
    setSelectedProgramId(programId);
    setRequirePayment(false);
    setLinkedFeeType('');
    setNotes('');
    setShowDialog(true);
  };

  const cancelRelease = async (settingId: string) => {
    try {
      await AuthService.deleteGradeRelease(settingId);
      Toast.show({
        type: 'success',
        text1: 'تم إلغاء إعلان الدرجات',
        position: 'bottom',
      });
      await loadData();
    } catch (error) {
      console.error('Error canceling release:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل في إلغاء الإعلان',
        position: 'bottom',
      });
    }
  };

  const saveRelease = async () => {
    if (!selectedClassroom || !selectedProgramId) {
      return;
    }

    if (requirePayment && !linkedFeeType) {
      Toast.show({
        type: 'error',
        text1: 'يجب اختيار نوع الرسم المطلوب',
        position: 'bottom',
      });
      return;
    }

    try {
      setSavingRelease(true);
      const semester: 'FIRST' | 'SECOND' = selectedClassroom.classNumber % 2 === 1 ? 'FIRST' : 'SECOND';
      const uniqueYear = `${academicYear}-P${selectedProgramId}-C${selectedClassroom.classNumber}`;

      await AuthService.createGradeRelease({
        programId: selectedProgramId,
        semester,
        academicYear: uniqueYear,
        requirePayment,
        linkedFeeType: requirePayment ? linkedFeeType : null,
        notes: notes?.trim() || `إعلان درجات ${selectedClassroom.name} (الفصل ${selectedClassroom.classNumber})`,
      });

      Toast.show({
        type: 'success',
        text1: 'تم إعلان النتيجة بنجاح',
        position: 'bottom',
      });
      setShowDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error saving grade release:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل في إعلان النتيجة',
        position: 'bottom',
      });
    } finally {
      setSavingRelease(false);
    }
  };

  const feeOptions = useMemo(() => {
    const selectedProgram = programs.find((p) => p.id === selectedProgramId);
    if (!selectedProgram) {
      return [];
    }

    return selectedProgram.traineeFees.map((fee) => ({
      value: fee.name,
      label: `${fee.name} - ${Number(fee.amount || 0).toLocaleString('ar-EG')} جنيه`,
    }));
  }, [programs, selectedProgramId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="GradeRelease" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>إعلان الدرجات</Text>
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
        <CustomMenu navigation={navigation} activeRouteName="GradeRelease" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>إدارة إعلان الدرجات</Text>
          <Text style={styles.subtitle}>إعلان درجات الفصول الدراسية وربط شرط السداد</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={18} color="#2563eb" />
            <Text style={styles.infoTitle}>كيفية الاستخدام</Text>
          </View>
          <Text style={styles.infoText}>هذه الصفحة مخصصة لإعلان نتيجة الفصل الدراسي بالكامل.</Text>
          <Text style={styles.infoText}>يمكنك ربط شرط سداد رسم مالي قبل ظهور الدرجات للمتدرب.</Text>
          <Text style={styles.infoText}>اضغط "إعلان النتيجة" لفتح إعدادات الإعلان لكل فصل.</Text>
        </View>

        {programs.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programBadge}>
                <Icon name="school" size={20} color="#2563eb" />
              </View>
              <View style={styles.programInfo}>
                <Text style={styles.programTitle}>{program.nameAr}</Text>
                <Text style={styles.programSub}>{program.nameEn || ''}</Text>
              </View>
              <Text style={styles.classroomCount}>{program.classrooms.length} فصل</Text>
            </View>

            {program.classrooms.length === 0 ? (
              <View style={styles.emptyClassrooms}>
                <Icon name="event-busy" size={20} color="#94a3b8" />
                <Text style={styles.emptyClassroomsText}>لا توجد فصول دراسية لهذا البرنامج</Text>
              </View>
            ) : (
              program.classrooms.map((classroom) => {
                const setting = getSettingForClassroom(program.id, classroom.classNumber);
                const isReleased = !!setting?.isReleased;

                return (
                  <View key={classroom.id} style={styles.classroomCard}>
                    <View style={styles.classroomTop}>
                      <View style={styles.classNumberBadge}>
                        <Text style={styles.classNumberText}>{classroom.classNumber}</Text>
                      </View>

                      <View style={styles.classroomMainInfo}>
                        <Text style={styles.classroomName}>{classroom.name}</Text>
                        {classroom.startDate && classroom.endDate ? (
                          <Text style={styles.classroomDate}>
                            {new Date(classroom.startDate).toLocaleDateString('ar-EG')} - {new Date(classroom.endDate).toLocaleDateString('ar-EG')}
                          </Text>
                        ) : null}

                        <View style={styles.releaseStatusRow}>
                          <Icon
                            name={isReleased ? 'check-circle' : 'cancel'}
                            size={14}
                            color={isReleased ? '#16a34a' : '#6b7280'}
                          />
                          <Text style={[styles.releaseStatusText, { color: isReleased ? '#15803d' : '#6b7280' }]}>
                            {isReleased ? 'تم إعلان الدرجات' : 'لم يتم الإعلان بعد'}
                          </Text>
                        </View>

                        {setting?.requirePayment ? (
                          <View style={styles.paymentRow}>
                            <Icon name="payments" size={14} color="#b45309" />
                            <Text style={styles.paymentText}>يتطلب سداد: {setting.linkedFeeType || 'رسوم'}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.releaseBtn, isReleased ? styles.cancelReleaseBtn : styles.confirmReleaseBtn]}
                      onPress={() => openReleaseDialog(classroom, program.id)}
                    >
                      <Icon name={isReleased ? 'cancel' : 'check-circle'} size={16} color="#fff" />
                      <Text style={styles.releaseBtnText}>{isReleased ? 'إلغاء الإعلان' : 'إعلان النتيجة'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <Modal visible={showDialog} transparent animationType="slide" onRequestClose={() => setShowDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>إعلان نتيجة {selectedClassroom?.name || ''}</Text>
                <Text style={styles.modalSubtitle}>الفصل رقم {selectedClassroom?.classNumber || ''}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDialog(false)}>
                <Icon name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedClassroom?.startDate && selectedClassroom?.endDate ? (
                <View style={styles.classInfoBox}>
                  <Text style={styles.classInfoTitle}>معلومات الفصل</Text>
                  <Text style={styles.classInfoText}>
                    من {new Date(selectedClassroom.startDate).toLocaleDateString('ar-EG')} إلى {new Date(selectedClassroom.endDate).toLocaleDateString('ar-EG')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.requirePaymentBox}>
                <View style={styles.requirePaymentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requirePaymentTitle}>يتطلب سداد رسم مالي</Text>
                    <Text style={styles.requirePaymentSub}>فعّل هذا الخيار لربط الإعلان بنوع رسم محدد</Text>
                  </View>
                  <Switch
                    value={requirePayment}
                    onValueChange={(val) => {
                      setRequirePayment(val);
                      if (!val) {
                        setLinkedFeeType('');
                      }
                    }}
                    trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                    thumbColor={requirePayment ? '#2563eb' : '#f8fafc'}
                  />
                </View>

                {requirePayment ? (
                  <SelectBox
                    label="نوع الرسم المطلوب"
                    selectedValue={linkedFeeType}
                    onValueChange={setLinkedFeeType}
                    items={feeOptions}
                    placeholder="اختر نوع الرسم..."
                  />
                ) : null}
              </View>

              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>ملاحظات (اختياري)</Text>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="أضف ملاحظات إضافية إن وجدت..."
                  placeholderTextColor="#94a3b8"
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.cancelBtn]}
                onPress={() => setShowDialog(false)}
                disabled={savingRelease}
              >
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerBtn, styles.saveBtn, savingRelease ? styles.disabledBtn : null]}
                onPress={saveRelease}
                disabled={savingRelease || (requirePayment && !linkedFeeType)}
              >
                {savingRelease ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check-circle" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>إعلان النتيجة</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default GradeReleaseScreen;

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
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
  content: { flex: 1, padding: 20 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    marginLeft: 6,
    color: '#1f2937',
    fontWeight: '700',
  },
  infoText: {
    color: '#475569',
    marginBottom: 5,
    lineHeight: 20,
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  programBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    marginRight: 10,
  },
  programInfo: { flex: 1 },
  programTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  programSub: {
    color: '#64748b',
    marginTop: 2,
    fontSize: 12,
  },
  classroomCount: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyClassrooms: {
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emptyClassroomsText: {
    color: '#64748b',
    fontSize: 12,
  },
  classroomCard: {
    margin: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  classroomTop: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  classNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  classNumberText: {
    color: '#fff',
    fontWeight: '700',
  },
  classroomMainInfo: { flex: 1 },
  classroomName: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  classroomDate: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  releaseStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  releaseStatusText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  paymentText: {
    marginLeft: 5,
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
  },
  releaseBtn: {
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  confirmReleaseBtn: {
    backgroundColor: '#16a34a',
  },
  cancelReleaseBtn: {
    backgroundColor: '#dc2626',
  },
  releaseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 12,
  },
  modalBody: {
    padding: 16,
  },
  classInfoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  classInfoTitle: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 4,
  },
  classInfoText: {
    color: '#64748b',
    fontSize: 12,
  },
  requirePaymentBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  requirePaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirePaymentTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  requirePaymentSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  notesBox: {
    marginBottom: 8,
  },
  notesLabel: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    minHeight: 90,
    padding: 10,
    color: '#111827',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    color: '#334155',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});

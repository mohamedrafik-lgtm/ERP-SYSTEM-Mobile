import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

type Program = {
  id: number;
  nameAr: string;
  nameEn?: string;
};

type Trainee = {
  id: number;
  nameAr: string;
  nameEn?: string;
  nationalId: string;
  photoUrl?: string;
  program: Program;
  remainingAmount?: number;
  totalDebt?: number;
};

const TraineeTransferScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const [showReviewBox, setShowReviewBox] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [confirmTimer, setConfirmTimer] = useState(5);
  const [deleteOldDebt, setDeleteOldDebt] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [programsResponse, traineesResponse] = await Promise.all([
        AuthService.getAllPrograms(),
        AuthService.getTraineesWithFinancialData({ limit: 1000 }),
      ]);

      const normalizedPrograms = Array.isArray(programsResponse) ? programsResponse : [];

      const sourceTrainees = Array.isArray(traineesResponse?.data)
        ? traineesResponse.data
        : [];

      const normalizedTrainees = sourceTrainees.map((trainee: any) => ({
        ...trainee,
        totalDebt: typeof trainee.remainingAmount === 'number' ? trainee.remainingAmount : 0,
      }));

      setPrograms(normalizedPrograms);
      setTrainees(normalizedTrainees);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showFinalModal) {
      return;
    }

    if (confirmTimer <= 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setConfirmTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [showFinalModal, confirmTimer]);

  const filteredTrainees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return trainees;
    }

    return trainees.filter(trainee => {
      return (
        trainee.nameAr?.toLowerCase().includes(normalizedSearch) ||
        trainee.nameEn?.toLowerCase().includes(normalizedSearch) ||
        trainee.nationalId?.includes(searchTerm.trim()) ||
        trainee.program?.nameAr?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [trainees, searchTerm]);

  const availablePrograms = useMemo(() => {
    return programs.filter(program => program.id !== selectedTrainee?.program?.id);
  }, [programs, selectedTrainee]);

  const selectedProgram = useMemo(() => {
    return programs.find(p => p.id === selectedProgramId) || null;
  }, [programs, selectedProgramId]);

  const resetSelection = () => {
    setSelectedTrainee(null);
    setSelectedProgramId(null);
    setShowReviewBox(false);
    setShowFinalModal(false);
    setShowProgramPicker(false);
    setConfirmTimer(5);
    setDeleteOldDebt(false);
  };

  const openReview = () => {
    if (!selectedTrainee || !selectedProgramId) {
      Alert.alert('تنبيه', 'يرجى اختيار المتدرب والبرنامج الجديد');
      return;
    }

    setShowReviewBox(true);
  };

  const openFinalConfirmation = () => {
    setConfirmTimer(5);
    setShowFinalModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTrainee || !selectedProgramId) {
      return;
    }

    try {
      setTransferring(true);
      setShowFinalModal(false);

      const response = await AuthService.transferTraineeProgram(
        selectedTrainee.id,
        selectedProgramId,
        deleteOldDebt,
      );

      if (response?.success) {
        Alert.alert(
          'تم بنجاح',
          deleteOldDebt
            ? 'تم تحويل المتدرب بنجاح مع حذف المديونية القديمة وتطبيق رسوم البرنامج الجديد'
            : 'تم تحويل المتدرب بنجاح وتم تطبيق الرسوم الدراسية للبرنامج الجديد',
        );
        resetSelection();
        await loadData();
      } else {
        throw new Error(response?.message || 'فشل في تحويل المتدرب');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء تحويل المتدرب');
    } finally {
      setTransferring(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="TraineeTransfer" />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
              } else {
                navigation.navigate('StudentsList');
              }
            }}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>تحويل المتدربين</Text>
          <Text style={styles.headerSubtitle}>تحويل متدرب من برنامج إلى برنامج آخر</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>اختيار المتدرب</Text>
          <TextInput
            style={styles.input}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="ابحث بالاسم أو الرقم القومي أو البرنامج..."
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.helperText}>({filteredTrainees.length} من {trainees.length})</Text>

          <View style={styles.listContainer}>
            {filteredTrainees.map(trainee => {
              const selected = selectedTrainee?.id === trainee.id;
              const totalDebt = trainee.totalDebt || 0;

              return (
                <TouchableOpacity
                  key={trainee.id}
                  style={[styles.listItem, selected && styles.listItemSelected]}
                  onPress={() => {
                    setSelectedTrainee(trainee);
                    setSelectedProgramId(null);
                    setShowReviewBox(false);
                  }}>
                  <View style={styles.listItemContent}>
                    {trainee.photoUrl ? (
                      <Image source={{ uri: trainee.photoUrl }} style={styles.traineeAvatar} />
                    ) : (
                      <View style={styles.traineeAvatarPlaceholder}>
                        <Icon name="person" size={16} color="#64748b" />
                      </View>
                    )}

                    <View style={styles.listItemMain}>
                      <Text style={styles.listItemName}>{trainee.nameAr}</Text>
                      <Text style={styles.listItemMeta}>{trainee.nationalId}</Text>
                      <Text style={styles.listItemMeta}>البرنامج الحالي: {trainee.program?.nameAr}</Text>
                    </View>
                  </View>
                  <View style={[styles.badge, totalDebt > 0 ? styles.badgeDebt : styles.badgePaid]}>
                    <Text style={totalDebt > 0 ? styles.badgeDebtText : styles.badgePaidText}>
                      {totalDebt > 0 ? `${totalDebt} ج.م` : 'مسدد'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedTrainee && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>معلومات المتدرب</Text>
            <View style={styles.selectedTraineeHeader}>
              {selectedTrainee.photoUrl ? (
                <Image source={{ uri: selectedTrainee.photoUrl }} style={styles.selectedAvatar} />
              ) : (
                <View style={styles.selectedAvatarPlaceholder}>
                  <Icon name="person" size={22} color="#64748b" />
                </View>
              )}
              <View style={styles.selectedTraineeInfo}>
                <Text style={styles.infoRow}>الاسم: {selectedTrainee.nameAr}</Text>
                <Text style={styles.infoRow}>الرقم القومي: {selectedTrainee.nationalId}</Text>
                <Text style={styles.infoRow}>البرنامج الحالي: {selectedTrainee.program?.nameAr}</Text>
                <Text style={styles.infoRow}>المديونية: {selectedTrainee.totalDebt || 0} ج.م</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>اختيار البرنامج الجديد</Text>
          {!selectedTrainee ? (
            <Text style={styles.helperText}>اختر متدربا أولا</Text>
          ) : (
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowProgramPicker(true)}
              activeOpacity={0.8}>
              <Text style={selectedProgram ? styles.selectValue : styles.selectPlaceholder}>
                {selectedProgram ? selectedProgram.nameAr : 'اختر البرنامج الجديد'}
              </Text>
              <Icon name="arrow-drop-down" size={22} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {selectedTrainee && selectedProgramId && !showReviewBox && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openReview}
            disabled={transferring}>
            <Text style={styles.primaryButtonText}>تحويل المتدرب</Text>
          </TouchableOpacity>
        )}

        {showReviewBox && selectedTrainee && selectedProgram && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>تأكيد تحويل المتدرب</Text>
            <Text style={styles.warningText}>المتدرب: {selectedTrainee.nameAr}</Text>
            <Text style={styles.warningText}>من البرنامج: {selectedTrainee.program.nameAr}</Text>
            <Text style={styles.warningText}>إلى البرنامج: {selectedProgram.nameAr}</Text>

            {(selectedTrainee.totalDebt || 0) > 0 && (
              <View style={styles.switchRow}>
                <Switch
                  value={deleteOldDebt}
                  onValueChange={setDeleteOldDebt}
                  trackColor={{ false: '#cbd5e1', true: '#f97316' }}
                  thumbColor="#ffffff"
                />
                <Text style={styles.switchText}>حذف المديونية القديمة قبل التحويل</Text>
              </View>
            )}

            <View style={styles.warningActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionProceed]}
                onPress={openFinalConfirmation}
                disabled={transferring}>
                <Text style={styles.actionProceedText}>متابعة للتأكيد النهائي</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionCancel]}
                onPress={() => setShowReviewBox(false)}
                disabled={transferring}>
                <Text style={styles.actionCancelText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={showFinalModal} transparent animationType="fade" onRequestClose={() => setShowFinalModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تأكيد التحويل النهائي</Text>
            <Text style={styles.modalMessage}>هذا الإجراء لا يمكن التراجع عنه</Text>
            {confirmTimer > 0 ? (
              <Text style={styles.timerText}>انتظر {confirmTimer} ثانية للتأكيد...</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setShowFinalModal(false);
                  setConfirmTimer(5);
                }}
                disabled={transferring}>
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirm,
                  (confirmTimer > 0 || transferring) && styles.modalConfirmDisabled,
                ]}
                onPress={handleConfirmTransfer}
                disabled={confirmTimer > 0 || transferring}>
                <Text style={styles.modalConfirmText}>{transferring ? 'جاري التحويل...' : 'تأكيد التحويل'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showProgramPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgramPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <Text style={styles.modalTitle}>اختيار البرنامج الجديد</Text>

            <ScrollView style={styles.programPickerList}>
              {availablePrograms.length === 0 ? (
                <Text style={styles.helperText}>لا توجد برامج متاحة للتحويل</Text>
              ) : (
                availablePrograms.map(program => {
                  const selected = selectedProgramId === program.id;
                  return (
                    <TouchableOpacity
                      key={program.id}
                      style={[styles.programItem, selected && styles.programItemSelected]}
                      onPress={() => {
                        setSelectedProgramId(program.id);
                        setShowReviewBox(false);
                        setShowProgramPicker(false);
                      }}>
                      <Text style={[styles.programText, selected && styles.programTextSelected]}>
                        {program.nameAr}
                      </Text>
                      {selected ? <Icon name="check" size={18} color="#047857" /> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancel, { marginTop: 10 }]}
              onPress={() => setShowProgramPicker(false)}>
              <Text style={styles.modalCancelText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6fa' },
  loadingText: { marginTop: 12, color: '#475569' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 108,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a237e' },
  headerSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 28 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    marginBottom: 8,
  },
  helperText: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  listContainer: {
    maxHeight: 320,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  listItemSelected: { backgroundColor: '#eef2ff' },
  listItemMain: { flex: 1 },
  traineeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
  },
  traineeAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  listItemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgeDebt: { backgroundColor: '#fee2e2' },
  badgePaidText: { color: '#166534', fontSize: 11, fontWeight: '700' },
  badgeDebtText: { color: '#b91c1c', fontSize: 11, fontWeight: '700' },
  selectedTraineeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectedTraineeInfo: {
    flex: 1,
  },
  selectedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  selectedAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: { color: '#334155', marginBottom: 6 },
  selectBox: {
    height: 46,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectPlaceholder: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  selectValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  programItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programItemSelected: { backgroundColor: '#ecfdf5' },
  programText: { color: '#334155', fontWeight: '600' },
  programTextSelected: { color: '#047857' },
  primaryButton: {
    backgroundColor: '#ea580c',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  warningCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 14,
  },
  warningTitle: { color: '#9a3412', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  warningText: { color: '#9a3412', marginBottom: 5 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  switchText: { flex: 1, color: '#7c2d12', fontSize: 13 },
  warningActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionProceed: { backgroundColor: '#ea580c' },
  actionProceedText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  actionCancel: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1' },
  actionCancelText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  pickerModalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  programPickerList: {
    maxHeight: 360,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  modalMessage: { color: '#64748b', textAlign: 'center', marginBottom: 10 },
  timerText: { textAlign: 'center', color: '#1d4ed8', fontWeight: '700', marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalButton: { flex: 1, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  modalCancel: { borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#ffffff' },
  modalConfirm: { backgroundColor: '#ea580c' },
  modalConfirmDisabled: { opacity: 0.5 },
  modalCancelText: { color: '#334155', fontWeight: '700' },
  modalConfirmText: { color: '#ffffff', fontWeight: '700' },
});

export default TraineeTransferScreen;

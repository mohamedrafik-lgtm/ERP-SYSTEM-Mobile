import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import ArabicSearchInput from '../components/ArabicSearchInput';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';

interface ProgramItem {
  id: number;
  nameAr: string;
}

interface TraineeItem {
  id: number;
  nameAr: string;
  nameEn?: string;
  nationalId: string;
  photoUrl?: string | null;
  photo?: string | null;
  phone?: string;
  traineeStatus?: string;
  programId: number;
  program?: {
    id: number;
    nameAr: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TransferChoice {
  assignmentId: string;
  distributionId: string;
  distributionType: string;
  sourceRoomName: string;
  targetRooms: Array<{
    id: string;
    roomName: string;
    assignedCount: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  GRADUATED: 'متخرج',
  WITHDRAWN: 'منسحب',
  SUSPENDED: 'موقوف',
};

const DistributionStudentsManagementScreen = ({ navigation }: any) => {
  const { canEdit } = usePermissions();
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [trainees, setTrainees] = useState<TraineeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [programFilter, setProgramFilter] = useState<number | undefined>(undefined);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeItem | null>(null);
  const [transferChoices, setTransferChoices] = useState<TransferChoice[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedTargetRoomId, setSelectedTargetRoomId] = useState<string>('');
  const [loadingTransferData, setLoadingTransferData] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const canEditDistribution = canEdit('dashboard.trainees.distribution');

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    loadTrainees(1);
  }, [debouncedSearch, programFilter]);

  const loadPrograms = async () => {
    try {
      const data = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
    }
  };

  const loadTrainees = async (page: number) => {
    try {
      setLoading(true);

      const response = await AuthService.getTrainees({
        page,
        limit: pagination.limit,
        search: debouncedSearch || undefined,
        programId: programFilter ? String(programFilter) : undefined,
      });

      setTrainees(response?.data || []);
      setPagination(
        response?.pagination || {
          page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (error: any) {
      console.error('Error loading trainees:', error);
      setTrainees([]);
      setPagination({ page: 1, limit: pagination.limit, total: 0, totalPages: 0 });
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل المتدربين',
        text2: error?.message || 'تعذر جلب البيانات',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrainees(pagination.page || 1);
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'غير محدد';
    return STATUS_LABELS[status] || status;
  };

  const selectedAssignment = useMemo(() => {
    return transferChoices.find(item => item.assignmentId === selectedAssignmentId) || null;
  }, [transferChoices, selectedAssignmentId]);

  const resetTransferState = () => {
    setTransferModalVisible(false);
    setSelectedTrainee(null);
    setTransferChoices([]);
    setSelectedAssignmentId('');
    setSelectedTargetRoomId('');
    setLoadingTransferData(false);
    setSubmittingTransfer(false);
  };

  const openTransferModal = async (trainee: TraineeItem) => {
    try {
      setSelectedTrainee(trainee);
      setTransferModalVisible(true);
      setLoadingTransferData(true);
      setTransferChoices([]);
      setSelectedAssignmentId('');
      setSelectedTargetRoomId('');

      let distributions: any[] = [];
      try {
        distributions = await AuthService.getActiveTraineeDistributions(trainee.programId);
      } catch {
        distributions = await AuthService.getTraineeDistributions({ programId: trainee.programId });
      }

      if (!Array.isArray(distributions) || distributions.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'لا توجد توزيعات متاحة',
          text2: 'لا يوجد توزيع لهذا البرنامج حالياً',
          position: 'bottom',
        });
        resetTransferState();
        return;
      }

      const details = await Promise.all(
        distributions.map((d: any) => AuthService.getTraineeDistribution(String(d.id))),
      );

      const choices: TransferChoice[] = [];

      details.forEach((dist: any) => {
        const rooms = Array.isArray(dist?.rooms) ? dist.rooms : [];

        rooms.forEach((room: any) => {
          const assignments = Array.isArray(room?.assignments) ? room.assignments : [];
          const matchedAssignment = assignments.find((a: any) => Number(a?.traineeId) === Number(trainee.id));

          if (!matchedAssignment) {
            return;
          }

          const targetRooms = rooms
            .filter((r: any) => r?.id !== room?.id)
            .map((r: any) => ({
              id: String(r.id),
              roomName: r.roomName,
              assignedCount: Array.isArray(r.assignments) ? r.assignments.length : 0,
            }));

          if (targetRooms.length > 0) {
            choices.push({
              assignmentId: String(matchedAssignment.id),
              distributionId: String(dist.id),
              distributionType: dist.type === 'THEORY' ? 'نظري' : 'عملي',
              sourceRoomName: room.roomName,
              targetRooms,
            });
          }
        });
      });

      if (choices.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'لا توجد خيارات نقل',
          text2: 'المتدرب غير موزع أو لا توجد مجموعات بديلة متاحة',
          position: 'bottom',
        });
        resetTransferState();
        return;
      }

      setTransferChoices(choices);
      setSelectedAssignmentId(choices[0].assignmentId);
    } catch (error: any) {
      console.error('Error preparing transfer:', error);
      Toast.show({
        type: 'error',
        text1: 'تعذر تجهيز التحويل',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
      resetTransferState();
    } finally {
      setLoadingTransferData(false);
    }
  };

  const submitTransfer = async () => {
    if (!selectedAssignmentId || !selectedTargetRoomId) {
      Toast.show({
        type: 'info',
        text1: 'اختر المجموعة المستهدفة',
        text2: 'يجب تحديد مجموعة قبل الحفظ',
        position: 'bottom',
      });
      return;
    }

    try {
      setSubmittingTransfer(true);
      await AuthService.updateTraineeDistributionAssignment(selectedAssignmentId, {
        roomId: selectedTargetRoomId,
      });

      Toast.show({
        type: 'success',
        text1: 'تم نقل المتدرب بنجاح',
        position: 'bottom',
      });

      resetTransferState();
      loadTrainees(pagination.page || 1);
    } catch (error: any) {
      console.error('Transfer failed:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل نقل المتدرب',
        text2: error?.message || 'حاول مرة أخرى',
        position: 'bottom',
      });
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const programOptions = [
    { value: undefined, label: 'جميع البرامج' },
    ...programs.map((p) => ({ value: p.id, label: p.nameAr })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DistributionStudentsManagement" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>إدارة التوزيع</Text>
          <Text style={styles.subtitle}>إدارة المتدربين والتحويل بين مجموعات التوزيع</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
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
        <View style={styles.filterCard}>
          <ArabicSearchInput
            placeholder="ابحث بالاسم أو رقم الهوية"
            value={searchText}
            onChangeText={setSearchText}
            onSearch={() => setDebouncedSearch(searchText.trim())}
            style={{ marginBottom: 0 }}
          />

          <SelectBox
            label="البرنامج التدريبي"
            selectedValue={programFilter}
            onValueChange={setProgramFilter}
            items={programOptions}
            placeholder="اختر البرنامج"
          />

          <View style={styles.filterFooter}>
            <Text style={styles.totalText}>إجمالي النتائج: {pagination.total}</Text>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setProgramFilter(undefined);
                setSearchText('');
                setDebouncedSearch('');
              }}
            >
              <Text style={styles.clearBtnText}>مسح الفلاتر</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل المتدربين...</Text>
          </View>
        ) : trainees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="groups" size={56} color="#9ca3af" />
            <Text style={styles.emptyTitle}>لا توجد بيانات</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على متدربين بهذه المعايير</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {trainees.map((trainee, index) => (
              <View key={trainee.id} style={styles.traineeCard}>
                <View style={styles.traineeHead}>
                  <View style={styles.traineeProfileRow}>
                    {trainee.photoUrl || trainee.photo ? (
                      <Image
                        source={{ uri: (trainee.photoUrl || trainee.photo) as string }}
                        style={styles.traineeAvatar}
                      />
                    ) : (
                      <View style={styles.traineeAvatarPlaceholder}>
                        <Text style={styles.traineeAvatarPlaceholderText}>
                          {trainee.nameAr?.trim()?.charAt(0) || 'م'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.traineeNameBlock}>
                      <Text style={styles.traineeName}>{trainee.nameAr}</Text>
                      {trainee.nameEn ? <Text style={styles.traineeNameEn}>{trainee.nameEn}</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.indexText}>#{(pagination.page - 1) * pagination.limit + index + 1}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>الهوية:</Text>
                  <Text style={styles.metaValue}>{trainee.nationalId || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>البرنامج:</Text>
                  <Text style={styles.metaValue}>{trainee.program?.nameAr || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>الجوال:</Text>
                  <Text style={styles.metaValue}>{trainee.phone || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>الحالة:</Text>
                  <Text style={styles.statusBadge}>{getStatusLabel(trainee.traineeStatus)}</Text>
                </View>

                <View style={styles.actionsRow}>
                  {canEditDistribution && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => openTransferModal(trainee)}
                    >
                      <Icon name="swap-horiz" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>تحويل</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, pagination.page <= 1 && styles.pageBtnDisabled]}
            disabled={pagination.page <= 1}
            onPress={() => loadTrainees(pagination.page - 1)}
          >
            <Text style={[styles.pageBtnText, pagination.page <= 1 && styles.pageBtnTextDisabled]}>السابق</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            صفحة {pagination.page} من {Math.max(1, pagination.totalPages || 1)}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, pagination.page >= (pagination.totalPages || 1) && styles.pageBtnDisabled]}
            disabled={pagination.page >= (pagination.totalPages || 1)}
            onPress={() => loadTrainees(pagination.page + 1)}
          >
            <Text style={[styles.pageBtnText, pagination.page >= (pagination.totalPages || 1) && styles.pageBtnTextDisabled]}>التالي</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={transferModalVisible} onRequestClose={resetTransferState}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تحويل المتدرب</Text>
              <TouchableOpacity onPress={resetTransferState}>
                <Icon name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{selectedTrainee?.nameAr || ''}</Text>

            {loadingTransferData ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.modalLoadingText}>جاري تجهيز خيارات التحويل...</Text>
              </View>
            ) : (
              <>
                <SelectBox
                  label="نوع/مصدر التوزيع"
                  selectedValue={selectedAssignmentId}
                  onValueChange={(value) => {
                    setSelectedAssignmentId(value);
                    setSelectedTargetRoomId('');
                  }}
                  items={transferChoices.map((choice) => ({
                    value: choice.assignmentId,
                    label: `${choice.distributionType} - ${choice.sourceRoomName}`,
                  }))}
                  placeholder="اختر التوزيع"
                />

                <SelectBox
                  label="المجموعة المستهدفة"
                  selectedValue={selectedTargetRoomId}
                  onValueChange={setSelectedTargetRoomId}
                  items={(selectedAssignment?.targetRooms || []).map((room) => ({
                    value: room.id,
                    label: `${room.roomName} (${room.assignedCount})`,
                  }))}
                  placeholder="اختر المجموعة"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetTransferState}>
                    <Text style={styles.cancelBtnText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, submittingTransfer && styles.confirmBtnDisabled]}
                    disabled={submittingTransfer}
                    onPress={submitTransfer}
                  >
                    {submittingTransfer ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>تنفيذ التحويل</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Toast />
    </View>
  );
};

export default DistributionStudentsManagementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1, marginHorizontal: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  content: { flex: 1, padding: 16 },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  filterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  clearBtnText: { color: '#2563eb', fontWeight: '700' },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: { marginTop: 8, color: '#64748b' },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: { marginTop: 8, fontSize: 17, fontWeight: '700', color: '#334155' },
  emptySubtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
  listContainer: { gap: 10 },
  traineeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  traineeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  traineeProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  traineeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  traineeAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
    marginRight: 10,
  },
  traineeAvatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  traineeNameBlock: {
    flex: 1,
  },
  traineeName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  traineeNameEn: { fontSize: 12, color: '#94a3b8' },
  indexText: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  metaLabel: { fontSize: 13, color: '#64748b' },
  metaValue: { fontSize: 13, color: '#334155', fontWeight: '600', maxWidth: '68%' },
  statusBadge: {
    fontSize: 12,
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '700',
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  paginationRow: {
    marginTop: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageBtn: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pageBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  pageBtnText: { color: '#1e293b', fontWeight: '700' },
  pageBtnTextDisabled: { color: '#94a3b8' },
  pageIndicator: { color: '#475569', fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalSubtitle: { marginTop: 6, marginBottom: 8, color: '#64748b', fontWeight: '600' },
  modalLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modalLoadingText: { color: '#64748b' },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelBtnText: { color: '#334155', fontWeight: '700' },
  confirmBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});

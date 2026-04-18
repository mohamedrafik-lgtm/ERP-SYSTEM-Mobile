import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import DateTimePickerField from '../components/DateTimePickerField';
import AuthService from '../services/AuthService';
import {
  StaffLeaveStatus,
  StaffLeaveStatusArabic,
  StaffLeaveType,
  StaffLeaveTypeArabic,
  type StaffLeaveRequest,
} from '../types/staffAttendance';

const LEAVE_TYPES = [
  StaffLeaveType.ANNUAL,
  StaffLeaveType.SICK,
  StaffLeaveType.PERSONAL,
  StaffLeaveType.EMERGENCY,
  StaffLeaveType.OTHER,
];

const MyLeaveRequestsScreen = ({ navigation }: any) => {
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<StaffLeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    leaveType: StaffLeaveType.ANNUAL as StaffLeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });

  const checkEnrollment = useCallback(async () => {
    try {
      setCheckingEnrollment(true);
      const status = await AuthService.getMyAttendanceStatus();
      setIsEnrolled(status?.isEnrolled === true);
    } catch {
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    if (!isEnrolled) {
      setRequests([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const data = await AuthService.getMyLeaveRequests(statusFilter || undefined);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setRequests(list);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'تعذر تحميل طلبات الإجازة',
        text2: error?.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEnrolled, statusFilter]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  useEffect(() => {
    if (!checkingEnrollment) {
      loadRequests();
    }
  }, [checkingEnrollment, loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === StaffLeaveStatus.PENDING).length,
      approved: requests.filter((r) => r.status === StaffLeaveStatus.APPROVED).length,
      rejected: requests.filter((r) => r.status === StaffLeaveStatus.REJECTED).length,
    };
  }, [requests]);

  const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

  const handleCreate = async () => {
    if (!isValidDate(form.startDate) || !isValidDate(form.endDate)) {
      Toast.show({ type: 'error', text1: 'تحقق من التاريخ', text2: 'يرجى اختيار تاريخ البداية والنهاية' });
      return;
    }

    if (new Date(form.startDate).getTime() > new Date(form.endDate).getTime()) {
      Toast.show({ type: 'error', text1: 'تحقق من التاريخ', text2: 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية' });
      return;
    }

    if (!form.reason.trim()) {
      Toast.show({ type: 'error', text1: 'السبب مطلوب', text2: 'يرجى كتابة سبب طلب الإجازة' });
      return;
    }

    try {
      setCreating(true);
      await AuthService.createLeaveRequest({
        leaveType: form.leaveType,
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        reason: form.reason.trim(),
      });

      Toast.show({ type: 'success', text1: 'تم إرسال الطلب بنجاح' });
      setShowCreateModal(false);
      setForm({ leaveType: StaffLeaveType.ANNUAL, startDate: '', endDate: '', reason: '' });
      loadRequests();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'تعذر إرسال الطلب', text2: error?.message || 'حدث خطأ غير متوقع' });
    } finally {
      setCreating(false);
    }
  };

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MyLeaveRequests" />
        <Text style={styles.headerTitle}>طلبات إجازاتي</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {checkingEnrollment ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.centerText}>جارٍ التحقق من صلاحية العرض...</Text>
        </View>
      ) : !isEnrolled ? (
        <View style={styles.centerBox}>
          <Icon name="block" size={42} color="#ef4444" />
          <Text style={styles.noAccessTitle}>غير متاح</Text>
          <Text style={styles.noAccessText}>هذه الصفحة تظهر فقط للموظف المسجل في نظام الحضور.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>الإجمالي</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.pending}</Text><Text style={styles.statLabel}>قيد المراجعة</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.approved}</Text><Text style={styles.statLabel}>موافق</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.rejected}</Text><Text style={styles.statLabel}>مرفوض</Text></View>
          </View>

          <View style={styles.filtersRow}>
            {[
              { value: '', label: 'الكل' },
              { value: StaffLeaveStatus.PENDING, label: StaffLeaveStatusArabic[StaffLeaveStatus.PENDING] },
              { value: StaffLeaveStatus.APPROVED, label: StaffLeaveStatusArabic[StaffLeaveStatus.APPROVED] },
              { value: StaffLeaveStatus.REJECTED, label: StaffLeaveStatusArabic[StaffLeaveStatus.REJECTED] },
            ].map((f) => (
              <TouchableOpacity
                key={f.value || 'all'}
                onPress={() => setStatusFilter(f.value)}
                style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === f.value && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.centerInline}><ActivityIndicator size="small" color="#1a237e" /></View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="event-busy" size={30} color="#9ca3af" />
              <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
              <Text style={styles.emptyText}>يمكنك تقديم طلب إجازة جديد من زر الإضافة.</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {requests.map((request) => {
                const typeLabel = StaffLeaveTypeArabic[request.leaveType as StaffLeaveType] || request.leaveType;
                const statusLabel = StaffLeaveStatusArabic[request.status as StaffLeaveStatus] || request.status;
                const statusColor =
                  request.status === StaffLeaveStatus.APPROVED
                    ? '#059669'
                    : request.status === StaffLeaveStatus.REJECTED
                    ? '#dc2626'
                    : '#d97706';

                return (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View>
                        <Text style={styles.requestType}>{typeLabel}</Text>
                        <Text style={styles.requestDate}>{fmtDate(request.createdAt)}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.rangeRow}>
                      <Text style={styles.rangeText}>من: {fmtDate(request.startDate)}</Text>
                      <Text style={styles.rangeText}>إلى: {fmtDate(request.endDate)}</Text>
                    </View>

                    <Text style={styles.reasonText}>{request.reason}</Text>

                    {request.reviewNotes ? (
                      <View style={styles.reviewBox}>
                        <Text style={styles.reviewTitle}>ملاحظات المراجعة:</Text>
                        <Text style={styles.reviewText}>{request.reviewNotes}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>طلب إجازة جديد</Text>

            <Text style={styles.inputLabel}>نوع الإجازة</Text>
            <View style={styles.typesRow}>
              {LEAVE_TYPES.map((type) => {
                const selected = form.leaveType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, selected && styles.typeChipActive]}
                    onPress={() => setForm((prev) => ({ ...prev, leaveType: type }))}
                  >
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>{StaffLeaveTypeArabic[type]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DateTimePickerField
              label="تاريخ البداية"
              value={form.startDate}
              onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))}
              placeholder="اختر تاريخ البداية"
              mode="date"
            />

            <DateTimePickerField
              label="تاريخ النهاية"
              value={form.endDate}
              onChange={(value) => setForm((prev) => ({ ...prev, endDate: value }))}
              placeholder="اختر تاريخ النهاية"
              mode="date"
            />

            <Text style={styles.inputLabel}>السبب</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              multiline
              value={form.reason}
              onChangeText={(text) => setForm((prev) => ({ ...prev, reason: text }))}
              placeholder="اكتب سبب الإجازة"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)} disabled={creating}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>إرسال الطلب</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MyLeaveRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a237e' },
  addBtn: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a237e' },
  content: { flex: 1, padding: 16 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  centerText: { marginTop: 10, color: '#6b7280', fontSize: 13 },
  noAccessTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12 },
  noAccessText: { textAlign: 'center', color: '#6b7280', marginTop: 6, fontSize: 13 },
  backBtn: { marginTop: 16, backgroundColor: '#1a237e', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  centerInline: { backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1a237e' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  filterChipTextActive: { color: '#fff' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 24, alignItems: 'center' },
  emptyTitle: { marginTop: 8, fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 4, color: '#6b7280', textAlign: 'center', fontSize: 12 },
  listWrap: { gap: 10 },
  requestCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestType: { fontSize: 14, fontWeight: '800', color: '#111827' },
  requestDate: { marginTop: 2, fontSize: 11, color: '#6b7280' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  rangeRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  reasonText: { marginTop: 10, fontSize: 12, color: '#374151', lineHeight: 18 },
  reviewBox: { marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f8fafc', padding: 8 },
  reviewTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 2 },
  reviewText: { fontSize: 12, color: '#374151' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: { height: 42, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, fontSize: 13, color: '#111827' },
  reasonInput: { height: 84, textAlignVertical: 'top', paddingTop: 10 },
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  typeChipActive: { backgroundColor: '#eef2ff', borderColor: '#1a237e' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  typeChipTextActive: { color: '#1a237e' },
  modalActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: '#fff' },
  cancelBtnText: { color: '#4b5563', fontWeight: '700' },
  submitBtn: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', height: 42, backgroundColor: '#1a237e' },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});

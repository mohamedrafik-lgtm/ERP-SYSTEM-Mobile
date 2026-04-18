import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

interface OvertimeRequest {
  id: string;
  date?: string;
  startTime: string;
  endTime?: string | null;
  totalMinutes?: number;
  reason?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  createdAt?: string;
  reviewNotes?: string | null;
}

const MyOvertimeRequestsScreen = ({ navigation }: any) => {
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [activeSession, setActiveSession] = useState<OvertimeRequest | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const loadData = useCallback(async () => {
    if (!isEnrolled) {
      setRequests([]);
      setActiveSession(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const [requestsData, activeData] = await Promise.all([
        AuthService.getMyOvertimeRequests(),
        AuthService.getActiveOvertimeSession().catch(() => null),
      ]);

      const list = Array.isArray(requestsData)
        ? requestsData
        : Array.isArray(requestsData?.data)
        ? requestsData.data
        : [];
      setRequests(list);

      if (activeData?.id && activeData?.startTime && !activeData?.endTime) {
        setActiveSession(activeData);
      } else {
        setActiveSession(null);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'تعذر تحميل الأوقات الإضافية',
        text2: error?.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEnrolled]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  useEffect(() => {
    if (!checkingEnrollment) {
      loadData();
    }
  }, [checkingEnrollment, loadData]);

  useEffect(() => {
    if (!activeSession?.startTime) {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000));
      setElapsed(diff);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession?.startTime]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const fmtElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fmtDate = (date?: string) => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fmtTime = (iso?: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const fmtMins = (mins?: number) => {
    if (!mins || mins <= 0) return '0 د';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}س ${m}د` : `${m}د`;
  };

  const handleStart = async () => {
    if (!reason.trim()) {
      Toast.show({ type: 'error', text1: 'سبب الوقت الإضافي مطلوب' });
      return;
    }

    try {
      setSubmitting(true);
      const started = await AuthService.startOvertimeSession(reason.trim());
      setActiveSession(started);
      setReason('');
      setShowReasonInput(false);
      Toast.show({ type: 'success', text1: 'تم بدء الوقت الإضافي' });
      loadData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'تعذر البدء', text2: error?.message || 'حدث خطأ غير متوقع' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    if (!activeSession) return;

    try {
      setSubmitting(true);
      await AuthService.endOvertimeSession(activeSession.id);
      setActiveSession(null);
      Toast.show({ type: 'success', text1: 'تم إنهاء الوقت الإضافي' });
      loadData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'تعذر الإنهاء', text2: error?.message || 'حدث خطأ غير متوقع' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('حذف الطلب', 'هل تريد حذف سجل الوقت الإضافي هذا؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deleteOvertimeRequest(id);
            Toast.show({ type: 'success', text1: 'تم حذف الطلب' });
            loadData();
          } catch (error: any) {
            Toast.show({ type: 'error', text1: 'تعذر الحذف', text2: error?.message || 'حدث خطأ غير متوقع' });
          }
        },
      },
    ]);
  };

  const completedRequests = useMemo(() => requests.filter((r) => !!r.endTime), [requests]);

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return completedRequests;
    return completedRequests.filter((r) => r.status === statusFilter);
  }, [completedRequests, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: completedRequests.length,
      pending: completedRequests.filter((r) => r.status === 'PENDING').length,
      approved: completedRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: completedRequests.filter((r) => r.status === 'REJECTED').length,
      approvedMinutes: completedRequests
        .filter((r) => r.status === 'APPROVED')
        .reduce((sum, r) => sum + Number(r.totalMinutes || 0), 0),
    };
  }, [completedRequests]);

  const getStatusLabel = (status?: string) => {
    if (status === 'APPROVED') return 'موافق';
    if (status === 'REJECTED') return 'مرفوض';
    return 'قيد المراجعة';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'APPROVED') return '#059669';
    if (status === 'REJECTED') return '#dc2626';
    return '#d97706';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MyOvertimeRequests" />
        <Text style={styles.headerTitle}>أوقاتي الإضافية</Text>
        <View style={styles.placeholder} />
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
          <View style={styles.liveCard}>
            {activeSession ? (
              <>
                <View style={styles.liveHeader}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTitle}>جلسة وقت إضافي جارية</Text>
                </View>
                <Text style={styles.timerValue}>{fmtElapsed(elapsed)}</Text>
                <Text style={styles.timerSub}>بدأت عند {fmtTime(activeSession.startTime)}</Text>
                {!!activeSession.reason && <Text style={styles.reasonText}>{activeSession.reason}</Text>}

                <TouchableOpacity style={styles.endBtn} onPress={handleEnd} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.endBtnText}>إنهاء الوقت الإضافي</Text>}
                </TouchableOpacity>
              </>
            ) : showReasonInput ? (
              <>
                <Text style={styles.liveTitle}>بدء وقت إضافي جديد</Text>
                <TextInput
                  style={styles.reasonInput}
                  multiline
                  value={reason}
                  onChangeText={setReason}
                  placeholder="سبب الوقت الإضافي"
                  placeholderTextColor="#9ca3af"
                />
                <View style={styles.reasonActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReasonInput(false)} disabled={submitting}>
                    <Text style={styles.cancelBtnText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={submitting}>
                    {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.startBtnText}>بدء</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.liveTitle}>لا توجد جلسة جارية</Text>
                <Text style={styles.liveHint}>يمكنك بدء تتبع الوقت الإضافي الآن.</Text>
                <TouchableOpacity style={styles.startOnlyBtn} onPress={() => setShowReasonInput(true)}>
                  <Text style={styles.startOnlyBtnText}>بدء وقت إضافي</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>الإجمالي</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.pending}</Text><Text style={styles.statLabel}>قيد المراجعة</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.approved}</Text><Text style={styles.statLabel}>موافق</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{fmtMins(stats.approvedMinutes)}</Text><Text style={styles.statLabel}>المعتمد</Text></View>
          </View>

          <View style={styles.filtersRow}>
            {[
              { value: '', label: 'الكل' },
              { value: 'PENDING', label: 'قيد المراجعة' },
              { value: 'APPROVED', label: 'موافق' },
              { value: 'REJECTED', label: 'مرفوض' },
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
          ) : filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="timer-off" size={30} color="#9ca3af" />
              <Text style={styles.emptyTitle}>لا توجد سجلات وقت إضافي</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredRequests.map((request) => {
                const statusColor = getStatusColor(request.status);
                return (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestDate}>{fmtDate(request.date || request.createdAt)}</Text>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(request.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.timesRow}>
                      <Text style={styles.timeText}>بداية: {fmtTime(request.startTime)}</Text>
                      <Text style={styles.timeText}>نهاية: {fmtTime(request.endTime)}</Text>
                      <Text style={styles.timeText}>المدة: {fmtMins(request.totalMinutes)}</Text>
                    </View>

                    {!!request.reason && <Text style={styles.reasonHistory}>{request.reason}</Text>}
                    {!!request.reviewNotes && <Text style={styles.reviewNotes}>ملاحظة المراجعة: {request.reviewNotes}</Text>}

                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(request.id)}>
                        <Icon name="delete" size={16} color="#dc2626" />
                        <Text style={styles.deleteBtnText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MyOvertimeRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a237e' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  centerText: { marginTop: 10, color: '#6b7280', fontSize: 13 },
  noAccessTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12 },
  noAccessText: { textAlign: 'center', color: '#6b7280', marginTop: 6, fontSize: 13 },
  backBtn: { marginTop: 16, backgroundColor: '#1a237e', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  liveCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#fde68a', padding: 14, marginBottom: 12 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f59e0b', marginRight: 7 },
  liveTitle: { fontSize: 15, fontWeight: '800', color: '#92400e', textAlign: 'center' },
  timerValue: { marginTop: 10, textAlign: 'center', fontSize: 32, fontWeight: '900', color: '#b45309', letterSpacing: 1 },
  timerSub: { marginTop: 4, textAlign: 'center', fontSize: 12, color: '#6b7280' },
  reasonText: { marginTop: 8, textAlign: 'center', fontSize: 12, color: '#374151' },
  liveHint: { marginTop: 4, textAlign: 'center', color: '#6b7280', fontSize: 12 },
  startOnlyBtn: { marginTop: 12, alignSelf: 'center', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1a237e' },
  startOnlyBtnText: { color: '#fff', fontWeight: '700' },
  reasonInput: { marginTop: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 10, paddingTop: 8, textAlignVertical: 'top', minHeight: 82, fontSize: 13, color: '#111827', backgroundColor: '#fff' },
  reasonActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  cancelBtnText: { color: '#4b5563', fontWeight: '700' },
  startBtn: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a237e' },
  startBtnText: { color: '#fff', fontWeight: '700' },
  endBtn: { marginTop: 12, borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626' },
  endBtnText: { color: '#fff', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statValue: { fontSize: 15, fontWeight: '800', color: '#1a237e' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  filterChipTextActive: { color: '#fff' },
  centerInline: { backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 24, alignItems: 'center' },
  emptyTitle: { marginTop: 8, fontSize: 15, fontWeight: '700', color: '#111827' },
  listWrap: { gap: 10 },
  requestCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestDate: { fontSize: 13, fontWeight: '700', color: '#111827' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  timesRow: { marginTop: 10, gap: 3 },
  timeText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  reasonHistory: { marginTop: 8, fontSize: 12, color: '#374151' },
  reviewNotes: { marginTop: 6, fontSize: 11, color: '#6b7280' },
  actionsRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnText: { marginLeft: 4, color: '#dc2626', fontSize: 12, fontWeight: '700' },
});

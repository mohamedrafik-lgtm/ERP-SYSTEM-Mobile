import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { StaffAttendanceStatusArabic, StaffAttendanceStatusColor } from '../types/staffAttendance';

interface AttendanceLog {
  id: string;
  date: string;
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workedMinutes?: number | null;
  overtimeMinutes?: number | null;
  isLate?: boolean;
  isEarlyLeave?: boolean;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
}

const PAGE_SIZE = 20;

const MyAttendanceLogsScreen = ({ navigation }: any) => {
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  const loadLogs = useCallback(async () => {
    if (!isEnrolled) {
      setLogs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const data = await AuthService.getMyAttendanceLogs({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
      });

      const resolvedLogs = Array.isArray(data)
        ? data
        : Array.isArray(data?.logs)
        ? data.logs
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const resolvedTotal = Number(data?.total ?? data?.pagination?.total ?? resolvedLogs.length);
      setLogs(resolvedLogs);
      setTotal(Number.isFinite(resolvedTotal) ? resolvedTotal : resolvedLogs.length);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'تعذر تحميل سجل الحضور',
        text2: error?.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEnrolled, page, statusFilter]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  useEffect(() => {
    if (!checkingEnrollment) {
      loadLogs();
    }
  }, [checkingEnrollment, loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const stats = useMemo(() => {
    return {
      present: logs.filter((l) => l.status === 'PRESENT').length,
      absent: logs.filter((l) => l.status === 'ABSENT_UNEXCUSED' || l.status === 'ABSENT').length,
      late: logs.filter((l) => l.status === 'LATE').length,
      overtimeMinutes: logs.reduce((sum, l) => sum + Number(l.overtimeMinutes || 0), 0),
    };
  }, [logs]);

  const fmtDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const fmtTime = (iso?: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fmtMins = (mins?: number | null) => {
    if (!mins || mins <= 0) return '0 د';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}س ${m}د` : `${m}د`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MyAttendanceLogs" />
        <Text style={styles.headerTitle}>سجل حضوري</Text>
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
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.present}</Text><Text style={styles.statLabel}>حاضر</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.absent}</Text><Text style={styles.statLabel}>غياب</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.late}</Text><Text style={styles.statLabel}>تأخير</Text></View>
            <View style={styles.statCard}><Text style={styles.statValue}>{fmtMins(stats.overtimeMinutes)}</Text><Text style={styles.statLabel}>وقت إضافي</Text></View>
          </View>

          <View style={styles.filtersRow}>
            {[
              { value: '', label: 'الكل' },
              { value: 'PRESENT', label: 'حاضر' },
              { value: 'ABSENT_UNEXCUSED', label: 'غائب' },
              { value: 'LATE', label: 'متأخر' },
              { value: 'EARLY_LEAVE', label: 'انصراف مبكر' },
              { value: 'LEAVE', label: 'إذن' },
            ].map((f) => (
              <TouchableOpacity
                key={f.value || 'all'}
                onPress={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
                style={[styles.filterChip, statusFilter === f.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === f.value && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.centerInline}><ActivityIndicator size="small" color="#1a237e" /></View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="event-note" size={30} color="#9ca3af" />
              <Text style={styles.emptyTitle}>لا توجد سجلات</Text>
              <Text style={styles.emptyText}>ستظهر هنا سجلات حضورك اليومية بعد التسجيل.</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {logs.map((log) => {
                const statusLabel = StaffAttendanceStatusArabic[log.status] || log.status;
                const statusColor = StaffAttendanceStatusColor[log.status] || '#6b7280';
                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logDate}>{fmtDate(log.date)}</Text>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.timesRow}>
                      <View style={styles.timeBox}>
                        <Icon name="login" size={15} color="#16a34a" />
                        <Text style={styles.timeLabel}>دخول</Text>
                        <Text style={styles.timeValue}>{fmtTime(log.checkInTime)}</Text>
                      </View>
                      <View style={styles.timeBox}>
                        <Icon name="logout" size={15} color="#dc2626" />
                        <Text style={styles.timeLabel}>خروج</Text>
                        <Text style={styles.timeValue}>{fmtTime(log.checkOutTime)}</Text>
                      </View>
                      <View style={styles.timeBox}>
                        <Icon name="schedule" size={15} color="#2563eb" />
                        <Text style={styles.timeLabel}>العمل</Text>
                        <Text style={styles.timeValue}>{fmtMins(log.workedMinutes)}</Text>
                      </View>
                    </View>

                    {(log.checkInLatitude || log.checkOutLatitude) && (
                      <View style={styles.locationRow}>
                        <Icon name="place" size={14} color="#6b7280" />
                        <Text style={styles.locationText}>تم حفظ موقع تسجيل الحضور/الانصراف</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {totalPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>السابق</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
                  <TouchableOpacity
                    style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                    disabled={page >= totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>التالي</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MyAttendanceLogsScreen;

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
  logCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logDate: { fontSize: 13, fontWeight: '700', color: '#111827' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  timesRow: { flexDirection: 'row', gap: 8 },
  timeBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', paddingVertical: 8 },
  timeLabel: { fontSize: 10, color: '#6b7280', marginTop: 3 },
  timeValue: { fontSize: 12, fontWeight: '700', color: '#111827', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  locationText: { marginLeft: 5, fontSize: 11, color: '#6b7280' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e0e7ff' },
  pageBtnDisabled: { backgroundColor: '#e5e7eb' },
  pageBtnText: { color: '#1e3a8a', fontWeight: '700', fontSize: 12 },
  pageBtnTextDisabled: { color: '#9ca3af' },
  pageInfo: { fontSize: 12, color: '#374151', fontWeight: '700' },
});

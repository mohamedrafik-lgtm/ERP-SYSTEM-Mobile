import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffAttendanceStatus, StaffAttendanceStatusArabic, StaffAttendanceStatusColor,
  type StaffAttendanceLog,
} from '../types/staffAttendance';

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: StaffAttendanceStatus.PRESENT, label: 'حاضر' },
  { key: StaffAttendanceStatus.ABSENT_UNEXCUSED, label: 'غائب بدون إذن' },
  { key: StaffAttendanceStatus.ABSENT_EXCUSED, label: 'غائب بإذن' },
  { key: StaffAttendanceStatus.LEAVE, label: 'إجازة' },
  { key: StaffAttendanceStatus.DAY_OFF, label: 'يوم عطلة' },
];

const StaffAttendanceLogsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<StaffAttendanceLog[]>([]);
  const [myLogs, setMyLogs] = useState<StaffAttendanceLog[]>([]);
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadData = useCallback(async (reset = true) => {
    try {
      if (reset) setPage(1);
      const currentPage = reset ? 1 : page;

      const [myData, allData] = await Promise.all([
        AuthService.getMyAttendanceLogs({ page: currentPage, limit: 20, status: filter !== 'all' ? filter : undefined }).catch(() => ({ data: [] })),
        AuthService.getStaffAttendanceLogs({ page: currentPage, limit: 20, status: filter !== 'all' ? filter : undefined }).catch(() => ({ data: [] })),
      ]);

      const myArr = Array.isArray(myData) ? myData : (myData?.data || []);
      const allArr = Array.isArray(allData) ? allData : (allData?.data || []);

      if (reset) {
        setMyLogs(myArr);
        setLogs(allArr);
      } else {
        setMyLogs(prev => [...prev, ...myArr]);
        setLogs(prev => [...prev, ...allArr]);
      }
      setHasMore(allArr.length >= 20);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, page]);

  useEffect(() => { loadData(true); }, [filter]);

  const onRefresh = () => { setRefreshing(true); loadData(true); };

  const loadMore = () => {
    if (!hasMore) return;
    setPage(p => p + 1);
    loadData(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMinutes = (mins?: number) => {
    if (!mins) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  };

  const currentLogs = tab === 'my' ? myLogs : logs;
  const filteredLogs = currentLogs.filter(log => {
    if (!search) return true;
    const name = log.user?.name?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceLogs" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>سجل الحضور</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'my' && styles.tabActive]} onPress={() => setTab('my')}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>سجلي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>كل الموظفين</Text>
        </TouchableOpacity>
      </View>

      {/* Search (only for all tab) */}
      {tab === 'all' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث بالاسم..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      )}

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="event-note" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>لا توجد سجلات</Text>
          </View>
        ) : (
          <>
            {filteredLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  {tab === 'all' && (
                    <View style={styles.logAvatar}>
                      <Text style={styles.logAvatarText}>{log.user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {tab === 'all' && <Text style={styles.logName}>{log.user?.name}</Text>}
                    <Text style={styles.logDate}>{formatDate(log.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (StaffAttendanceStatusColor[log.status] || '#6b7280') + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: StaffAttendanceStatusColor[log.status] || '#6b7280' }]} />
                    <Text style={[styles.statusText, { color: StaffAttendanceStatusColor[log.status] || '#6b7280' }]}>
                      {StaffAttendanceStatusArabic[log.status] || log.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.logDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="login" size={14} color="#059669" />
                    <Text style={styles.detailText}>حضور: {formatTime(log.checkInTime)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="logout" size={14} color="#dc2626" />
                    <Text style={styles.detailText}>انصراف: {formatTime(log.checkOutTime)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="schedule" size={14} color="#3b82f6" />
                    <Text style={styles.detailText}>العمل: {formatMinutes(log.workedMinutes)}</Text>
                  </View>
                  {log.overtimeMinutes && log.overtimeMinutes > 0 ? (
                    <View style={styles.detailItem}>
                      <Icon name="more-time" size={14} color="#7c3aed" />
                      <Text style={styles.detailText}>إضافي: {formatMinutes(log.overtimeMinutes)}</Text>
                    </View>
                  ) : null}
                </View>
                {(log.isLate || log.isEarlyLeave) && (
                  <View style={styles.logTags}>
                    {log.isLate && (
                      <View style={[styles.tagChip, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#d97706' }}>
                          متأخر {log.lateMinutes ? `(${log.lateMinutes}د)` : ''}
                        </Text>
                      </View>
                    )}
                    {log.isEarlyLeave && (
                      <View style={[styles.tagChip, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                          انصراف مبكر {log.earlyLeaveMinutes ? `(${log.earlyLeaveMinutes}د)` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {log.notes ? <Text style={styles.logNotes}>📝 {log.notes}</Text> : null}
              </View>
            ))}
            {hasMore && tab === 'all' && (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                <Text style={styles.loadMoreText}>تحميل المزيد</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default StaffAttendanceLogsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1a237e' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#1a237e', fontWeight: '800' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  filterScroll: { maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#1a237e', borderColor: '#1a237e' },
  filterChipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  loadingBox: { alignItems: 'center', padding: 40, gap: 8 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  emptyBox: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },

  logCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  logAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  logAvatarText: { fontSize: 14, fontWeight: '800', color: '#374151' },
  logName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  logDate: { fontSize: 12, color: '#6b7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  logDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  logTags: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  logNotes: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 14, backgroundColor: '#fff', borderRadius: 10, marginTop: 4 },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
});

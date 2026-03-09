import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform, PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffAttendanceStatus, StaffAttendanceStatusArabic, StaffAttendanceStatusColor,
  type MyAttendanceStatus, type StaffAttendanceLog, type StaffAttendanceDashboard,
} from '../types/staffAttendance';

const StaffAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [myStatus, setMyStatus] = useState<MyAttendanceStatus | null>(null);
  const [dashboard, setDashboard] = useState<StaffAttendanceDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, dashData] = await Promise.all([
        AuthService.getMyAttendanceStatus().catch(() => null),
        AuthService.getStaffAttendanceDashboard().catch(() => null),
      ]);
      setMyStatus(statusData);
      setDashboard(dashData);
    } catch (e: any) {
      setError(e?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const getLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise(async (resolve) => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            resolve(null);
            return;
          }
        }
        const Geolocation = require('react-native-geolocation-service').default;
        Geolocation.getCurrentPosition(
          (position: any) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      } catch {
        resolve(null);
      }
    });
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const location = myStatus?.settings?.requireLocation ? await getLocation() : null;
      await AuthService.staffCheckIn({
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      Toast.show({ type: 'success', text1: 'تم تسجيل الحضور', text2: 'تم تسجيل حضورك بنجاح ✅' });
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في تسجيل الحضور');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const location = myStatus?.settings?.requireLocation ? await getLocation() : null;
      await AuthService.staffCheckOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      Toast.show({ type: 'success', text1: 'تم تسجيل الانصراف', text2: 'تم تسجيل انصرافك بنجاح 👋' });
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في تسجيل الانصراف');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMinutes = (mins?: number) => {
    if (!mins) return '0 د';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} س ${m} د`;
    return `${m} د`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="StaffAttendance" />
          <Text style={styles.headerTitle}>الحضور والانصراف</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  const todayLog = myStatus?.todayLog;
  const isCheckedIn = myStatus?.isCheckedIn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendance" />
        <Text style={styles.headerTitle}>الحضور والانصراف</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={[styles.card, styles.errorCard]}>
            <Icon name="error-outline" size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Check-in/out Card */}
        {myStatus?.isEnrolled !== false && (
          <View style={styles.checkInCard}>
            <View style={styles.checkInHeader}>
              <View style={[styles.statusDot, { backgroundColor: isCheckedIn ? '#059669' : '#6b7280' }]} />
              <Text style={styles.checkInTitle}>
                {isCheckedIn ? 'أنت حاضر الآن' : 'لم تسجل حضورك بعد'}
              </Text>
            </View>

            {todayLog && (
              <View style={styles.todayInfo}>
                <View style={styles.timeBox}>
                  <Icon name="login" size={18} color="#059669" />
                  <View>
                    <Text style={styles.timeLabel}>وقت الحضور</Text>
                    <Text style={styles.timeValue}>{formatTime(todayLog.checkInTime)}</Text>
                  </View>
                </View>
                <View style={styles.timeBox}>
                  <Icon name="logout" size={18} color="#dc2626" />
                  <View>
                    <Text style={styles.timeLabel}>وقت الانصراف</Text>
                    <Text style={styles.timeValue}>{formatTime(todayLog.checkOutTime)}</Text>
                  </View>
                </View>
                {todayLog.workedMinutes ? (
                  <View style={styles.timeBox}>
                    <Icon name="schedule" size={18} color="#3b82f6" />
                    <View>
                      <Text style={styles.timeLabel}>ساعات العمل</Text>
                      <Text style={styles.timeValue}>{formatMinutes(todayLog.workedMinutes)}</Text>
                    </View>
                  </View>
                ) : null}
                {todayLog.isLate && (
                  <View style={[styles.tagChip, { backgroundColor: '#fef3c7', borderColor: '#fbbf24' }]}>
                    <Icon name="warning" size={14} color="#d97706" />
                    <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '700' }}>متأخر {todayLog.lateMinutes ? `(${todayLog.lateMinutes} د)` : ''}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.checkInActions}>
              {!isCheckedIn ? (
                <TouchableOpacity
                  style={[styles.checkBtn, styles.checkInBtn]}
                  onPress={handleCheckIn}
                  disabled={checkingIn}
                  activeOpacity={0.8}
                >
                  {checkingIn ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Icon name="login" size={22} color="#fff" />
                      <Text style={styles.checkBtnText}>تسجيل الحضور</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : !todayLog?.checkOutTime ? (
                <TouchableOpacity
                  style={[styles.checkBtn, styles.checkOutBtn]}
                  onPress={handleCheckOut}
                  disabled={checkingOut}
                  activeOpacity={0.8}
                >
                  {checkingOut ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Icon name="logout" size={22} color="#fff" />
                      <Text style={styles.checkBtnText}>تسجيل الانصراف</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.completedBanner}>
                  <Icon name="check-circle" size={20} color="#059669" />
                  <Text style={styles.completedText}>تم تسجيل الحضور والانصراف اليوم</Text>
                </View>
              )}
            </View>

            {myStatus?.settings && (
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleText}>
                  ⏰ مواعيد العمل: {myStatus.settings.workStartTime} - {myStatus.settings.workEndTime}
                </Text>
              </View>
            )}
          </View>
        )}

        {myStatus?.isEnrolled === false && (
          <View style={[styles.card, { alignItems: 'center', padding: 30 }]}>
            <Icon name="person-off" size={48} color="#6b7280" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 }}>
              غير مسجل في نظام الحضور
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'center' }}>
              تواصل مع الإدارة لتسجيلك في نظام الحضور والانصراف
            </Text>
          </View>
        )}

        {/* Dashboard Stats (Admin) */}
        {dashboard && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
                <Icon name="check-circle" size={24} color="#059669" />
                <Text style={styles.statNumber}>{dashboard.presentToday}</Text>
                <Text style={styles.statLabel}>حاضر</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
                <Icon name="cancel" size={24} color="#dc2626" />
                <Text style={styles.statNumber}>{dashboard.absentToday}</Text>
                <Text style={styles.statLabel}>غائب</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                <Icon name="schedule" size={24} color="#d97706" />
                <Text style={styles.statNumber}>{dashboard.lateToday}</Text>
                <Text style={styles.statLabel}>متأخر</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
                <Icon name="event-busy" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{dashboard.onLeaveToday}</Text>
                <Text style={styles.statLabel}>إجازة</Text>
              </View>
            </View>
            <View style={styles.totalEnrolled}>
              <Icon name="people" size={16} color="#6b7280" />
              <Text style={styles.totalText}>إجمالي المسجلين: {dashboard.totalEnrolled}</Text>
            </View>
          </View>
        )}

        {/* Today's Logs */}
        {dashboard?.todayLogs && dashboard.todayLogs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>سجل حضور اليوم</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StaffAttendanceLogs')}>
                <Text style={styles.viewAllLink}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            {dashboard.todayLogs.slice(0, 10).map((log: StaffAttendanceLog) => (
              <View key={log.id} style={styles.logRow}>
                <View style={styles.logAvatar}>
                  <Text style={styles.logAvatarText}>
                    {log.user?.name?.slice(0, 1)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logName}>{log.user?.name || 'مستخدم'}</Text>
                  <Text style={styles.logTime}>
                    {formatTime(log.checkInTime)} {log.checkOutTime ? `→ ${formatTime(log.checkOutTime)}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (StaffAttendanceStatusColor[log.status] || '#6b7280') + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: StaffAttendanceStatusColor[log.status] || '#6b7280' }]}>
                    {StaffAttendanceStatusArabic[log.status] || log.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('StaffAttendanceLogs')}>
              <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
                <Icon name="list-alt" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.actionText}>سجل الحضور</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('StaffLeaveRequests')}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <Icon name="event-busy" size={22} color="#d97706" />
              </View>
              <Text style={styles.actionText}>طلبات الإجازة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('StaffAttendanceSettings')}>
              <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                <Icon name="settings" size={22} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>الإعدادات</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default StaffAttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: '#6b7280' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderLeftWidth: 4, borderLeftColor: '#dc2626' },
  errorText: { fontSize: 14, color: '#dc2626', flex: 1 },

  // Check-in card
  checkInCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  checkInHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  checkInTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  todayInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f9fafb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  timeLabel: { fontSize: 11, color: '#6b7280' },
  timeValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  checkInActions: { marginBottom: 12 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  checkInBtn: { backgroundColor: '#059669' },
  checkOutBtn: { backgroundColor: '#dc2626' },
  checkBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  completedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12 },
  completedText: { fontSize: 14, fontWeight: '600', color: '#059669' },
  scheduleInfo: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  scheduleText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },

  // Stats
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1a237e', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 14, borderRadius: 12, gap: 4 },
  statNumber: { fontSize: 24, fontWeight: '900', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  totalEnrolled: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },

  // Today logs
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  viewAllLink: { fontSize: 13, color: '#1a237e', fontWeight: '700' },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  logAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  logAvatarText: { fontSize: 14, fontWeight: '800', color: '#374151' },
  logName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  logTime: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, backgroundColor: '#f9fafb' },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'center' },
});

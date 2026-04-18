import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import BranchService from '../services/BranchService';
import {usePermissions} from '../hooks/usePermissions';
import {
  type MyAttendanceStatus,
  StaffAttendanceStatusArabic,
  StaffAttendanceStatusColor,
} from '../types/staffAttendance';

const {width} = Dimensions.get('window');
const CARD_W = (width - 38) / 2;

interface QuickAction {
  icon: string;
  label: string;
  screen: string;
  bg: string;
}

// ====== Main Component ======
const HomeScreen = ({navigation}: any) => {
  const {hasPermission, canAccessScreen} = usePermissions();
  const authServiceAny = AuthService as any;

  const [stats, setStats] = useState({
    totalTrainees: 0,
    activeTrainees: 0,
    totalPrograms: 0,
    attendanceRate: 0,
    attendancePresent: 0,
    attendanceAbsent: 0,
    attendanceLate: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyNetIncome: 0,
    totalUnpaid: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [myAttendanceStatus, setMyAttendanceStatus] = useState<MyAttendanceStatus | null>(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [overtimeSubmitting, setOvertimeSubmitting] = useState(false);
  const [showOvertimeReasonInput, setShowOvertimeReasonInput] = useState(false);
  const [overtimeReason, setOvertimeReason] = useState('');
  const [activeOvertimeSession, setActiveOvertimeSession] = useState<any | null>(null);
  const [todayOvertimeRequests, setTodayOvertimeRequests] = useState<any[]>([]);
  const [overtimeElapsed, setOvertimeElapsed] = useState(0);

  const canViewStatistics = hasPermission('dashboard.statistics', 'view');
  const canViewTrainees = hasPermission('dashboard.trainees', 'view');
  const canViewFinancial = hasPermission('dashboard.financial', 'view');
  const canViewAttendance = hasPermission('dashboard.attendance', 'view');
  const canViewPrograms = hasPermission('dashboard.programs', 'view');
  const canViewMarketing = hasPermission('marketing.applications', 'view');
  const canViewReports = hasPermission('dashboard.reports', 'view');
  const canViewStaffAttendance =
    hasPermission('staff-attendance', 'view') || !!myAttendanceStatus?.isEnrolled;

  const showGeneralStatsSection =
    canViewStatistics &&
    (canViewTrainees ||
      canViewPrograms ||
      canViewAttendance ||
      canViewFinancial);

  const showRecentActivitiesCard =
    canViewStatistics &&
    (canViewTrainees ||
      canViewPrograms ||
      canViewAttendance ||
      canViewFinancial ||
      canViewMarketing);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getActiveOvertimeSessionSafe = () => {
    if (typeof authServiceAny.getActiveOvertimeSession === 'function') {
      return authServiceAny.getActiveOvertimeSession();
    }
    return Promise.resolve(null);
  };

  const getMyOvertimeRequestsSafe = () => {
    if (typeof authServiceAny.getMyOvertimeRequests === 'function') {
      return authServiceAny.getMyOvertimeRequests();
    }
    return Promise.resolve([]);
  };

  const startOvertimeSessionSafe = (reason: string) => {
    if (typeof authServiceAny.startOvertimeSession === 'function') {
      return authServiceAny.startOvertimeSession(reason);
    }
    return Promise.reject(new Error('ميزة الوقت الإضافي غير متاحة حالياً'));
  };

  const endOvertimeSessionSafe = (sessionId: string) => {
    if (typeof authServiceAny.endOvertimeSession === 'function') {
      return authServiceAny.endOvertimeSession(sessionId);
    }
    return Promise.reject(new Error('ميزة الوقت الإضافي غير متاحة حالياً'));
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [branch, dashboard, myStatus, activeOvertime, myOvertime] =
        await Promise.all([
          BranchService.getSelectedBranch().catch(() => null),
          AuthService.getComprehensiveDashboard().catch(() => null),
          AuthService.getMyAttendanceStatus().catch(() => null),
          getActiveOvertimeSessionSafe().catch(() => null),
          getMyOvertimeRequestsSafe().catch(() => []),
        ]);

      if (branch) {
        setBranchName(branch.name);
      }

      const backendStats = dashboard?.stats || {};
      setStats({
        totalTrainees: backendStats.totalTrainees || 0,
        activeTrainees: backendStats.activeTrainees || 0,
        totalPrograms: backendStats.totalPrograms || 0,
        attendanceRate: backendStats.attendanceRate || 0,
        attendancePresent: backendStats.attendancePresent || 0,
        attendanceAbsent: backendStats.attendanceAbsent || 0,
        attendanceLate: backendStats.attendanceLate || 0,
        monthlyRevenue: backendStats.monthlyRevenue || 0,
        monthlyExpenses: backendStats.monthlyExpenses || 0,
        monthlyNetIncome: backendStats.monthlyNetIncome || 0,
        totalUnpaid: backendStats.totalUnpaid || 0,
      });

      setRecentPayments(Array.isArray(dashboard?.recentPayments) ? dashboard.recentPayments : []);
      setRecentActivities(Array.isArray(dashboard?.recentActivities) ? dashboard.recentActivities : []);
      setMyAttendanceStatus(myStatus);

      if (activeOvertime?.id && activeOvertime?.startTime && !activeOvertime?.endTime) {
        setActiveOvertimeSession(activeOvertime);
      } else {
        setActiveOvertimeSession(null);
      }

      const today = new Date().toISOString().split('T')[0];
      const todayRequests = (Array.isArray(myOvertime) ? myOvertime : []).filter((req: any) => {
        const reqDate = req?.date ? new Date(req.date).toISOString().split('T')[0] : '';
        return reqDate === today && req?.endTime;
      });
      setTodayOvertimeRequests(todayRequests);
    } catch (e) {
      console.error('HomeScreen fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!activeOvertimeSession?.startTime) {
      setOvertimeElapsed(0);
      return;
    }

    const startMs = new Date(activeOvertimeSession.startTime).getTime();
    const updateElapsed = () => {
      setOvertimeElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeOvertimeSession?.startTime]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'صباح الخير' : 'مساء الخير';
  })();

  const dateStr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalAttendanceThisMonth =
    stats.attendancePresent + stats.attendanceAbsent + stats.attendanceLate;
  const todayLog = myAttendanceStatus?.todayLog;
  const isCheckedInNow = !!(todayLog?.checkInTime && !todayLog?.checkOutTime);
  const isCheckedOutToday = !!(todayLog?.checkInTime && todayLog?.checkOutTime);

  const getStatusText = () => {
    if (!myAttendanceStatus) return 'غير متاح';
    if (myAttendanceStatus.todayHoliday) return 'إجازة رسمية';
    if (myAttendanceStatus.isWeeklyOff) return 'يوم عطلة أسبوعية';
    if (myAttendanceStatus.todayLog?.status) {
      return StaffAttendanceStatusArabic[myAttendanceStatus.todayLog.status] || myAttendanceStatus.todayLog.status;
    }
    return 'لم يسجل اليوم';
  };

  const getStatusColor = () => {
    if (!myAttendanceStatus) return '#6b7280';
    if (myAttendanceStatus.todayHoliday) return '#8b5cf6';
    if (myAttendanceStatus.isWeeklyOff) return '#6b7280';
    if (myAttendanceStatus.todayLog?.status) {
      return StaffAttendanceStatusColor[myAttendanceStatus.todayLog.status] || '#6b7280';
    }
    return '#9ca3af';
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return '---';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '---';
    return dt.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const shouldOfferForce = (message?: string) => {
    if (!message) return false;
    const lower = message.toLowerCase();
    return message.includes('خارج') || lower.includes('outside') || lower.includes('zone');
  };

  const getLocation = (): Promise<{latitude: number; longitude: number} | null> => {
    return new Promise(async resolve => {
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
          (pos: any) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          () => resolve(null),
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      } catch {
        resolve(null);
      }
    });
  };

  const handleCheckIn = async (force = false) => {
    if (!myAttendanceStatus?.isEnrolled) return;

    setStaffSubmitting(true);
    try {
      const needsLocation =
        myAttendanceStatus.settings?.requireCheckInLocation ||
        myAttendanceStatus.settings?.requireLocation;
      const location = needsLocation ? await getLocation() : null;

      if (needsLocation && !location) {
        Alert.alert('الموقع مطلوب', 'يرجى تفعيل خدمة الموقع لتسجيل الحضور.');
        return;
      }

      await AuthService.staffCheckIn({
        latitude: location?.latitude,
        longitude: location?.longitude,
        forceCheckIn: force,
      });

      setShowOvertimeReasonInput(false);
      setOvertimeReason('');
      await fetchData();
    } catch (err: any) {
      const msg = err?.message || 'فشل في تسجيل الحضور';
      const strictLocation = !!myAttendanceStatus.settings?.requireCheckInLocation;

      if (!force && !strictLocation && shouldOfferForce(msg)) {
        Alert.alert('تنبيه نطاق الموقع', msg, [
          {text: 'إلغاء', style: 'cancel'},
          {text: 'تسجيل رغم الموقع', onPress: () => handleCheckIn(true)},
        ]);
      } else {
        Alert.alert('خطأ', msg);
      }
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleCheckOut = async (force = false) => {
    if (!myAttendanceStatus?.isEnrolled) return;

    setStaffSubmitting(true);
    try {
      const needsLocation =
        myAttendanceStatus.settings?.requireCheckOutLocation ||
        myAttendanceStatus.settings?.requireLocation;
      const location = needsLocation ? await getLocation() : null;

      if (needsLocation && !location) {
        Alert.alert('الموقع مطلوب', 'يرجى تفعيل خدمة الموقع لتسجيل الانصراف.');
        return;
      }

      await AuthService.staffCheckOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
        forceCheckOut: force,
      });

      await fetchData();
    } catch (err: any) {
      const msg = err?.message || 'فشل في تسجيل الانصراف';
      const strictLocation = !!myAttendanceStatus.settings?.requireCheckOutLocation;

      if (!force && !strictLocation && shouldOfferForce(msg)) {
        Alert.alert('تنبيه نطاق الموقع', msg, [
          {text: 'إلغاء', style: 'cancel'},
          {text: 'تسجيل رغم الموقع', onPress: () => handleCheckOut(true)},
        ]);
      } else {
        Alert.alert('خطأ', msg);
      }
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleStartOvertime = async () => {
    const reason = overtimeReason.trim();
    if (!reason) {
      Alert.alert('السبب مطلوب', 'يرجى إدخال سبب الوقت الإضافي أولاً.');
      return;
    }

    setOvertimeSubmitting(true);
    try {
      const session = await startOvertimeSessionSafe(reason);
      setActiveOvertimeSession(session);
      setShowOvertimeReasonInput(false);
      setOvertimeReason('');
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل في بدء الوقت الإضافي');
    } finally {
      setOvertimeSubmitting(false);
    }
  };

  const handleEndOvertime = async () => {
    if (!activeOvertimeSession?.id) return;

    setOvertimeSubmitting(true);
    try {
      await endOvertimeSessionSafe(activeOvertimeSession.id);
      setActiveOvertimeSession(null);
      await fetchData();
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل في إنهاء الوقت الإضافي');
    } finally {
      setOvertimeSubmitting(false);
    }
  };

  const staffAttendanceQuickScreen = canAccessScreen('StaffAttendance')
    ? 'StaffAttendance'
    : 'SelfStaffAttendance';

  const quickActions: QuickAction[] = [
    ...(canViewTrainees && canAccessScreen('StudentsList')
      ? [{icon: 'school', label: 'المتدربين', screen: 'StudentsList', bg: '#1a237e'}]
      : []),
    ...(canViewPrograms && canAccessScreen('Programs')
      ? [{icon: 'book', label: 'البرامج', screen: 'Programs', bg: '#059669'}]
      : []),
    ...(canViewAttendance && canAccessScreen('AttendancePrograms')
      ? [{icon: 'fact-check', label: 'الحضور', screen: 'AttendancePrograms', bg: '#0ea5e9'}]
      : []),
    ...(canViewFinancial && canAccessScreen('Treasury')
      ? [{icon: 'account-balance', label: 'المالية', screen: 'Treasury', bg: '#dc2626'}]
      : []),
    ...(canViewMarketing && canAccessScreen('MarketingTrainees')
      ? [{icon: 'campaign', label: 'التسويق', screen: 'MarketingTrainees', bg: '#ec4899'}]
      : []),
    ...(canViewReports && canAccessScreen('FinancialReports')
      ? [{icon: 'bar-chart', label: 'التقارير', screen: 'FinancialReports', bg: '#4f46e5'}]
      : []),
    ...(canViewStaffAttendance
      ? [
          {
            icon: 'fingerprint',
            label: 'تسجيل الحضور',
            screen: staffAttendanceQuickScreen,
            bg: '#0d9488',
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.refreshBtn} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>الرئيسية</Text>
          {branchName ? (
            <Text style={st.branchBadge}>{branchName}</Text>
          ) : null}
        </View>
        <CustomMenu navigation={navigation} activeRouteName="Home" />
      </View>

      <ScrollView
        style={st.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 30}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Welcome Card */}
        <View style={st.welcomeCard}>
          <View style={{flex: 1}}>
            <Text style={st.greeting}>{greeting} 👋</Text>
            <Text style={st.welcomeTitle}>لوحة التحكم الرئيسية</Text>
            <Text style={st.dateText}>{dateStr}</Text>
          </View>
        </View>

        {loading ? (
          <View style={st.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={st.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : (
          <>
            {showGeneralStatsSection && <Text style={st.sectionTitle}>الإحصائيات العامة</Text>}

            {canViewStaffAttendance && (
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>حضور الموظف اليوم</Text>

                {!myAttendanceStatus ? (
                  <Text style={st.emptyText}>تعذر تحميل بيانات حضور الموظف</Text>
                ) : !myAttendanceStatus.isEnrolled ? (
                  <Text style={st.emptyText}>هذا المستخدم غير مسجل في نظام حضور الموظفين</Text>
                ) : (
                  <>
                    <View style={st.staffAttendanceHeader}>
                      <View style={[st.staffStatusDot, {backgroundColor: getStatusColor()}]} />
                      <Text style={[st.staffStatusText, {color: getStatusColor()}]}>{getStatusText()}</Text>
                    </View>

                    <View style={st.staffTimesRow}>
                      <View style={st.staffTimeCard}>
                        <Text style={st.staffTimeLabel}>دخول</Text>
                        <Text style={st.staffTimeValue}>{formatTime(myAttendanceStatus.todayLog?.checkInTime)}</Text>
                      </View>
                      <View style={st.staffTimeCard}>
                        <Text style={st.staffTimeLabel}>خروج</Text>
                        <Text style={st.staffTimeValue}>{formatTime(myAttendanceStatus.todayLog?.checkOutTime)}</Text>
                      </View>
                      <View style={st.staffTimeCard}>
                        <Text style={st.staffTimeLabel}>الدقائق</Text>
                        <Text style={st.staffTimeValue}>{myAttendanceStatus.todayLog?.workedMinutes ?? 0}</Text>
                      </View>
                    </View>

                    {myAttendanceStatus.todayHoliday?.name ? (
                      <Text style={st.staffInfoText}>إجازة اليوم: {myAttendanceStatus.todayHoliday.name}</Text>
                    ) : null}

                    {myAttendanceStatus.isWeeklyOff && myAttendanceStatus.weeklyOffDay ? (
                      <Text style={st.staffInfoText}>عطلة أسبوعية: {myAttendanceStatus.weeklyOffDay}</Text>
                    ) : null}

                    <View style={st.staffActionWrap}>
                      {!isCheckedInNow && !isCheckedOutToday && (
                        <TouchableOpacity
                          style={[st.staffActionBtn, {backgroundColor: '#2563eb'}]}
                          onPress={() => handleCheckIn(false)}
                          disabled={staffSubmitting}>
                          {staffSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Icon name="login" size={18} color="#fff" />
                              <Text style={st.staffActionText}>تسجيل الحضور</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {isCheckedInNow && (
                        <TouchableOpacity
                          style={[st.staffActionBtn, {backgroundColor: '#dc2626'}]}
                          onPress={() => handleCheckOut(false)}
                          disabled={staffSubmitting}>
                          {staffSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Icon name="logout" size={18} color="#fff" />
                              <Text style={st.staffActionText}>تسجيل الانصراف</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {isCheckedOutToday && !activeOvertimeSession && (
                        <View style={st.staffDoneBanner}>
                          <Icon name="check-circle" size={18} color="#059669" />
                          <Text style={st.staffDoneText}>تم تسجيل يوم العمل بنجاح</Text>
                        </View>
                      )}
                    </View>

                    {(isCheckedOutToday || !!activeOvertimeSession) && (
                      <View style={st.overtimeWrap}>
                        <View style={st.overtimeHeader}>
                          <Icon name="schedule" size={16} color="#b45309" />
                          <Text style={st.overtimeTitle}>الوقت الإضافي</Text>
                        </View>

                        {activeOvertimeSession ? (
                          <>
                            <View style={st.overtimeLiveBox}>
                              <Text style={st.overtimeLiveLabel}>جلسة جارية</Text>
                              <Text style={st.overtimeLiveTimer}>{formatElapsed(overtimeElapsed)}</Text>
                              <Text style={st.overtimeMetaText}>
                                بدأ: {formatTime(activeOvertimeSession.startTime)}
                              </Text>
                              {activeOvertimeSession.reason ? (
                                <Text style={st.overtimeMetaText}>السبب: {activeOvertimeSession.reason}</Text>
                              ) : null}
                            </View>

                            <TouchableOpacity
                              style={[st.overtimeActionBtn, {backgroundColor: '#b45309'}]}
                              onPress={handleEndOvertime}
                              disabled={overtimeSubmitting}>
                              {overtimeSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <>
                                  <Icon name="stop-circle" size={18} color="#fff" />
                                  <Text style={st.overtimeActionText}>إنهاء وحفظ الوقت الإضافي</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </>
                        ) : showOvertimeReasonInput ? (
                          <>
                            <TextInput
                              style={st.overtimeInput}
                              placeholder="سبب الوقت الإضافي (مطلوب)"
                              placeholderTextColor="#94a3b8"
                              value={overtimeReason}
                              onChangeText={setOvertimeReason}
                              multiline
                            />
                            <View style={st.overtimeButtonsRow}>
                              <TouchableOpacity
                                style={[st.overtimeActionBtn, {backgroundColor: '#d97706', flex: 1}]}
                                onPress={handleStartOvertime}
                                disabled={overtimeSubmitting}>
                                {overtimeSubmitting ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <>
                                    <Icon name="play-arrow" size={18} color="#fff" />
                                    <Text style={st.overtimeActionText}>بدء التتبع</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[st.overtimeCancelBtn, {flex: 1}]}
                                onPress={() => {
                                  setShowOvertimeReasonInput(false);
                                  setOvertimeReason('');
                                }}
                                disabled={overtimeSubmitting}>
                                <Text style={st.overtimeCancelText}>إلغاء</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={st.overtimeStartBtn}
                            onPress={() => setShowOvertimeReasonInput(true)}>
                            <Icon name="add-circle" size={18} color="#b45309" />
                            <Text style={st.overtimeStartText}>بدء تتبع الوقت الإضافي</Text>
                          </TouchableOpacity>
                        )}

                        {todayOvertimeRequests.length > 0 && (
                          <View style={st.overtimeHistoryWrap}>
                            <Text style={st.overtimeHistoryTitle}>طلبات اليوم</Text>
                            {todayOvertimeRequests.slice(0, 3).map((req, idx) => (
                              <View key={req.id || idx} style={st.overtimeHistoryItem}>
                                <Text style={st.overtimeHistoryStatus}>
                                  {req.status === 'APPROVED'
                                    ? 'موافق'
                                    : req.status === 'REJECTED'
                                      ? 'مرفوض'
                                      : 'قيد المراجعة'}
                                </Text>
                                <Text style={st.overtimeHistoryTime}>
                                  {formatTime(req.startTime)} - {formatTime(req.endTime)}
                                </Text>
                                <Text style={st.overtimeHistoryDuration}>
                                  {Number(req.totalMinutes || 0)} د
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {showGeneralStatsSection && (
              <View style={st.statsGrid}>
                {canViewTrainees && (
                  <View style={[st.statCard, {borderTopColor: '#1a237e'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#eef2ff'}]}>
                      <Icon name="school" size={22} color="#1a237e" />
                    </View>
                    <Text style={st.statNum}>{stats.totalTrainees}</Text>
                    <Text style={st.statLabel}>إجمالي المتدربين</Text>
                  </View>
                )}

                {canViewTrainees && (
                  <View style={[st.statCard, {borderTopColor: '#059669'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#ecfdf5'}]}>
                      <Icon name="person" size={22} color="#059669" />
                    </View>
                    <Text style={st.statNum}>{stats.activeTrainees}</Text>
                    <Text style={st.statLabel}>متدربون نشطون</Text>
                  </View>
                )}

                {canViewPrograms && (
                  <View style={[st.statCard, {borderTopColor: '#0ea5e9'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#ecfeff'}]}>
                      <Icon name="menu-book" size={22} color="#0ea5e9" />
                    </View>
                    <Text style={st.statNum}>{stats.totalPrograms}</Text>
                    <Text style={st.statLabel}>البرامج التدريبية</Text>
                  </View>
                )}

                {canViewAttendance && (
                  <View style={[st.statCard, {borderTopColor: '#7c3aed'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#f5f3ff'}]}>
                      <Icon name="bar-chart" size={22} color="#7c3aed" />
                    </View>
                    <Text style={st.statNum}>{stats.attendanceRate}%</Text>
                    <Text style={st.statLabel}>نسبة الحضور</Text>
                  </View>
                )}

                {canViewFinancial && (
                  <View style={[st.statCard, {borderTopColor: '#16a34a'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#f0fdf4'}]}>
                      <Icon name="trending-up" size={22} color="#16a34a" />
                    </View>
                    <Text style={st.statNum}>{Math.round(stats.monthlyRevenue).toLocaleString()}</Text>
                    <Text style={st.statLabel}>إيراد الشهر (ج.م)</Text>
                  </View>
                )}

                {canViewFinancial && (
                  <View style={[st.statCard, {borderTopColor: '#dc2626'}]}>
                    <View style={[st.statIconBox, {backgroundColor: '#fef2f2'}]}>
                      <Icon name="trending-down" size={22} color="#dc2626" />
                    </View>
                    <Text style={st.statNum}>{Math.round(stats.monthlyExpenses).toLocaleString()}</Text>
                    <Text style={st.statLabel}>مصروفات الشهر (ج.م)</Text>
                  </View>
                )}
              </View>
            )}

            {canViewStatistics && canViewAttendance && (
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>ملخص الحضور (هذا الشهر)</Text>
                <View style={st.attendanceRow}>
                  <View style={[st.attChip, {backgroundColor: '#dcfce7'}]}>
                    <Text style={[st.attChipVal, {color: '#166534'}]}>{stats.attendancePresent}</Text>
                    <Text style={st.attChipLabel}>حاضر</Text>
                  </View>
                  <View style={[st.attChip, {backgroundColor: '#fef3c7'}]}>
                    <Text style={[st.attChipVal, {color: '#92400e'}]}>{stats.attendanceLate}</Text>
                    <Text style={st.attChipLabel}>متأخر</Text>
                  </View>
                  <View style={[st.attChip, {backgroundColor: '#fee2e2'}]}>
                    <Text style={[st.attChipVal, {color: '#991b1b'}]}>{stats.attendanceAbsent}</Text>
                    <Text style={st.attChipLabel}>غائب</Text>
                  </View>
                </View>
                <Text style={st.attMeta}>إجمالي السجلات: {totalAttendanceThisMonth}</Text>
              </View>
            )}

            {canViewStatistics && canViewFinancial && (
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>الحالة المالية</Text>
                <View style={st.finRow}>
                  <View style={st.finCol}>
                    <Text style={st.finLabel}>صافي الشهر</Text>
                    <Text style={[st.finValue, {color: stats.monthlyNetIncome >= 0 ? '#059669' : '#dc2626'}]}>
                      {Math.round(stats.monthlyNetIncome).toLocaleString()} ج.م
                    </Text>
                  </View>
                  <View style={st.finDivider} />
                  <View style={st.finCol}>
                    <Text style={st.finLabel}>المديونيات</Text>
                    <Text style={[st.finValue, {color: '#b91c1c'}]}>
                      {Math.round(stats.totalUnpaid).toLocaleString()} ج.م
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {showRecentActivitiesCard && (
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>آخر الأنشطة</Text>
                {recentActivities.length === 0 ? (
                  <Text style={st.emptyText}>لا توجد أنشطة حديثة</Text>
                ) : (
                  recentActivities.slice(0, 6).map((item, idx) => (
                    <View key={item.id || idx} style={st.activityItem}>
                      <View style={st.activityDot} />
                      <View style={{flex: 1}}>
                        <Text style={st.activityTitle}>{item.title}</Text>
                        <Text style={st.activityDesc} numberOfLines={1}>{item.description}</Text>
                      </View>
                      <Text style={st.activityTime}>{item.time}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ---- Quick Actions ---- */}
            {quickActions.length > 0 && <Text style={st.sectionTitle}>الوصول السريع</Text>}
            {quickActions.length > 0 && (
              <View style={st.actionsGrid}>
                {quickActions.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[st.actionCard, {backgroundColor: a.bg}]}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(a.screen)}>
                    <View style={st.actionIconWrap}>
                      <Icon name={a.icon} size={26} color="#fff" />
                    </View>
                    <Text style={st.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const st = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#1a237e',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  branchBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    overflow: 'hidden',
  },
  refreshBtn: {padding: 8, borderRadius: 10, backgroundColor: '#f3f4f6'},
  scroll: {flex: 1, paddingHorizontal: 12},

  // Welcome
  welcomeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginVertical: 12,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  greeting: {fontSize: 14, color: '#059669', fontWeight: '700'},
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
    marginTop: 2,
  },
  dateText: {fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '500'},

  // Loading
  loadingBox: {alignItems: 'center', paddingVertical: 60, gap: 12},
  loadingText: {fontSize: 14, color: '#6b7280', fontWeight: '500'},

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 10,
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNum: {fontSize: 20, fontWeight: '800', color: '#111827'},
  statLabel: {fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 2},
  // Sections
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  attChipVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  attChipLabel: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  attMeta: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 12,
  },
  finRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 46,
    backgroundColor: '#e2e8f0',
  },
  finLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  finValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Staff attendance widget
  staffAttendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  staffStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  staffStatusText: {
    fontSize: 14,
    fontWeight: '800',
  },
  staffTimesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  staffTimeCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  staffTimeLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '700',
  },
  staffTimeValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '800',
  },
  staffInfoText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
    fontWeight: '600',
  },
  staffActionBtn: {
    marginTop: 6,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  staffActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  staffActionWrap: {
    marginTop: 4,
    gap: 8,
  },
  staffDoneBanner: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  staffDoneText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },

  overtimeWrap: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 8,
  },
  overtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overtimeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  overtimeLiveBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  overtimeLiveLabel: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '800',
  },
  overtimeLiveTimer: {
    fontSize: 28,
    fontWeight: '900',
    color: '#b45309',
    fontVariant: ['tabular-nums'],
  },
  overtimeMetaText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  overtimeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  overtimeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  overtimeActionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  overtimeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  overtimeCancelBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overtimeCancelText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  overtimeStartBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  overtimeStartText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '800',
  },
  overtimeHistoryWrap: {
    marginTop: 4,
    gap: 6,
  },
  overtimeHistoryTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  overtimeHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  overtimeHistoryStatus: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '700',
  },
  overtimeHistoryTime: {
    flex: 1,
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  overtimeHistoryDuration: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '800',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  activityDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
  },

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  actionCard: {
    width: CARD_W,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {fontSize: 14, fontWeight: '700', color: '#fff'},
});

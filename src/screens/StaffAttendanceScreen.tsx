import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Platform, PermissionsAndroid, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffAttendanceStatusArabic, StaffAttendanceStatusColor,
  type MyAttendanceStatus, type StaffAttendanceDashboard, type StaffAttendanceLog,
} from '../types/staffAttendance';
import {usePermissions} from '../hooks/usePermissions';

const StaffAttendanceScreen = ({navigation}: any) => {
  const {hasPermission} = usePermissions();
  const isAdminUser = hasPermission('staff-attendance', 'view') && hasPermission('staff-attendance.enrollments', 'view');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [myStatus, setMyStatus] = useState<MyAttendanceStatus | null>(null);
  const [dashboard, setDashboard] = useState<StaffAttendanceDashboard | null>(null);
  const [todayLogs, setTodayLogs] = useState<StaffAttendanceLog[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState<'checkin' | 'checkout'>('checkin');
  const [confirmWarnings, setConfirmWarnings] = useState<string[]>([]);
  const [liveTimer, setLiveTimer] = useState('00:00:00');
  const timerRef = useRef<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusData, dashData, todayData] = await Promise.all([
        AuthService.getMyAttendanceStatus().catch(() => null),
        isAdminUser ? AuthService.getStaffAttendanceDashboard().catch(() => null) : Promise.resolve(null),
        isAdminUser ? AuthService.getTodayAttendance().catch(() => []) : Promise.resolve([]),
      ]);
      setMyStatus(statusData);
      setDashboard(dashData);
      setTodayLogs(Array.isArray(todayData) ? todayData : todayData?.data || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live timer for checked-in state
  useEffect(() => {
    if (myStatus?.todayLog?.checkInTime && !myStatus?.todayLog?.checkOutTime) {
      const update = () => {
        const start = new Date(myStatus.todayLog!.checkInTime!).getTime();
        const diff = Date.now() - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setLiveTimer(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        );
      };
      update();
      timerRef.current = setInterval(update, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setLiveTimer('00:00:00');
    }
  }, [myStatus?.todayLog?.checkInTime, myStatus?.todayLog?.checkOutTime]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
        const Geolocation =
          require('react-native-geolocation-service').default;
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
    // Check for warnings before check-in
    if (!force && myStatus) {
      const warnings: string[] = [];
      if (myStatus.isWeeklyOff) {
        warnings.push(
          `اليوم هو يوم ${myStatus.weeklyOffDay || 'عطلة'} (يوم إجازة أسبوعية)`,
        );
      }
      if (myStatus.todayHoliday) {
        warnings.push(`اليوم عطلة رسمية: ${myStatus.todayHoliday.name}`);
      }
      if (warnings.length > 0) {
        setConfirmWarnings(warnings);
        setConfirmType('checkin');
        setShowConfirmModal(true);
        return;
      }
    }

    setCheckingIn(true);
    try {
      const needsLocation =
        myStatus?.settings?.requireCheckInLocation ||
        myStatus?.settings?.requireLocation;
      const location = needsLocation ? await getLocation() : null;
      await AuthService.staffCheckIn({
        latitude: location?.latitude,
        longitude: location?.longitude,
        forceCheckIn: force,
      });
      Toast.show({
        type: 'success',
        text1: 'تم تسجيل الحضور',
        text2: 'تم تسجيل حضورك بنجاح ✅',
      });
      loadData();
    } catch (e: any) {
      // Handle location outside zone (soft mode) - offer force
      if (
        e.message?.includes('خارج') ||
        e.message?.includes('outside') ||
        e.message?.includes('zone')
      ) {
        setConfirmWarnings([e.message]);
        setConfirmType('checkin');
        setShowConfirmModal(true);
      } else {
        Alert.alert('خطأ', e.message || 'فشل في تسجيل الحضور');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (force = false) => {
    setCheckingOut(true);
    try {
      const needsLocation =
        myStatus?.settings?.requireCheckOutLocation ||
        myStatus?.settings?.requireLocation;
      const location = needsLocation ? await getLocation() : null;
      await AuthService.staffCheckOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
        forceCheckOut: force,
      });
      Toast.show({
        type: 'success',
        text1: 'تم تسجيل الانصراف',
        text2: 'تم تسجيل انصرافك بنجاح 👋',
      });
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في تسجيل الانصراف');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (confirmType === 'checkin') {
      handleCheckIn(true);
    } else {
      handleCheckOut(true);
    }
  };

  const fmt = (d?: string) => {
    if (!d) return '--:--';
    return new Date(d).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const fmtMins = (m?: number) => {
    if (!m) return '0 د';
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}س ${min}د` : `${min}د`;
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <CustomMenu
            navigation={navigation}
            activeRouteName="StaffAttendance"
          />
          <Text style={s.headerTitle}>الحضور والانصراف</Text>
          <View style={{width: 44}} />
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      </View>
    );
  }

  const todayLog = myStatus?.todayLog;
  const isCheckedIn = !!(todayLog?.checkInTime && !todayLog?.checkOutTime);
  const isCompleted = !!(todayLog?.checkInTime && todayLog?.checkOutTime);
  const effectiveStart =
    myStatus?.customSchedule?.customWorkStartTime ||
    myStatus?.settings?.workStartTime;
  const effectiveEnd =
    myStatus?.customSchedule?.customWorkEndTime ||
    myStatus?.settings?.workEndTime;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <CustomMenu
          navigation={navigation}
          activeRouteName="StaffAttendance"
        />
        <Text style={s.headerTitle}>الحضور والانصراف</Text>
        <View style={{width: 44}} />
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 30}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* ========== HOLIDAY / OFF-DAY WARNING ========== */}
        {myStatus?.isEnrolled !== false &&
          (myStatus?.isWeeklyOff || myStatus?.todayHoliday) && (
            <View style={s.warningBanner}>
              <Icon name="event-busy" size={20} color="#d97706" />
              <View style={{flex: 1}}>
                {myStatus?.isWeeklyOff && (
                  <Text style={s.warningText}>
                    اليوم يوم عطلة أسبوعية (
                    {myStatus.weeklyOffDay || 'عطلة'})
                  </Text>
                )}
                {myStatus?.todayHoliday && (
                  <Text style={s.warningText}>
                    عطلة رسمية: {myStatus.todayHoliday.name}
                  </Text>
                )}
              </View>
            </View>
          )}

        {/* ========== CHECK-IN/OUT SECTION ========== */}
        {myStatus?.isEnrolled !== false ? (
          <View style={s.checkCard}>
            {/* Status indicator */}
            <View style={s.checkStatusRow}>
              <View
                style={[
                  s.statusIndicator,
                  {backgroundColor: isCheckedIn ? '#059669' : isCompleted ? '#3b82f6' : '#9ca3af'},
                ]}
              />
              <Text style={s.checkStatusText}>
                {isCompleted
                  ? 'تم الانتهاء من يوم العمل'
                  : isCheckedIn
                    ? 'أنت حاضر الآن'
                    : 'لم تسجل حضورك بعد اليوم'}
              </Text>
            </View>

            {/* Live Timer (when checked in) */}
            {isCheckedIn && (
              <View style={s.timerBox}>
                <Icon name="timer" size={24} color="#1a237e" />
                <Text style={s.timerText}>{liveTimer}</Text>
                <Text style={s.timerLabel}>
                  تسجيل الحضور: {fmt(todayLog?.checkInTime)}
                </Text>
              </View>
            )}

            {/* Completed info */}
            {isCompleted && todayLog && (
              <View style={s.completedBox}>
                <View style={s.completedRow}>
                  <View style={s.tBox}>
                    <Icon name="login" size={16} color="#059669" />
                    <Text style={s.tLabel}>الحضور</Text>
                    <Text style={s.tVal}>{fmt(todayLog.checkInTime)}</Text>
                  </View>
                  <View style={s.tBox}>
                    <Icon name="logout" size={16} color="#dc2626" />
                    <Text style={s.tLabel}>الانصراف</Text>
                    <Text style={s.tVal}>{fmt(todayLog.checkOutTime)}</Text>
                  </View>
                  <View style={s.tBox}>
                    <Icon name="schedule" size={16} color="#3b82f6" />
                    <Text style={s.tLabel}>ساعات العمل</Text>
                    <Text style={s.tVal}>
                      {fmtMins(todayLog.workedMinutes)}
                    </Text>
                  </View>
                </View>
                {(todayLog.isLate || todayLog.isEarlyLeave) && (
                  <View style={s.tagsRow}>
                    {todayLog.isLate && (
                      <View style={[s.tag, {backgroundColor: '#fef3c7'}]}>
                        <Icon name="warning" size={12} color="#d97706" />
                        <Text style={{color: '#d97706', fontSize: 11, fontWeight: '700'}}>
                          متأخر{todayLog.lateMinutes ? ` (${todayLog.lateMinutes}د)` : ''}
                        </Text>
                      </View>
                    )}
                    {todayLog.isEarlyLeave && (
                      <View style={[s.tag, {backgroundColor: '#fef2f2'}]}>
                        <Icon name="running-with-errors" size={12} color="#dc2626" />
                        <Text style={{color: '#dc2626', fontSize: 11, fontWeight: '700'}}>
                          انصراف مبكر{todayLog.earlyLeaveMinutes ? ` (${todayLog.earlyLeaveMinutes}د)` : ''}
                        </Text>
                      </View>
                    )}
                    {todayLog.overtimeMinutes && todayLog.overtimeMinutes > 0 ? (
                      <View style={[s.tag, {backgroundColor: '#ecfdf5'}]}>
                        <Icon name="add-circle" size={12} color="#059669" />
                        <Text style={{color: '#059669', fontSize: 11, fontWeight: '700'}}>
                          وقت إضافي ({fmtMins(todayLog.overtimeMinutes)})
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            )}

            {/* Not checked-in yet info */}
            {!isCheckedIn && !isCompleted && (
              <View style={s.clockIcon}>
                <Icon name="access-time" size={56} color="#e5e7eb" />
              </View>
            )}

            {/* Buttons */}
            <View style={{marginTop: 16}}>
              {!isCheckedIn && !isCompleted && (
                <TouchableOpacity
                  style={[s.btn, {backgroundColor: '#059669'}]}
                  onPress={() => handleCheckIn(false)}
                  disabled={checkingIn}
                  activeOpacity={0.85}>
                  {checkingIn ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="login" size={22} color="#fff" />
                      <Text style={s.btnText}>تسجيل الحضور</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {isCheckedIn && (
                <TouchableOpacity
                  style={[s.btn, {backgroundColor: '#dc2626'}]}
                  onPress={() => handleCheckOut(false)}
                  disabled={checkingOut}
                  activeOpacity={0.85}>
                  {checkingOut ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="logout" size={22} color="#fff" />
                      <Text style={s.btnText}>تسجيل الانصراف</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              {isCompleted && (
                <View style={s.doneBanner}>
                  <Icon name="check-circle" size={20} color="#059669" />
                  <Text style={s.doneText}>
                    تم تسجيل الحضور والانصراف اليوم
                  </Text>
                </View>
              )}
            </View>

            {/* Work schedule info */}
            {effectiveStart && effectiveEnd && (
              <View style={s.scheduleRow}>
                <Icon name="schedule" size={14} color="#6b7280" />
                <Text style={s.scheduleText}>
                  مواعيد العمل: {effectiveStart} - {effectiveEnd}
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Not enrolled */
          <View style={[s.card, {alignItems: 'center' as const, padding: 30}]}>
            <Icon name="person-off" size={48} color="#6b7280" />
            <Text style={s.notEnrolledTitle}>غير مسجل في نظام الحضور</Text>
            <Text style={s.notEnrolledSub}>
              تواصل مع الإدارة لتسجيلك في نظام الحضور والانصراف
            </Text>
          </View>
        )}

        {/* ========== ADMIN DASHBOARD ========== */}
        {isAdminUser && dashboard && (
          <>
            {/* Stats Row 1 */}
            <Text style={s.sectionTitle}>إحصائيات اليوم</Text>
            <View style={s.statsRow}>
              <View style={[s.statCard, {backgroundColor: '#ecfdf5'}]}>
                <Icon name="check-circle" size={22} color="#059669" />
                <Text style={s.statNum}>{dashboard.presentToday}</Text>
                <Text style={s.statLabel}>حاضر</Text>
              </View>
              <View style={[s.statCard, {backgroundColor: '#fef2f2'}]}>
                <Icon name="cancel" size={22} color="#dc2626" />
                <Text style={s.statNum}>{dashboard.absentToday}</Text>
                <Text style={s.statLabel}>غائب</Text>
              </View>
              <View style={[s.statCard, {backgroundColor: '#fef3c7'}]}>
                <Icon name="schedule" size={22} color="#d97706" />
                <Text style={s.statNum}>{dashboard.lateToday}</Text>
                <Text style={s.statLabel}>متأخر</Text>
              </View>
              <View style={[s.statCard, {backgroundColor: '#eff6ff'}]}>
                <Icon name="event-busy" size={22} color="#3b82f6" />
                <Text style={s.statNum}>{dashboard.onLeaveToday}</Text>
                <Text style={s.statLabel}>إجازة</Text>
              </View>
            </View>

            {/* Stats Row 2 */}
            <View style={s.statsRow}>
              <View style={[s.statCard, {backgroundColor: '#f5f3ff'}]}>
                <Icon name="pending-actions" size={22} color="#7c3aed" />
                <Text style={s.statNum}>{dashboard.pendingLeaves}</Text>
                <Text style={s.statLabel}>طلبات معلقة</Text>
              </View>
              <View style={[s.statCard, {backgroundColor: '#f0fdf4'}]}>
                <Icon name="trending-up" size={22} color="#059669" />
                <Text style={s.statNum}>
                  {Math.round(dashboard.attendanceRate || 0)}%
                </Text>
                <Text style={s.statLabel}>نسبة الحضور</Text>
              </View>
              <View style={[s.statCard, {backgroundColor: '#faf5ff'}]}>
                <Icon name="people" size={22} color="#7c3aed" />
                <Text style={s.statNum}>{dashboard.totalEnrolled}</Text>
                <Text style={s.statLabel}>المسجلين</Text>
              </View>
            </View>

            {/* Attendance Distribution Bar */}
            {dashboard.totalEnrolled > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>توزيع الحضور اليوم</Text>
                <View style={s.distBar}>
                  {dashboard.presentToday > 0 && (
                    <View
                      style={[
                        s.distSegment,
                        {
                          flex: dashboard.presentToday,
                          backgroundColor: '#059669',
                          borderTopLeftRadius: 6,
                          borderBottomLeftRadius: 6,
                        },
                      ]}
                    />
                  )}
                  {dashboard.lateToday > 0 && (
                    <View
                      style={[
                        s.distSegment,
                        {flex: dashboard.lateToday, backgroundColor: '#f59e0b'},
                      ]}
                    />
                  )}
                  {dashboard.absentToday > 0 && (
                    <View
                      style={[
                        s.distSegment,
                        {flex: dashboard.absentToday, backgroundColor: '#dc2626'},
                      ]}
                    />
                  )}
                  {dashboard.onLeaveToday > 0 && (
                    <View
                      style={[
                        s.distSegment,
                        {
                          flex: dashboard.onLeaveToday,
                          backgroundColor: '#3b82f6',
                          borderTopRightRadius: 6,
                          borderBottomRightRadius: 6,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={s.legendRow}>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: '#059669'}]} />
                    <Text style={s.legendText}>حاضر</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: '#f59e0b'}]} />
                    <Text style={s.legendText}>متأخر</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: '#dc2626'}]} />
                    <Text style={s.legendText}>غائب</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, {backgroundColor: '#3b82f6'}]} />
                    <Text style={s.legendText}>إجازة</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Today's Attendance List */}
            {todayLogs.length > 0 && (
              <View style={s.card}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>حضور الموظفين اليوم</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('StaffAttendanceLogs')
                    }>
                    <Text style={s.viewAllLink}>عرض الكل</Text>
                  </TouchableOpacity>
                </View>
                {todayLogs.slice(0, 15).map(log => (
                  <View key={log.id} style={s.empRow}>
                    <View style={s.empAvatar}>
                      <Text style={s.empAvatarText}>
                        {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.empName}>
                        {log.user?.name || 'موظف'}
                      </Text>
                      <Text style={s.empTime}>
                        {fmt(log.checkInTime)}
                        {log.checkOutTime
                          ? ` → ${fmt(log.checkOutTime)}`
                          : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.empBadge,
                        {
                          backgroundColor:
                            (StaffAttendanceStatusColor[log.status] ||
                              '#6b7280') + '18',
                        },
                      ]}>
                      <View
                        style={[
                          s.empBadgeDot,
                          {
                            backgroundColor:
                              StaffAttendanceStatusColor[log.status] ||
                              '#6b7280',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          s.empBadgeText,
                          {
                            color:
                              StaffAttendanceStatusColor[log.status] ||
                              '#6b7280',
                          },
                        ]}>
                        {StaffAttendanceStatusArabic[log.status] || log.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ========== QUICK ACTIONS ========== */}
        <Text style={s.sectionTitle}>التنقل السريع</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('StaffAttendanceLogs')}>
            <View style={[s.actionIcon, {backgroundColor: '#eff6ff'}]}>
              <Icon name="list-alt" size={22} color="#3b82f6" />
            </View>
            <Text style={s.actionLabel}>سجل الحضور</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('StaffLeaveRequests')}>
            <View style={[s.actionIcon, {backgroundColor: '#fef3c7'}]}>
              <Icon name="event-busy" size={22} color="#d97706" />
            </View>
            <Text style={s.actionLabel}>طلبات الإجازة</Text>
          </TouchableOpacity>
          {isAdminUser && (
            <>
              <TouchableOpacity
                style={s.actionCard}
                onPress={() =>
                  navigation.navigate('StaffAttendanceEmployees')
                }>
                <View style={[s.actionIcon, {backgroundColor: '#ecfdf5'}]}>
                  <Icon name="people" size={22} color="#059669" />
                </View>
                <Text style={s.actionLabel}>الموظفين</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionCard}
                onPress={() =>
                  navigation.navigate('StaffAttendanceSettings')
                }>
                <View style={[s.actionIcon, {backgroundColor: '#f3e8ff'}]}>
                  <Icon name="settings" size={22} color="#7c3aed" />
                </View>
                <Text style={s.actionLabel}>الإعدادات</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* ========== CONFIRM MODAL ========== */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirmModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalIconBox}>
              <Icon name="warning" size={32} color="#d97706" />
            </View>
            <Text style={s.modalTitle}>
              {confirmWarnings.length > 1
                ? 'تنبيهات متعددة'
                : confirmType === 'checkin'
                  ? 'تسجيل حضور في يوم إجازة'
                  : 'تأكيد'}
            </Text>
            {confirmWarnings.map((w, i) => (
              <Text key={i} style={s.modalMsg}>
                • {w}
              </Text>
            ))}
            <Text style={s.modalQuestion}>هل تريد المتابعة؟</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.modalBtn, {backgroundColor: '#f3f4f6'}]}
                onPress={() => setShowConfirmModal(false)}>
                <Text style={[s.modalBtnText, {color: '#374151'}]}>
                  إلغاء
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, {backgroundColor: '#d97706'}]}
                onPress={handleConfirm}>
                <Text style={[s.modalBtnText, {color: '#fff'}]}>متابعة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffAttendanceScreen;

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: '#1a237e'},
  centerBox: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scroll: {flex: 1, padding: 16},

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  warningText: {fontSize: 13, color: '#92400e', fontWeight: '600'},

  // Check-in card
  checkCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  checkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusIndicator: {width: 12, height: 12, borderRadius: 6},
  checkStatusText: {fontSize: 16, fontWeight: '800', color: '#111827'},

  // Timer
  timerBox: {alignItems: 'center', paddingVertical: 20, gap: 4},
  timerText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1a237e',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {fontSize: 13, color: '#6b7280', fontWeight: '600'},

  // Completed
  completedBox: {backgroundColor: '#f9fafb', borderRadius: 14, padding: 14},
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  tBox: {alignItems: 'center', gap: 4},
  tLabel: {fontSize: 11, color: '#6b7280', fontWeight: '500'},
  tVal: {fontSize: 15, fontWeight: '800', color: '#111827'},
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  clockIcon: {alignItems: 'center', paddingVertical: 16},

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: {fontSize: 18, fontWeight: '800', color: '#fff'},
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 14,
  },
  doneText: {fontSize: 14, fontWeight: '700', color: '#059669'},
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  scheduleText: {fontSize: 13, color: '#6b7280', fontWeight: '600'},

  // Not enrolled
  notEnrolledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  notEnrolledSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // Section / Card
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardTitle: {fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12},
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {fontSize: 13, color: '#1a237e', fontWeight: '700'},

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  statNum: {fontSize: 22, fontWeight: '900', color: '#111827'},
  statLabel: {fontSize: 11, color: '#6b7280', fontWeight: '600'},

  // Distribution bar
  distBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  distSegment: {height: 14},
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  legendDot: {width: 8, height: 8, borderRadius: 4},
  legendText: {fontSize: 11, color: '#6b7280', fontWeight: '600'},

  // Today emp rows
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  empAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {fontSize: 14, fontWeight: '800', color: '#374151'},
  empName: {fontSize: 14, fontWeight: '600', color: '#111827'},
  empTime: {fontSize: 12, color: '#6b7280', marginTop: 2},
  empBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  empBadgeDot: {width: 6, height: 6, borderRadius: 3},
  empBadgeText: {fontSize: 11, fontWeight: '700'},

  // Actions
  actionsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20},
  actionCard: {
    width: '48%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {fontSize: 13, fontWeight: '700', color: '#374151'},

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  modalMsg: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
    marginBottom: 20,
  },
  modalBtns: {flexDirection: 'row', gap: 10, width: '100%'},
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalBtnText: {fontSize: 16, fontWeight: '700'},
});

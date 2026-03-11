import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Dimensions, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffAttendanceStatusArabic, StaffAttendanceStatusColor,
  type StaffAttendanceLog, type UserLogsResponse,
} from '../types/staffAttendance';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const STAT_WIDTH = (SCREEN_WIDTH - 48 - 16) / 3;

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const AVATAR_COLORS = ['#059669', '#dc2626', '#3b82f6', '#d97706', '#7c3aed', '#ec4899', '#0891b2', '#f43f5e'];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const StaffAttendanceEmployeeDetailScreen = ({navigation, route}: any) => {
  const {userId, userName, userEmail} = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<UserLogsResponse | null>(null);

  // Date range
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Detail modal
  const [detailLog, setDetailLog] = useState<StaffAttendanceLog | null>(null);

  // Location modal
  const [locationLog, setLocationLog] = useState<StaffAttendanceLog | null>(null);

  const getDateRange = useCallback(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedMonth, selectedYear]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const {startDate, endDate} = getDateRange();
      const result = await AuthService.getStaffLogsForUser(userId, {startDate, endDate});
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, getDateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-EG', {weekday: 'short', day: 'numeric', month: 'short'});
  const formatTime = (d?: string) => d ? new Date(d).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : '--:--';
  const formatMins = (m?: number) => {
    if (!m && m !== 0) return '-';
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}س ${min}د` : `${min}د`;
  };

  const user = data?.user || {name: userName || '', email: userEmail || ''};
  const stats = data?.stats;
  const logs = data?.logs || [];
  const avatarColor = getAvatarColor(user.name);

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 6}}>
          <Icon name="arrow-forward" size={22} color="#1a237e" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>ملف الموظف</Text>
        <TouchableOpacity onPress={onRefresh} style={{padding: 6}}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      {/* Breadcrumb */}
      <View style={st.breadcrumb}>
        <Text style={st.breadcrumbText}>الموظفين</Text>
        <Icon name="chevron-left" size={16} color="#9ca3af" />
        <Text style={st.breadcrumbActive} numberOfLines={1}>{user.name || 'تفاصيل'}</Text>
      </View>

      <ScrollView
        style={{flex: 1}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* Employee Header Card (gradient) */}
        <View style={st.profileCard}>
          <View style={[st.profileAvatar, {backgroundColor: avatarColor}]}>
            <Text style={st.profileAvatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={st.profileName}>{user.name}</Text>
          <Text style={st.profileEmail}>{user.email}</Text>
          {stats && (
            <View style={st.profileRateBadge}>
              <Icon name="trending-up" size={14} color="#059669" />
              <Text style={st.profileRateText}>
                نسبة الحضور: {Math.round(stats.attendanceRate || 0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Month Navigation */}
        <View style={st.monthNav}>
          <TouchableOpacity style={st.currentMonthBtn} onPress={goToCurrentMonth}>
            <Text style={st.currentMonthBtnText}>الشهر الحالي</Text>
          </TouchableOpacity>
          <View style={st.monthArrows}>
            <TouchableOpacity onPress={nextMonth} style={st.arrowBtn}>
              <Icon name="chevron-left" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={st.monthDisplay}>
              <Icon name="calendar-today" size={16} color="#374151" />
              <Text style={st.monthDisplayText}>{MONTHS[selectedMonth]} {selectedYear}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={prevMonth} style={st.arrowBtn}>
              <Icon name="chevron-right" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={st.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={st.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : (
          <>
            {/* 9 Stats Grid - matches web */}
            {stats && (
              <View style={st.statsGrid}>
                <View style={[st.statCard, {backgroundColor: '#f0f4ff'}]}>
                  <Icon name="date-range" size={18} color="#1a237e" />
                  <Text style={[st.statNum, {color: '#1a237e'}]}>{stats.totalDays || 0}</Text>
                  <Text style={st.statLabel}>إجمالي الأيام</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#ecfdf5'}]}>
                  <Icon name="check-circle" size={18} color="#059669" />
                  <Text style={[st.statNum, {color: '#059669'}]}>{stats.presentDays || 0}</Text>
                  <Text style={st.statLabel}>حاضر</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#fef2f2'}]}>
                  <Icon name="cancel" size={18} color="#dc2626" />
                  <Text style={[st.statNum, {color: '#dc2626'}]}>{stats.absentDays || 0}</Text>
                  <Text style={st.statLabel}>غائب</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#fef3c7'}]}>
                  <Icon name="schedule" size={18} color="#d97706" />
                  <Text style={[st.statNum, {color: '#d97706'}]}>{stats.lateDays || 0}</Text>
                  <Text style={st.statLabel}>متأخر</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#fdf2f8'}]}>
                  <Icon name="running-with-errors" size={18} color="#ec4899" />
                  <Text style={[st.statNum, {color: '#ec4899'}]}>{stats.earlyLeaveDays || 0}</Text>
                  <Text style={st.statLabel}>انصراف مبكر</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#eff6ff'}]}>
                  <Icon name="event-busy" size={18} color="#3b82f6" />
                  <Text style={[st.statNum, {color: '#3b82f6'}]}>{stats.excusedDays || 0}</Text>
                  <Text style={st.statLabel}>بإذن</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#f5f3ff'}]}>
                  <Icon name="timer" size={18} color="#7c3aed" />
                  <Text style={[st.statNum, {color: '#7c3aed'}]}>
                    {formatMins(stats.totalDays ? Math.round(stats.totalWorkedMinutes / stats.totalDays) : 0)}
                  </Text>
                  <Text style={st.statLabel}>متوسط العمل</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#ecfdf5'}]}>
                  <Icon name="more-time" size={18} color="#059669" />
                  <Text style={[st.statNum, {color: '#059669'}]}>{formatMins(stats.totalOvertimeMinutes)}</Text>
                  <Text style={st.statLabel}>إضافي</Text>
                </View>
                <View style={[st.statCard, {backgroundColor: '#fef3c7'}]}>
                  <Icon name="trending-up" size={18} color="#d97706" />
                  <Text style={[st.statNum, {color: '#d97706'}]}>{Math.round(stats.attendanceRate || 0)}%</Text>
                  <Text style={st.statLabel}>نسبة الحضور</Text>
                </View>
              </View>
            )}

            {/* Attendance Rate Bar */}
            {stats && (
              <View style={st.rateCard}>
                <View style={st.rateHeader}>
                  <Text style={st.rateTitle}>معدل الحضور الشهري</Text>
                  <Text style={st.rateValue}>{Math.round(stats.attendanceRate || 0)}%</Text>
                </View>
                <View style={st.rateBarBg}>
                  <View style={[st.rateBarFill, {width: `${Math.min(100, Math.round(stats.attendanceRate || 0))}%`}]} />
                </View>
              </View>
            )}

            {/* Logs */}
            <Text style={st.sectionTitle}>
              السجلات اليومية ({logs.length} يوم)
            </Text>

            {logs.length === 0 ? (
              <View style={st.emptyBox}>
                <Icon name="event-note" size={48} color="#d1d5db" />
                <Text style={st.emptyText}>لا توجد سجلات لهذا الشهر</Text>
              </View>
            ) : (
              logs.map(log => {
                const statusColor = StaffAttendanceStatusColor[log.status] || '#6b7280';
                const hasLocation = log.checkInLatitude && log.checkInLongitude;
                return (
                  <TouchableOpacity
                    key={log.id}
                    style={st.logCard}
                    activeOpacity={0.85}
                    onPress={() => setDetailLog(log)}>
                    <View style={st.logHeader}>
                      <View style={{flex: 1}}>
                        <Text style={st.logDate}>{formatDate(log.date)}</Text>
                      </View>
                      <View style={[st.statusBadge, {backgroundColor: statusColor + '18'}]}>
                        <View style={[st.statusDot, {backgroundColor: statusColor}]} />
                        <Text style={[st.statusBadgeText, {color: statusColor}]}>
                          {StaffAttendanceStatusArabic[log.status] || log.status}
                        </Text>
                      </View>
                    </View>
                    <View style={st.logDetails}>
                      <View style={st.logDetailItem}>
                        <Icon name="login" size={14} color="#059669" />
                        <Text style={st.logDetailLabel}>الحضور</Text>
                        <Text style={st.logDetailValue}>{formatTime(log.checkInTime)}</Text>
                      </View>
                      <View style={st.logDetailItem}>
                        <Icon name="logout" size={14} color="#dc2626" />
                        <Text style={st.logDetailLabel}>الانصراف</Text>
                        <Text style={st.logDetailValue}>{formatTime(log.checkOutTime)}</Text>
                      </View>
                      <View style={st.logDetailItem}>
                        <Icon name="schedule" size={14} color="#3b82f6" />
                        <Text style={st.logDetailLabel}>المدة</Text>
                        <Text style={st.logDetailValue}>{formatMins(log.workedMinutes)}</Text>
                      </View>
                      {log.overtimeMinutes && log.overtimeMinutes > 0 ? (
                        <View style={st.logDetailItem}>
                          <Icon name="more-time" size={14} color="#059669" />
                          <Text style={st.logDetailLabel}>إضافي</Text>
                          <Text style={[st.logDetailValue, {color: '#059669'}]}>{formatMins(log.overtimeMinutes)}</Text>
                        </View>
                      ) : null}
                    </View>
                    {/* Tags */}
                    {(log.isLate || log.isEarlyLeave || hasLocation) && (
                      <View style={st.logTags}>
                        {log.isLate && (
                          <View style={[st.tagChip, {backgroundColor: '#fef3c7'}]}>
                            <Icon name="warning" size={10} color="#d97706" />
                            <Text style={{fontSize: 10, fontWeight: '700', color: '#d97706'}}>
                              متأخر {log.lateMinutes ? `(${log.lateMinutes}د)` : ''}
                            </Text>
                          </View>
                        )}
                        {log.isEarlyLeave && (
                          <View style={[st.tagChip, {backgroundColor: '#fef2f2'}]}>
                            <Icon name="running-with-errors" size={10} color="#dc2626" />
                            <Text style={{fontSize: 10, fontWeight: '700', color: '#dc2626'}}>
                              انصراف مبكر {log.earlyLeaveMinutes ? `(${log.earlyLeaveMinutes}د)` : ''}
                            </Text>
                          </View>
                        )}
                        {hasLocation && (
                          <TouchableOpacity
                            style={[st.tagChip, {backgroundColor: '#eff6ff'}]}
                            onPress={() => setLocationLog(log)}>
                            <Icon name="location-on" size={10} color="#3b82f6" />
                            <Text style={{fontSize: 10, fontWeight: '700', color: '#3b82f6'}}>عرض الموقع</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {log.notes ? <Text style={st.logNotes}>📝 {log.notes}</Text> : null}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        <View style={{height: 30}} />
      </ScrollView>

      {/* ===== MONTH PICKER MODAL ===== */}
      <Modal visible={showMonthPicker} animationType="fade" transparent onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
          <View style={st.pickerBox}>
            <View style={st.yearRow}>
              <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
                <Icon name="chevron-left" size={28} color="#1a237e" />
              </TouchableOpacity>
              <Text style={st.yearText}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
                <Icon name="chevron-right" size={28} color="#1a237e" />
              </TouchableOpacity>
            </View>
            <View style={st.monthsGrid}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[st.monthItem, selectedMonth === i && st.monthItemActive]}
                  onPress={() => { setSelectedMonth(i); setShowMonthPicker(false); }}>
                  <Text style={[st.monthItemText, selectedMonth === i && {color: '#fff'}]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== LOG DETAIL MODAL ===== */}
      <Modal visible={!!detailLog} animationType="slide" transparent onRequestClose={() => setDetailLog(null)}>
        <View style={st.detailOverlay}>
          <View style={st.detailBox}>
            <View style={st.detailHeader}>
              <Text style={st.detailTitle}>تفاصيل السجل</Text>
              <TouchableOpacity onPress={() => setDetailLog(null)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {detailLog && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>التاريخ</Text>
                  <Text style={st.detailValue}>{formatDate(detailLog.date)}</Text>
                </View>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>الحالة</Text>
                  <Text style={[st.detailValue, {color: StaffAttendanceStatusColor[detailLog.status] || '#6b7280'}]}>
                    {StaffAttendanceStatusArabic[detailLog.status] || detailLog.status}
                  </Text>
                </View>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>الحضور</Text>
                  <Text style={st.detailValue}>{formatTime(detailLog.checkInTime)}</Text>
                </View>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>الانصراف</Text>
                  <Text style={st.detailValue}>{formatTime(detailLog.checkOutTime)}</Text>
                </View>
                <View style={st.detailRow}>
                  <Text style={st.detailLabel}>ساعات العمل</Text>
                  <Text style={st.detailValue}>{formatMins(detailLog.workedMinutes)}</Text>
                </View>
                {detailLog.requiredMinutes ? (
                  <View style={st.detailRow}>
                    <Text style={st.detailLabel}>الساعات المطلوبة</Text>
                    <Text style={st.detailValue}>{formatMins(detailLog.requiredMinutes)}</Text>
                  </View>
                ) : null}
                {detailLog.overtimeMinutes && detailLog.overtimeMinutes > 0 ? (
                  <View style={st.detailRow}>
                    <Text style={st.detailLabel}>وقت إضافي</Text>
                    <Text style={[st.detailValue, {color: '#059669'}]}>{formatMins(detailLog.overtimeMinutes)}</Text>
                  </View>
                ) : null}
                {detailLog.isLate && (
                  <View style={st.detailRow}>
                    <Text style={[st.detailLabel, {color: '#d97706'}]}>تأخر</Text>
                    <Text style={[st.detailValue, {color: '#d97706'}]}>{detailLog.lateMinutes}د</Text>
                  </View>
                )}
                {detailLog.isEarlyLeave && (
                  <View style={st.detailRow}>
                    <Text style={[st.detailLabel, {color: '#dc2626'}]}>انصراف مبكر</Text>
                    <Text style={[st.detailValue, {color: '#dc2626'}]}>{detailLog.earlyLeaveMinutes}د</Text>
                  </View>
                )}
                {detailLog.checkInZoneName && (
                  <View style={st.detailRow}>
                    <Text style={st.detailLabel}>منطقة الحضور</Text>
                    <Text style={st.detailValue}>{detailLog.checkInZoneName}</Text>
                  </View>
                )}
                {detailLog.checkInAddress && (
                  <View style={st.detailRow}>
                    <Text style={st.detailLabel}>عنوان الحضور</Text>
                    <Text style={st.detailValue}>{detailLog.checkInAddress}</Text>
                  </View>
                )}
                {detailLog.checkOutAddress && (
                  <View style={st.detailRow}>
                    <Text style={st.detailLabel}>عنوان الانصراف</Text>
                    <Text style={st.detailValue}>{detailLog.checkOutAddress}</Text>
                  </View>
                )}
                {detailLog.notes ? (
                  <View style={{marginTop: 8}}>
                    <Text style={st.detailLabel}>ملاحظات</Text>
                    <Text style={[st.detailValue, {marginTop: 4}]}>{detailLog.notes}</Text>
                  </View>
                ) : null}
                {/* Location buttons */}
                {(detailLog.checkInLatitude && detailLog.checkInLongitude) && (
                  <TouchableOpacity
                    style={st.mapBtn}
                    onPress={() => openInMaps(detailLog.checkInLatitude!, detailLog.checkInLongitude!)}>
                    <Icon name="location-on" size={18} color="#fff" />
                    <Text style={st.mapBtnText}>فتح موقع الحضور في الخريطة</Text>
                  </TouchableOpacity>
                )}
                {(detailLog.checkOutLatitude && detailLog.checkOutLongitude) && (
                  <TouchableOpacity
                    style={[st.mapBtn, {backgroundColor: '#dc2626'}]}
                    onPress={() => openInMaps(detailLog.checkOutLatitude!, detailLog.checkOutLongitude!)}>
                    <Icon name="location-on" size={18} color="#fff" />
                    <Text style={st.mapBtnText}>فتح موقع الانصراف في الخريطة</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== LOCATION MODAL ===== */}
      <Modal visible={!!locationLog} animationType="fade" transparent onRequestClose={() => setLocationLog(null)}>
        <View style={st.modalOverlay}>
          <View style={st.locationBox}>
            <View style={st.detailHeader}>
              <Text style={st.detailTitle}>الموقع الجغرافي</Text>
              <TouchableOpacity onPress={() => setLocationLog(null)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {locationLog && (
              <View style={{gap: 12}}>
                {locationLog.checkInLatitude && locationLog.checkInLongitude && (
                  <View style={st.locationCard}>
                    <View style={[st.locationIcon, {backgroundColor: '#ecfdf5'}]}>
                      <Icon name="login" size={20} color="#059669" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={st.locationTitle}>موقع الحضور</Text>
                      <Text style={st.locationCoords}>
                        {locationLog.checkInLatitude.toFixed(6)}, {locationLog.checkInLongitude.toFixed(6)}
                      </Text>
                      {locationLog.checkInAddress && (
                        <Text style={st.locationAddr}>{locationLog.checkInAddress}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={st.locationMapBtn}
                      onPress={() => openInMaps(locationLog.checkInLatitude!, locationLog.checkInLongitude!)}>
                      <Icon name="map" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                )}
                {locationLog.checkOutLatitude && locationLog.checkOutLongitude && (
                  <View style={st.locationCard}>
                    <View style={[st.locationIcon, {backgroundColor: '#fef2f2'}]}>
                      <Icon name="logout" size={20} color="#dc2626" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={st.locationTitle}>موقع الانصراف</Text>
                      <Text style={st.locationCoords}>
                        {locationLog.checkOutLatitude.toFixed(6)}, {locationLog.checkOutLongitude.toFixed(6)}
                      </Text>
                      {locationLog.checkOutAddress && (
                        <Text style={st.locationAddr}>{locationLog.checkOutAddress}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={st.locationMapBtn}
                      onPress={() => openInMaps(locationLog.checkOutLatitude!, locationLog.checkOutLongitude!)}>
                      <Icon name="map" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffAttendanceEmployeeDetailScreen;

const st = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  breadcrumb: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  breadcrumbText: {fontSize: 12, color: '#9ca3af'},
  breadcrumbActive: {fontSize: 12, color: '#1a237e', fontWeight: '600', flex: 1},

  // Profile Card
  profileCard: {
    alignItems: 'center', padding: 24, marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#1a237e', borderRadius: 20,
    shadowColor: '#1a237e', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  profileAvatar: {width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)'},
  profileAvatarText: {fontSize: 26, fontWeight: '900', color: '#fff'},
  profileName: {fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 12},
  profileEmail: {fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4},
  profileRateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
  },
  profileRateText: {fontSize: 13, fontWeight: '700', color: '#fff'},

  // Month Nav
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 12,
  },
  currentMonthBtn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#3b82f6', backgroundColor: '#eff6ff'},
  currentMonthBtnText: {fontSize: 13, fontWeight: '700', color: '#3b82f6'},
  monthArrows: {flexDirection: 'row', alignItems: 'center', gap: 4},
  arrowBtn: {padding: 6, borderRadius: 8, backgroundColor: '#fff'},
  monthDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  monthDisplayText: {fontSize: 14, fontWeight: '700', color: '#374151'},

  // Stats
  statsGrid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 12},
  statCard: {width: STAT_WIDTH, alignItems: 'center', padding: 10, borderRadius: 12},
  statNum: {fontSize: 16, fontWeight: '900', marginTop: 4},
  statLabel: {fontSize: 10, color: '#6b7280', fontWeight: '600', marginTop: 2, textAlign: 'center'},

  // Rate
  rateCard: {
    marginHorizontal: 16, marginTop: 12, padding: 14,
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  rateHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  rateTitle: {fontSize: 13, fontWeight: '700', color: '#374151'},
  rateValue: {fontSize: 16, fontWeight: '900', color: '#059669'},
  rateBarBg: {height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden'},
  rateBarFill: {height: '100%', backgroundColor: '#059669', borderRadius: 4},

  // Section Title
  sectionTitle: {fontSize: 15, fontWeight: '800', color: '#374151', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textAlign: 'right'},

  // Log Cards
  logCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  logHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
  logDate: {fontSize: 13, fontWeight: '700', color: '#111827'},
  statusBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  statusDot: {width: 7, height: 7, borderRadius: 4},
  statusBadgeText: {fontSize: 11, fontWeight: '700'},
  logDetails: {flexDirection: 'row', justifyContent: 'space-around'},
  logDetailItem: {alignItems: 'center', gap: 2},
  logDetailLabel: {fontSize: 10, color: '#9ca3af', fontWeight: '600'},
  logDetailValue: {fontSize: 12, color: '#374151', fontWeight: '700'},
  logTags: {flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap'},
  tagChip: {flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999},
  logNotes: {fontSize: 11, color: '#6b7280', marginTop: 6},

  // Loading / Empty
  loadingBox: {alignItems: 'center', padding: 40, gap: 10},
  loadingText: {fontSize: 13, color: '#6b7280'},
  emptyBox: {alignItems: 'center', padding: 60, gap: 12},
  emptyText: {fontSize: 15, color: '#6b7280', fontWeight: '600'},

  // Month Picker
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20},
  pickerBox: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%'},
  yearRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  yearText: {fontSize: 20, fontWeight: '900', color: '#1a237e'},
  monthsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  monthItem: {width: '30%', alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb'},
  monthItemActive: {backgroundColor: '#1a237e', borderColor: '#1a237e'},
  monthItemText: {fontSize: 13, fontWeight: '700', color: '#374151'},

  // Detail Modal
  detailOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  detailBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '75%',
  },
  detailHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  detailTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  detailLabel: {fontSize: 13, fontWeight: '600', color: '#6b7280'},
  detailValue: {fontSize: 14, fontWeight: '700', color: '#111827'},
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, marginTop: 12,
  },
  mapBtnText: {fontSize: 14, fontWeight: '700', color: '#fff'},

  // Location Modal
  locationBox: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400},
  locationCard: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#f9fafb', borderRadius: 12},
  locationIcon: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  locationTitle: {fontSize: 13, fontWeight: '700', color: '#111827'},
  locationCoords: {fontSize: 11, color: '#6b7280', marginTop: 2, fontVariant: ['tabular-nums']},
  locationAddr: {fontSize: 11, color: '#9ca3af', marginTop: 2},
  locationMapBtn: {padding: 8, borderRadius: 8, backgroundColor: '#eff6ff'},
});

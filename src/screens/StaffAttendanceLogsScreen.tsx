import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffAttendanceStatusArabic, StaffAttendanceStatusColor,
  type StaffAttendanceLog, type TodayEmployee, type UserLogsResponse,
} from '../types/staffAttendance';
import {usePermissions} from '../hooks/usePermissions';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

const AVATAR_COLORS = ['#059669', '#dc2626', '#3b82f6', '#d97706', '#7c3aed', '#ec4899', '#0891b2', '#f43f5e'];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const StaffAttendanceLogsScreen = ({navigation}: any) => {
  const {hasPermission} = usePermissions();
  const isAdminUser = hasPermission('staff-attendance', 'view') && hasPermission('staff-attendance.enrollments', 'view');

  // Employees list
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<TodayEmployee[]>([]);
  const [search, setSearch] = useState('');

  // Selected employee & their logs
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeLogs, setEmployeeLogs] = useState<UserLogsResponse | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Month picker
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Detail modal
  const [detailLog, setDetailLog] = useState<StaffAttendanceLog | null>(null);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // My logs (for non-admin users)
  const [myLogs, setMyLogs] = useState<StaffAttendanceLog[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [loadingMyLogs, setLoadingMyLogs] = useState(false);

  const getDateRange = useCallback(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedMonth, selectedYear]);

  // Load enrolled employees (admin) - matches web: GET /staff-attendance/today
  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const data = await AuthService.getTodayAttendance();
      const emps = data?.employees || [];
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch {
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  // Load selected employee's monthly logs (admin) - matches web: GET /logs/user/{userId}
  const loadEmployeeLogs = useCallback(async (userId: string) => {
    try {
      setLoadingLogs(true);
      const {startDate, endDate} = getDateRange();
      const data = await AuthService.getStaffLogsForUser(userId, {startDate, endDate});
      setEmployeeLogs(data);
    } catch {
      setEmployeeLogs(null);
    } finally {
      setLoadingLogs(false);
    }
  }, [getDateRange]);

  // Load my own logs (non-admin) - uses GET /my-logs
  const loadMyLogs = useCallback(async () => {
    try {
      setLoadingMyLogs(true);
      const {startDate, endDate} = getDateRange();
      const data = await AuthService.getMyAttendanceLogs({startDate, endDate, limit: 100});
      // Backend returns { logs: [...], total, stats } or just array
      const logs = data?.logs || (Array.isArray(data) ? data : []);
      setMyLogs(logs);
      setMyStats(data?.stats || null);
    } catch {
      setMyLogs([]);
      setMyStats(null);
    } finally {
      setLoadingMyLogs(false);
    }
  }, [getDateRange]);

  // Initial load
  useEffect(() => {
    if (isAdminUser) {
      loadEmployees();
    } else {
      loadMyLogs();
    }
  }, [isAdminUser, loadEmployees, loadMyLogs]);

  // When employee selected or month changed → reload logs
  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeLogs(selectedEmployee);
    }
  }, [selectedEmployee, loadEmployeeLogs]);

  // When month changes for non-admin
  useEffect(() => {
    if (!isAdminUser) {
      loadMyLogs();
    }
  }, [selectedMonth, selectedYear, isAdminUser, loadMyLogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isAdminUser) {
      await loadEmployees();
      if (selectedEmployee) {
        await loadEmployeeLogs(selectedEmployee);
      }
    } else {
      await loadMyLogs();
    }
    setRefreshing(false);
  };

  const handleSelectEmployee = (emp: TodayEmployee) => {
    if (selectedEmployee === emp.user.id) {
      setSelectedEmployee(null);
      setEmployeeLogs(null);
    } else {
      setSelectedEmployee(emp.user.id);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {weekday: 'short', day: 'numeric', month: 'short'});
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
  };

  const formatMinutes = (mins?: number) => {
    if (!mins && mins !== 0) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}س ${m}د`;
    return `${m}د`;
  };

  const STATUS_FILTERS = [
    {key: 'ALL', label: 'الكل'},
    {key: 'PRESENT', label: 'حاضر', color: '#059669'},
    {key: 'ABSENT_UNEXCUSED', label: 'غائب', color: '#dc2626'},
    {key: 'ABSENT_EXCUSED', label: 'بإذن', color: '#f59e0b'},
    {key: 'LEAVE', label: 'إجازة', color: '#3b82f6'},
  ];

  const filterLogs = (logs: StaffAttendanceLog[]) => {
    if (statusFilter === 'ALL') return logs;
    return logs.filter(l => l.status === statusFilter);
  };

  // Filter employees by search
  const filteredEmployees = employees.filter(emp => {
    if (!search) return true;
    const name = emp.user?.name?.toLowerCase() || '';
    const email = emp.user?.email?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  // ==================== RENDER HELPERS ====================

  const renderStats = (stats: any) => {
    if (!stats) return null;
    return (
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, {backgroundColor: '#ecfdf5'}]}>
          <Icon name="check-circle" size={20} color="#059669" />
          <Text style={[styles.statNum, {color: '#059669'}]}>{stats.presentDays || 0}</Text>
          <Text style={styles.statLabel}>حاضر</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#fef2f2'}]}>
          <Icon name="cancel" size={20} color="#dc2626" />
          <Text style={[styles.statNum, {color: '#dc2626'}]}>{stats.absentDays || 0}</Text>
          <Text style={styles.statLabel}>غائب</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#fef3c7'}]}>
          <Icon name="schedule" size={20} color="#d97706" />
          <Text style={[styles.statNum, {color: '#d97706'}]}>{stats.lateDays || 0}</Text>
          <Text style={styles.statLabel}>متأخر</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#eff6ff'}]}>
          <Icon name="event-busy" size={20} color="#3b82f6" />
          <Text style={[styles.statNum, {color: '#3b82f6'}]}>{stats.excusedDays || 0}</Text>
          <Text style={styles.statLabel}>بإذن</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#f5f3ff'}]}>
          <Icon name="timer" size={20} color="#7c3aed" />
          <Text style={[styles.statNum, {color: '#7c3aed'}]}>{formatMinutes(stats.totalWorkedMinutes)}</Text>
          <Text style={styles.statLabel}>ساعات العمل</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: '#fdf2f8'}]}>
          <Icon name="more-time" size={20} color="#ec4899" />
          <Text style={[styles.statNum, {color: '#ec4899'}]}>{formatMinutes(stats.totalOvertimeMinutes)}</Text>
          <Text style={styles.statLabel}>إضافي</Text>
        </View>
      </View>
    );
  };

  const renderStatusFilterChips = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{paddingHorizontal: 16, gap: 8}}>
      {STATUS_FILTERS.map(f => {
        const active = statusFilter === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, active && {backgroundColor: f.color || '#1a237e', borderColor: f.color || '#1a237e'}]}
            onPress={() => setStatusFilter(f.key)}>
            <Text style={[styles.filterChipText, active && {color: '#fff'}]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderLogCards = (logs: StaffAttendanceLog[], showUserName: boolean) => {
    const filtered = filterLogs(logs);
    if (filtered.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Icon name="event-note" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>
            {statusFilter !== 'ALL' ? 'لا توجد سجلات بهذه الحالة' : 'لا توجد سجلات لهذا الشهر'}
          </Text>
        </View>
      );
    }

    return (
      <View style={{marginTop: 12}}>
        <Text style={styles.sectionTitle}>
          السجلات اليومية ({filtered.length} يوم)
        </Text>
        {filtered.map(log => (
          <TouchableOpacity
            key={log.id}
            style={styles.logCard}
            activeOpacity={0.85}
            onPress={() => setDetailLog(log)}>
            <View style={styles.logHeader}>
              <View style={{flex: 1}}>
                {showUserName && log.user && (
                  <Text style={styles.logName}>{log.user.name}</Text>
                )}
                <Text style={styles.logDate}>{formatDate(log.date)}</Text>
              </View>
              <View style={[styles.statusBadge, {backgroundColor: (StaffAttendanceStatusColor[log.status] || '#6b7280') + '18'}]}>
                <View style={[styles.statusDot, {backgroundColor: StaffAttendanceStatusColor[log.status] || '#6b7280'}]} />
                <Text style={[styles.statusText, {color: StaffAttendanceStatusColor[log.status] || '#6b7280'}]}>
                  {StaffAttendanceStatusArabic[log.status] || log.status}
                </Text>
              </View>
            </View>
            <View style={styles.logDetails}>
              <View style={styles.logDetailItem}>
                <Icon name="login" size={14} color="#059669" />
                <Text style={styles.logDetailLabel}>الحضور</Text>
                <Text style={styles.logDetailValue}>{formatTime(log.checkInTime)}</Text>
              </View>
              <View style={styles.logDetailItem}>
                <Icon name="logout" size={14} color="#dc2626" />
                <Text style={styles.logDetailLabel}>الانصراف</Text>
                <Text style={styles.logDetailValue}>{formatTime(log.checkOutTime)}</Text>
              </View>
              <View style={styles.logDetailItem}>
                <Icon name="schedule" size={14} color="#3b82f6" />
                <Text style={styles.logDetailLabel}>المدة</Text>
                <Text style={styles.logDetailValue}>{formatMinutes(log.workedMinutes)}</Text>
              </View>
            </View>
            {(log.isLate || log.isEarlyLeave || (log.overtimeMinutes && log.overtimeMinutes > 0)) && (
              <View style={styles.logTags}>
                {log.isLate && (
                  <View style={[styles.tagChip, {backgroundColor: '#fef3c7'}]}>
                    <Icon name="warning" size={10} color="#d97706" />
                    <Text style={{fontSize: 10, fontWeight: '700', color: '#d97706'}}>
                      متأخر {log.lateMinutes ? `(${log.lateMinutes}د)` : ''}
                    </Text>
                  </View>
                )}
                {log.isEarlyLeave && (
                  <View style={[styles.tagChip, {backgroundColor: '#fef2f2'}]}>
                    <Icon name="running-with-errors" size={10} color="#dc2626" />
                    <Text style={{fontSize: 10, fontWeight: '700', color: '#dc2626'}}>
                      انصراف مبكر {log.earlyLeaveMinutes ? `(${log.earlyLeaveMinutes}د)` : ''}
                    </Text>
                  </View>
                )}
                {log.overtimeMinutes && log.overtimeMinutes > 0 ? (
                  <View style={[styles.tagChip, {backgroundColor: '#ecfdf5'}]}>
                    <Icon name="more-time" size={10} color="#059669" />
                    <Text style={{fontSize: 10, fontWeight: '700', color: '#059669'}}>
                      إضافي ({formatMinutes(log.overtimeMinutes)})
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
            {log.notes ? <Text style={styles.logNotes}>📝 {log.notes}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceLogs" />
        <Text style={styles.headerTitle}>سجلات الحضور</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>الرئيسية</Text>
        <Icon name="chevron-left" size={16} color="#9ca3af" />
        <Text style={styles.breadcrumbText}>الموارد البشرية</Text>
        <Icon name="chevron-left" size={16} color="#9ca3af" />
        <Text style={styles.breadcrumbTextActive}>سجلات الحضور</Text>
      </View>

      {/* Page Title */}
      <View style={styles.pageTitleBox}>
        <Text style={styles.pageTitle}>سجلات حضور الموظفين</Text>
        <Text style={styles.pageSubtitle}>
          {isAdminUser
            ? 'اختر موظف لعرض سجل حضوره الشهري بالتفصيل'
            : 'سجل حضورك الشهري بالتفصيل'}
        </Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.currentMonthBtn} onPress={goToCurrentMonth}>
          <Text style={styles.currentMonthBtnText}>الشهر الحالي</Text>
        </TouchableOpacity>
        <View style={styles.monthArrows}>
          <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
            <Icon name="chevron-left" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthDisplay}>
            <Icon name="calendar-today" size={16} color="#374151" />
            <Text style={styles.monthDisplayText}>{MONTHS[selectedMonth]} {selectedYear}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
            <Icon name="chevron-right" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* ========== ADMIN VIEW: Employee Grid ========== */}
        {isAdminUser && !selectedEmployee && (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Icon name="search" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="بحث بالاسم..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Total employees count */}
            <View style={styles.totalCount}>
              <Icon name="people" size={18} color="#6b7280" />
              <Text style={styles.totalCountText}>إجمالي الموظفين: {filteredEmployees.length}</Text>
            </View>

            {/* Employees Grid */}
            {loadingEmployees ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل الموظفين...</Text>
              </View>
            ) : filteredEmployees.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="people-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {search ? 'لا توجد نتائج للبحث' : 'لا يوجد موظفين مسجلين'}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  الموظفون المسجلون
                </Text>
                <View style={styles.employeesGrid}>
                  {filteredEmployees.map(emp => {
                    const color = getAvatarColor(emp.user.name);
                    const statusColor = StaffAttendanceStatusColor[emp.status] || '#9ca3af';
                    return (
                      <TouchableOpacity
                        key={emp.user.id}
                        style={styles.empCard}
                        onPress={() => handleSelectEmployee(emp)}
                        activeOpacity={0.7}>
                        <View style={styles.empAvatarContainer}>
                          <View style={[styles.empAvatarRing, {borderColor: statusColor}]}>
                            <View style={[styles.empAvatar, {backgroundColor: color}]}>
                              <Text style={styles.empAvatarText}>
                                {getInitials(emp.user.name)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={styles.empName} numberOfLines={1}>
                          {emp.user.name}
                        </Text>
                        <Text style={styles.empEmail} numberOfLines={1}>
                          {emp.user.email}
                        </Text>
                        <View style={[styles.empStatusBadge, {backgroundColor: statusColor + '18'}]}>
                          <View style={[styles.empStatusDot, {backgroundColor: statusColor}]} />
                          <Text style={[styles.empStatusText, {color: statusColor}]}>
                            {StaffAttendanceStatusArabic[emp.status] || emp.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* ========== ADMIN VIEW: Selected Employee Logs ========== */}
        {isAdminUser && selectedEmployee && (
          <>
            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setSelectedEmployee(null);
                setEmployeeLogs(null);
              }}>
              <Icon name="arrow-forward" size={20} color="#1a237e" />
              <Text style={styles.backBtnText}>العودة لقائمة الموظفين</Text>
            </TouchableOpacity>

            {/* Employee header */}
            {employeeLogs?.user && (
              <View style={styles.empHeaderCard}>
                <View style={[styles.empHeaderAvatar, {backgroundColor: getAvatarColor(employeeLogs.user.name)}]}>
                  <Text style={styles.empHeaderAvatarText}>
                    {getInitials(employeeLogs.user.name)}
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.empHeaderName}>{employeeLogs.user.name}</Text>
                  <Text style={styles.empHeaderEmail}>{employeeLogs.user.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  onPress={() => navigation.navigate('StaffAttendanceEmployeeDetail', {
                    userId: selectedEmployee,
                    userName: employeeLogs.user.name,
                    userEmail: employeeLogs.user.email,
                  })}>
                  <Icon name="person" size={16} color="#1a237e" />
                  <Text style={styles.viewProfileBtnText}>الملف</Text>
                </TouchableOpacity>
              </View>
            )}

            {loadingLogs ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل السجلات...</Text>
              </View>
            ) : (
              <>
                {/* Stats Cards */}
                {renderStats(employeeLogs?.stats)}

                {/* Attendance Rate Bar */}
                {employeeLogs?.stats && (
                  <View style={styles.rateCard}>
                    <View style={styles.rateHeader}>
                      <Text style={styles.rateTitle}>نسبة الحضور</Text>
                      <Text style={styles.rateValue}>
                        {Math.round(employeeLogs.stats.attendanceRate || 0)}%
                      </Text>
                    </View>
                    <View style={styles.rateBarBg}>
                      <View
                        style={[
                          styles.rateBarFill,
                          {width: `${Math.min(100, Math.round(employeeLogs.stats.attendanceRate || 0))}%`},
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Status Filter + Log Cards */}
                {renderStatusFilterChips()}
                {renderLogCards(employeeLogs?.logs || [], true)}
              </>
            )}
          </>
        )}

        {/* ========== NON-ADMIN VIEW: My Logs ========== */}
        {!isAdminUser && (
          <>
            {loadingMyLogs ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل السجلات...</Text>
              </View>
            ) : (
              <>
                {renderStats(myStats)}
                {myStats?.attendanceRate !== undefined && (
                  <View style={styles.rateCard}>
                    <View style={styles.rateHeader}>
                      <Text style={styles.rateTitle}>نسبة الحضور</Text>
                      <Text style={styles.rateValue}>
                        {Math.round(myStats.attendanceRate || 0)}%
                      </Text>
                    </View>
                    <View style={styles.rateBarBg}>
                      <View
                        style={[
                          styles.rateBarFill,
                          {width: `${Math.min(100, Math.round(myStats.attendanceRate || 0))}%`},
                        ]}
                      />
                    </View>
                  </View>
                )}
                {renderStatusFilterChips()}
                {renderLogCards(myLogs, false)}
              </>
            )}
          </>
        )}

        <View style={{height: 30}} />
      </ScrollView>

      {/* ========== MONTH PICKER MODAL ========== */}
      <Modal visible={showMonthPicker} animationType="fade" transparent onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
          <View style={styles.pickerBox}>
            <View style={styles.yearRow}>
              <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)}>
                <Icon name="chevron-left" size={28} color="#1a237e" />
              </TouchableOpacity>
              <Text style={styles.yearText}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)}>
                <Icon name="chevron-right" size={28} color="#1a237e" />
              </TouchableOpacity>
            </View>
            <View style={styles.monthsGrid}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.monthItem, selectedMonth === i && styles.monthItemActive]}
                  onPress={() => {
                    setSelectedMonth(i);
                    setShowMonthPicker(false);
                  }}>
                  <Text style={[styles.monthItemText, selectedMonth === i && {color: '#fff'}]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========== LOG DETAIL MODAL ========== */}
      <Modal visible={!!detailLog} animationType="slide" transparent onRequestClose={() => setDetailLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailBox}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>تفاصيل السجل</Text>
              <TouchableOpacity onPress={() => setDetailLog(null)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {detailLog && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {detailLog.user && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>الموظف</Text>
                    <Text style={styles.detailValue}>{detailLog.user.name}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>التاريخ</Text>
                  <Text style={styles.detailValue}>{formatDate(detailLog.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الحالة</Text>
                  <Text style={[styles.detailValue, {color: StaffAttendanceStatusColor[detailLog.status] || '#6b7280'}]}>
                    {StaffAttendanceStatusArabic[detailLog.status] || detailLog.status}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الحضور</Text>
                  <Text style={styles.detailValue}>{formatTime(detailLog.checkInTime)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>الانصراف</Text>
                  <Text style={styles.detailValue}>{formatTime(detailLog.checkOutTime)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ساعات العمل</Text>
                  <Text style={styles.detailValue}>{formatMinutes(detailLog.workedMinutes)}</Text>
                </View>
                {detailLog.requiredMinutes ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>الساعات المطلوبة</Text>
                    <Text style={styles.detailValue}>{formatMinutes(detailLog.requiredMinutes)}</Text>
                  </View>
                ) : null}
                {detailLog.overtimeMinutes && detailLog.overtimeMinutes > 0 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>وقت إضافي</Text>
                    <Text style={[styles.detailValue, {color: '#059669'}]}>{formatMinutes(detailLog.overtimeMinutes)}</Text>
                  </View>
                ) : null}
                {detailLog.isLate && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, {color: '#d97706'}]}>تأخر</Text>
                    <Text style={[styles.detailValue, {color: '#d97706'}]}>{detailLog.lateMinutes}د</Text>
                  </View>
                )}
                {detailLog.isEarlyLeave && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, {color: '#dc2626'}]}>انصراف مبكر</Text>
                    <Text style={[styles.detailValue, {color: '#dc2626'}]}>{detailLog.earlyLeaveMinutes}د</Text>
                  </View>
                )}
                {detailLog.checkInZoneName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>منطقة الحضور</Text>
                    <Text style={styles.detailValue}>{detailLog.checkInZoneName}</Text>
                  </View>
                )}
                {detailLog.checkInAddress && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>عنوان الحضور</Text>
                    <Text style={styles.detailValue}>{detailLog.checkInAddress}</Text>
                  </View>
                )}
                {detailLog.checkOutAddress && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>عنوان الانصراف</Text>
                    <Text style={styles.detailValue}>{detailLog.checkOutAddress}</Text>
                  </View>
                )}
                {detailLog.notes ? (
                  <View style={{marginTop: 8}}>
                    <Text style={styles.detailLabel}>ملاحظات</Text>
                    <Text style={[styles.detailValue, {marginTop: 4}]}>{detailLog.notes}</Text>
                  </View>
                ) : null}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffAttendanceLogsScreen;

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  refreshBtn: {padding: 6},

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  breadcrumbText: {fontSize: 12, color: '#9ca3af'},
  breadcrumbTextActive: {fontSize: 12, color: '#1a237e', fontWeight: '600'},

  // Page Title
  pageTitleBox: {
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  pageTitle: {fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'right'},
  pageSubtitle: {fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'right'},

  // Month Navigation
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  currentMonthBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#3b82f6', backgroundColor: '#eff6ff',
  },
  currentMonthBtnText: {fontSize: 13, fontWeight: '700', color: '#3b82f6'},
  monthArrows: {flexDirection: 'row', alignItems: 'center', gap: 4},
  arrowBtn: {padding: 6, borderRadius: 8, backgroundColor: '#f9fafb'},
  monthDisplay: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  monthDisplayText: {fontSize: 14, fontWeight: '700', color: '#374151'},

  // Content
  content: {flex: 1},

  // Status Filter
  filterRow: {marginTop: 8, marginBottom: 4},
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  filterChipText: {fontSize: 12, fontWeight: '700', color: '#6b7280'},

  // Search
  searchContainer: {paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6},
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: {flex: 1, fontSize: 14, color: '#111827', padding: 0},

  // Total count
  totalCount: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'flex-end',
  },
  totalCountText: {fontSize: 13, color: '#6b7280', fontWeight: '600'},

  // Section Title
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#374151',
    paddingHorizontal: 16, paddingVertical: 8, textAlign: 'right',
  },

  // Employees Grid
  employeesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
    gap: 12, paddingBottom: 20,
  },
  empCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  empAvatarContainer: {marginBottom: 10},
  empAvatarRing: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  empAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
  },
  empAvatarText: {fontSize: 18, fontWeight: '900', color: '#fff'},
  empName: {fontSize: 13, fontWeight: '800', color: '#111827', textAlign: 'center'},
  empEmail: {fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 2},
  empStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 8,
  },
  empStatusDot: {width: 6, height: 6, borderRadius: 3},
  empStatusText: {fontSize: 10, fontWeight: '700'},

  // Back button
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtnText: {fontSize: 14, fontWeight: '700', color: '#1a237e'},

  // Employee Header Card
  empHeaderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  empHeaderAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  empHeaderAvatarText: {fontSize: 18, fontWeight: '900', color: '#fff'},
  empHeaderName: {fontSize: 16, fontWeight: '800', color: '#111827'},
  empHeaderEmail: {fontSize: 12, color: '#6b7280', marginTop: 2},
  viewProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#c7d2fe',
  },
  viewProfileBtnText: {fontSize: 12, fontWeight: '700', color: '#1a237e'},

  // Stats Grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8,
    marginBottom: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 48 - 16) / 3, alignItems: 'center',
    padding: 10, borderRadius: 12,
  },
  statNum: {fontSize: 18, fontWeight: '900', marginTop: 4},
  statLabel: {fontSize: 10, color: '#6b7280', fontWeight: '600', marginTop: 2},

  // Rate Card
  rateCard: {
    marginHorizontal: 16, marginBottom: 12, padding: 14,
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  rateHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  rateTitle: {fontSize: 13, fontWeight: '700', color: '#374151'},
  rateValue: {fontSize: 16, fontWeight: '900', color: '#059669'},
  rateBarBg: {height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden'},
  rateBarFill: {height: '100%', backgroundColor: '#059669', borderRadius: 4},

  // Log Cards
  logCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  logHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
  logName: {fontSize: 14, fontWeight: '700', color: '#111827'},
  logDate: {fontSize: 12, color: '#6b7280'},
  statusBadge: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  statusDot: {width: 7, height: 7, borderRadius: 4},
  statusText: {fontSize: 11, fontWeight: '700'},
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

  // Month Picker Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20},
  pickerBox: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%'},
  yearRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  yearText: {fontSize: 20, fontWeight: '900', color: '#1a237e'},
  monthsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  monthItem: {
    width: '30%', alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  monthItemActive: {backgroundColor: '#1a237e', borderColor: '#1a237e'},
  monthItemText: {fontSize: 13, fontWeight: '700', color: '#374151'},

  // Detail Modal
  detailBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, width: '100%', maxHeight: '75%', position: 'absolute', bottom: 0,
  },
  detailHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  detailTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  detailLabel: {fontSize: 13, fontWeight: '600', color: '#6b7280'},
  detailValue: {fontSize: 14, fontWeight: '700', color: '#111827'},
});

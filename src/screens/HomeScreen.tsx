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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import BranchService from '../services/BranchService';
import {usePermissions} from '../hooks/usePermissions';

const {width} = Dimensions.get('window');
const CARD_W = (width - 38) / 2;

// ====== Main Component ======
const HomeScreen = ({navigation}: any) => {
  const {userRoleInfo, isAdmin, isSuperAdmin} = usePermissions();
  const canAccessFinancial =
    isSuperAdmin || isAdmin || userRoleInfo?.name === 'accountant';

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

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [branch, dashboard] =
        await Promise.all([
          BranchService.getSelectedBranch().catch(() => null),
          AuthService.getComprehensiveDashboard().catch(() => null),
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
    } catch (e) {
      console.error('HomeScreen fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canAccessFinancial]);

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

  const quickActions = [
    {icon: 'school', label: 'الطلاب', screen: 'StudentsList', bg: '#1a237e'},
    {icon: 'book', label: 'البرامج', screen: 'Programs', bg: '#059669'},
    {icon: 'schedule', label: 'الجداول', screen: 'Schedules', bg: '#0ea5e9'},
    {
      icon: 'fingerprint',
      label: 'الحضور',
      screen: 'StaffAttendance',
      bg: '#7c3aed',
    },
    ...(canAccessFinancial
      ? [
          {
            icon: 'account-balance',
            label: 'الخزائن',
            screen: 'Treasury',
            bg: '#dc2626',
          },
          {
            icon: 'account-balance-wallet',
            label: 'الرسوم',
            screen: 'Fees',
            bg: '#d97706',
          },
        ]
      : []),
    {
      icon: 'groups',
      label: 'التوزيع',
      screen: 'DistributionManagement',
      bg: '#6366f1',
    },
    {icon: 'lock', label: 'الصلاحيات', screen: 'Permissions', bg: '#475569'},
  ];

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      {/* Header */}
      <View style={st.header}>
        <CustomMenu navigation={navigation} activeRouteName="Home" />
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>الرئيسية</Text>
          {branchName ? (
            <Text style={st.branchBadge}>{branchName}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={st.refreshBtn} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
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
            <Text style={st.sectionTitle}>الإحصائيات العامة</Text>
            <View style={st.statsGrid}>
              <View style={[st.statCard, {borderTopColor: '#1a237e'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#eef2ff'}]}>
                  <Icon name="school" size={22} color="#1a237e" />
                </View>
                <Text style={st.statNum}>{stats.totalTrainees}</Text>
                <Text style={st.statLabel}>إجمالي المتدربين</Text>
              </View>
              <View style={[st.statCard, {borderTopColor: '#059669'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#ecfdf5'}]}>
                  <Icon name="person" size={22} color="#059669" />
                </View>
                <Text style={st.statNum}>{stats.activeTrainees}</Text>
                <Text style={st.statLabel}>متدربون نشطون</Text>
              </View>
              <View style={[st.statCard, {borderTopColor: '#0ea5e9'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#ecfeff'}]}>
                  <Icon name="menu-book" size={22} color="#0ea5e9" />
                </View>
                <Text style={st.statNum}>{stats.totalPrograms}</Text>
                <Text style={st.statLabel}>البرامج التدريبية</Text>
              </View>
              <View style={[st.statCard, {borderTopColor: '#7c3aed'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#f5f3ff'}]}>
                  <Icon name="bar-chart" size={22} color="#7c3aed" />
                </View>
                <Text style={st.statNum}>{stats.attendanceRate}%</Text>
                <Text style={st.statLabel}>نسبة الحضور</Text>
              </View>

              {canAccessFinancial && (
                <View style={[st.statCard, {borderTopColor: '#16a34a'}]}>
                  <View
                    style={[st.statIconBox, {backgroundColor: '#f0fdf4'}]}>
                    <Icon name="trending-up" size={22} color="#16a34a" />
                  </View>
                  <Text style={st.statNum}>{Math.round(stats.monthlyRevenue).toLocaleString()}</Text>
                  <Text style={st.statLabel}>إيراد الشهر (ج.م)</Text>
                </View>
              )}
              {canAccessFinancial && (
                <View style={[st.statCard, {borderTopColor: '#dc2626'}]}>
                  <View
                    style={[st.statIconBox, {backgroundColor: '#fef2f2'}]}>
                    <Icon name="trending-down" size={22} color="#dc2626" />
                  </View>
                  <Text style={st.statNum}>{Math.round(stats.monthlyExpenses).toLocaleString()}</Text>
                  <Text style={st.statLabel}>مصروفات الشهر (ج.م)</Text>
                </View>
              )}
            </View>

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

            {canAccessFinancial && (
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

            <View style={st.chartCard}>
              <Text style={st.chartTitle}>آخر المدفوعات</Text>
              {recentPayments.length === 0 ? (
                <Text style={st.emptyText}>لا توجد مدفوعات حديثة</Text>
              ) : (
                recentPayments.slice(0, 5).map((item, idx) => (
                  <View key={item.id || idx} style={st.rowItem}>
                    <View style={st.rowIconBox}>
                      <Icon name="payments" size={16} color="#059669" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={st.rowTitle}>{item.traineeName}</Text>
                      <Text style={st.rowSub}>{item.programName}</Text>
                    </View>
                    <Text style={st.rowAmount}>{Math.round(item.amount || 0).toLocaleString()} ج.م</Text>
                  </View>
                ))
              )}
            </View>

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

            {/* ---- Quick Actions ---- */}
            <Text style={st.sectionTitle}>الوصول السريع</Text>
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

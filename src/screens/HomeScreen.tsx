import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import BranchService from '../services/BranchService';
import {usePermissions} from '../hooks/usePermissions';

const {width} = Dimensions.get('window');
const CARD_W = (width - 56) / 2;

// ====== Animated Horizontal Bar ======
const AnimBar = ({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color: string;
  delay?: number;
}) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: Math.min(pct, 100),
      duration: 900,
      delay,
      useNativeDriver: false,
    }).start();
  }, [pct, delay, w]);
  return (
    <View style={barStyles.track}>
      <Animated.View
        style={[
          barStyles.fill,
          {
            backgroundColor: color,
            width: w.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const barStyles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  fill: {height: 10, borderRadius: 5},
});

// ====== Vertical Mini Bar Chart ======
const VerticalBarChart = ({
  data,
}: {
  data: {label: string; value: number; color: string}[];
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barAnims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    barAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 700,
        delay: i * 120,
        useNativeDriver: false,
      }).start();
    });
  }, [barAnims]);

  return (
    <View style={vbStyles.container}>
      {data.map((d, i) => {
        const targetH = Math.max((d.value / maxVal) * 100, 6);
        return (
          <View key={d.label} style={vbStyles.col}>
            <Text style={[vbStyles.value, {color: d.color}]}>{d.value}</Text>
            <Animated.View
              style={[
                vbStyles.bar,
                {
                  backgroundColor: d.color,
                  height: barAnims[i]
                    ? barAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, targetH],
                      })
                    : targetH,
                },
              ]}
            />
            <Text style={vbStyles.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const vbStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150,
    paddingTop: 10,
    paddingBottom: 4,
  },
  col: {alignItems: 'center', flex: 1},
  value: {fontSize: 13, fontWeight: '800', marginBottom: 6},
  bar: {width: 30, borderRadius: 8, minHeight: 6},
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// ====== Main Component ======
const HomeScreen = ({navigation}: any) => {
  const {userRoleInfo, isAdmin, isSuperAdmin} = usePermissions();
  const canAccessFinancial =
    isSuperAdmin || isAdmin || userRoleInfo?.name === 'accountant';

  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalStudents: 0,
    totalFees: 0,
    totalSafes: 0,
    activeStudents: 0,
    appliedFees: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branchName, setBranchName] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [branch, programs, studentsResp, activeResp, fees, safes] =
        await Promise.all([
          BranchService.getSelectedBranch().catch(() => null),
          AuthService.getAllPrograms().catch(() => []),
          AuthService.getTrainees({
            page: 1,
            limit: 1,
            includeDetails: false,
          }).catch(() => ({data: [], pagination: {total: 0}})),
          AuthService.getTrainees({
            page: 1,
            limit: 1,
            includeDetails: false,
            status: 'ACTIVE',
          }).catch(() => ({data: [], pagination: {total: 0}})),
          canAccessFinancial
            ? AuthService.getAllTraineeFees().catch(() => [])
            : Promise.resolve([]),
          canAccessFinancial
            ? AuthService.getAllSafes().catch(() => [])
            : Promise.resolve([]),
        ]);

      if (branch) {
        setBranchName(branch.name);
      }

      const appliedFees = (fees as any[]).filter(
        (f: any) => f.isApplied,
      ).length;
      const totalBalance = (safes as any[]).reduce(
        (sum: number, safe: any) => sum + safe.balance,
        0,
      );

      setStats({
        totalPrograms: (programs as any[]).length,
        totalStudents:
          (studentsResp as any).pagination?.total ||
          (studentsResp as any).data?.length ||
          0,
        totalFees: (fees as any[]).length,
        totalSafes: (safes as any[]).length,
        activeStudents:
          (activeResp as any).pagination?.total ||
          (activeResp as any).data?.length ||
          0,
        appliedFees,
        totalBalance,
      });
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

  const studentActivePct =
    stats.totalStudents > 0
      ? (stats.activeStudents / stats.totalStudents) * 100
      : 0;
  const feesAppliedPct =
    stats.totalFees > 0 ? (stats.appliedFees / stats.totalFees) * 100 : 0;
  const inactiveStudents = stats.totalStudents - stats.activeStudents;
  const unappliedFees = stats.totalFees - stats.appliedFees;

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
    <View style={st.container}>
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
        <Animated.View style={[st.welcomeCard, {opacity: fadeAnim}]}>
          <Image
            source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
            style={st.logo}
            resizeMode="contain"
          />
          <View style={{flex: 1}}>
            <Text style={st.greeting}>
              {greeting} {'👋'}
            </Text>
            <Text style={st.welcomeTitle}>مركز طيبة للتدريب</Text>
            <Text style={st.dateText}>{dateStr}</Text>
          </View>
        </Animated.View>

        {loading ? (
          <View style={st.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={st.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : (
          <>
            {/* ---- Overview Stats ---- */}
            <Text style={st.sectionTitle}>نظرة عامة</Text>
            <View style={st.statsGrid}>
              <View style={[st.statCard, {borderTopColor: '#1a237e'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#eef2ff'}]}>
                  <Icon name="book" size={22} color="#1a237e" />
                </View>
                <Text style={st.statNum}>{stats.totalPrograms}</Text>
                <Text style={st.statLabel}>البرامج</Text>
              </View>
              <View style={[st.statCard, {borderTopColor: '#059669'}]}>
                <View style={[st.statIconBox, {backgroundColor: '#ecfdf5'}]}>
                  <Icon name="school" size={22} color="#059669" />
                </View>
                <Text style={st.statNum}>{stats.totalStudents}</Text>
                <Text style={st.statLabel}>الطلاب</Text>
                <Text style={st.statSub}>{stats.activeStudents} نشط</Text>
              </View>
              {canAccessFinancial && (
                <View style={[st.statCard, {borderTopColor: '#d97706'}]}>
                  <View
                    style={[st.statIconBox, {backgroundColor: '#fffbeb'}]}>
                    <Icon
                      name="account-balance-wallet"
                      size={22}
                      color="#d97706"
                    />
                  </View>
                  <Text style={st.statNum}>{stats.totalFees}</Text>
                  <Text style={st.statLabel}>الرسوم</Text>
                  <Text style={st.statSub}>{stats.appliedFees} مطبقة</Text>
                </View>
              )}
              {canAccessFinancial && (
                <View style={[st.statCard, {borderTopColor: '#7c3aed'}]}>
                  <View
                    style={[st.statIconBox, {backgroundColor: '#f5f3ff'}]}>
                    <Icon name="account-balance" size={22} color="#7c3aed" />
                  </View>
                  <Text style={st.statNum}>{stats.totalSafes}</Text>
                  <Text style={st.statLabel}>الخزائن</Text>
                  <Text style={st.statSub}>
                    {stats.totalBalance.toLocaleString()} ج.م
                  </Text>
                </View>
              )}
            </View>

            {/* ---- Analytics: Vertical Bar Chart ---- */}
            <Text style={st.sectionTitle}>التحليلات</Text>
            <View style={st.chartCard}>
              <Text style={st.chartTitle}>مقارنة البيانات</Text>
              <VerticalBarChart
                data={[
                  {
                    label: 'البرامج',
                    value: stats.totalPrograms,
                    color: '#1a237e',
                  },
                  {
                    label: 'الطلاب',
                    value: stats.totalStudents,
                    color: '#059669',
                  },
                  {
                    label: 'نشط',
                    value: stats.activeStudents,
                    color: '#0ea5e9',
                  },
                  ...(canAccessFinancial
                    ? [
                        {
                          label: 'الرسوم',
                          value: stats.totalFees,
                          color: '#d97706',
                        },
                        {
                          label: 'الخزائن',
                          value: stats.totalSafes,
                          color: '#7c3aed',
                        },
                      ]
                    : []),
                ]}
              />
            </View>

            {/* ---- Student Status Bars ---- */}
            <View style={st.chartCard}>
              <Text style={st.chartTitle}>حالة الطلاب</Text>
              <View style={{gap: 14}}>
                <View>
                  <View style={st.barRow}>
                    <Text style={st.barLabel}>نشط</Text>
                    <Text style={st.barVal}>
                      {stats.activeStudents} ({Math.round(studentActivePct)}%)
                    </Text>
                  </View>
                  <AnimBar pct={studentActivePct} color="#059669" />
                </View>
                <View>
                  <View style={st.barRow}>
                    <Text style={st.barLabel}>غير نشط</Text>
                    <Text style={st.barVal}>
                      {inactiveStudents} ({Math.round(100 - studentActivePct)}
                      %)
                    </Text>
                  </View>
                  <AnimBar
                    pct={100 - studentActivePct}
                    color="#ef4444"
                    delay={200}
                  />
                </View>
              </View>
            </View>

            {/* ---- Fee Status Bars ---- */}
            {canAccessFinancial && (
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>حالة الرسوم</Text>
                <View style={{gap: 14}}>
                  <View>
                    <View style={st.barRow}>
                      <Text style={st.barLabel}>مطبقة</Text>
                      <Text style={st.barVal}>
                        {stats.appliedFees} ({Math.round(feesAppliedPct)}%)
                      </Text>
                    </View>
                    <AnimBar pct={feesAppliedPct} color="#0ea5e9" />
                  </View>
                  <View>
                    <View style={st.barRow}>
                      <Text style={st.barLabel}>غير مطبقة</Text>
                      <Text style={st.barVal}>
                        {unappliedFees} ({Math.round(100 - feesAppliedPct)}%)
                      </Text>
                    </View>
                    <AnimBar
                      pct={100 - feesAppliedPct}
                      color="#f59e0b"
                      delay={200}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ---- Balance Highlight ---- */}
            {canAccessFinancial && stats.totalBalance > 0 && (
              <View
                style={[
                  st.chartCard,
                  {flexDirection: 'row', alignItems: 'center', gap: 14},
                ]}>
                <View
                  style={[
                    st.statIconBox,
                    {backgroundColor: '#f0fdf4', width: 52, height: 52},
                  ]}>
                  <Icon name="trending-up" size={26} color="#059669" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={st.barLabel}>إجمالي الرصيد</Text>
                  <Text style={st.balanceNum}>
                    {stats.totalBalance.toLocaleString()} ج.م
                  </Text>
                </View>
              </View>
            )}

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
    </View>
  );
};

export default HomeScreen;

const st = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
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
  headerTitle: {fontSize: 20, fontWeight: '800', color: '#1a237e'},
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
  scroll: {flex: 1, padding: 16},

  // Welcome
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  logo: {width: 64, height: 64, borderRadius: 32, backgroundColor: '#f8fafc'},
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
    marginBottom: 12,
    marginTop: 4,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
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
  statNum: {fontSize: 24, fontWeight: '800', color: '#111827'},
  statLabel: {fontSize: 12, fontWeight: '600', color: '#6b7280', marginTop: 2},
  statSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    fontWeight: '500',
    overflow: 'hidden',
  },

  // Charts
  chartCard: {
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
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {fontSize: 13, color: '#374151', fontWeight: '600'},
  barVal: {fontSize: 12, color: '#6b7280', fontWeight: '700'},
  balanceNum: {fontSize: 22, fontWeight: '800', color: '#059669'},

  // Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
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

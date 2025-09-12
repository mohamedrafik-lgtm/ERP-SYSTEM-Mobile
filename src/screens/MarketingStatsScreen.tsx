import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  MarketingStatsResponse,
  MONTHS,
  YEARS,
} from '../types/marketing';
import StatsCard from '../components/StatsCard';
import EmployeePerformanceCard from '../components/EmployeePerformanceCard';
import ProgramStatsCard from '../components/ProgramStatsCard';
import SelectBox from '../components/SelectBox';

const MarketingStatsScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState<MarketingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response: MarketingStatsResponse = await AuthService.getMarketingStats({
        month: selectedMonth,
        year: selectedYear,
      });

      setStats(response);
    } catch (error) {
      console.error('Error fetching marketing stats:', error);
      setStats(null);
      Alert.alert('خطأ', 'فشل في تحميل إحصائيات التسويق');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const getMonthOptions = () => [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      value: currentYear - i,
      label: (currentYear - i).toString(),
    }));
  };

  const handleEmployeePress = (employeeId: number, employeeName: string) => {
    navigation.navigate('EmployeeTrainees', {
      employeeId,
      employeeName,
    });
  };

  if (loading && !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="MarketingStats" />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Icon name="analytics" size={24} color="#1a237e" />
              <Text style={styles.headerTitle}>إحصائيات التسويق</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الإحصائيات...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MarketingStats" />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="analytics" size={24} color="#1a237e" />
            <Text style={styles.headerTitle}>إحصائيات التسويق</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#1a237e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selection */}
        <View style={styles.periodSection}>
          <Text style={styles.sectionTitle}>اختر الفترة</Text>
          <View style={styles.periodFilters}>
            <View style={styles.filterContainer}>
              <SelectBox
                label="الشهر"
                items={getMonthOptions()}
                selectedValue={selectedMonth}
                onValueChange={(value) => handleMonthChange(value as number)}
                placeholder="اختر الشهر"
              />
            </View>
            <View style={styles.filterContainer}>
              <SelectBox
                label="السنة"
                items={getYearOptions()}
                selectedValue={selectedYear}
                onValueChange={(value) => handleYearChange(value as number)}
                placeholder="اختر السنة"
              />
            </View>
          </View>
        </View>

        {stats && (
          <>
            {/* Overview Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>نظرة عامة</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="إجمالي الموظفين"
                    value={stats.overview.totalEmployees}
                    icon="people"
                    iconColor="#ffffff"
                    backgroundColor="#667eea"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="إجمالي المتدربين"
                    value={stats.overview.totalTrainees}
                    icon="school"
                    iconColor="#ffffff"
                    backgroundColor="#10b981"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="المُعيّنين"
                    value={stats.overview.assignedTrainees}
                    icon="assignment"
                    iconColor="#ffffff"
                    backgroundColor="#f59e0b"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="غير المُعيّنين"
                    value={stats.overview.unassignedTrainees}
                    icon="person-off"
                    iconColor="#ffffff"
                    backgroundColor="#ef4444"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="نسبة التخصيص"
                    value={`${stats.overview.assignmentRate}%`}
                    icon="percent"
                    iconColor="#ffffff"
                    backgroundColor="#8b5cf6"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="التواصل الأول"
                    value={stats.overview.firstContactTrainees}
                    icon="call"
                    iconColor="#ffffff"
                    backgroundColor="#ec4899"
                  />
                </View>
              </View>
            </View>

            {/* Monthly Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>إحصائيات الشهر الحالي</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="متدربين جدد"
                    value={stats.monthly.newTrainees}
                    icon="person-add"
                    iconColor="#ffffff"
                    backgroundColor="#06b6d4"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="مُعيّنين (الشهر)"
                    value={stats.monthly.assignedTrainees}
                    icon="assignment-ind"
                    iconColor="#ffffff"
                    backgroundColor="#84cc16"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="تواصل أول (الشهر)"
                    value={stats.monthly.firstContactTrainees}
                    icon="call-made"
                    iconColor="#ffffff"
                    backgroundColor="#f97316"
                  />
                </View>
                <View style={styles.statCardWrapper}>
                  <StatsCard
                    title="نسبة التخصيص (الشهر)"
                    value={`${stats.monthly.assignmentRate}%`}
                    icon="trending-up"
                    iconColor="#ffffff"
                    backgroundColor="#a855f7"
                  />
                </View>
              </View>
            </View>

            {/* Top Performers */}
            {stats.topPerformers && stats.topPerformers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>أفضل الأداء</Text>
                {stats.topPerformers.map((performer) => (
                  <EmployeePerformanceCard
                    key={performer.id}
                    employee={performer}
                    rank={performer.rank}
                    onPress={() => handleEmployeePress(performer.id, performer.name)}
                  />
                ))}
              </View>
            )}

            {/* All Employees Performance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>أداء جميع الموظفين</Text>
              {stats.employees.map((employee) => (
                <EmployeePerformanceCard
                  key={employee.id}
                  employee={employee}
                  onPress={() => handleEmployeePress(employee.id, employee.name)}
                />
              ))}
            </View>

            {/* Program Stats */}
            {stats.programs && stats.programs.length > 0 && (
              <ProgramStatsCard
                programs={stats.programs}
                totalTrainees={stats.overview.totalTrainees}
              />
            )}

            {/* Detailed Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>إحصائيات تفصيلية</Text>
              <View style={styles.detailedStats}>
                <View style={styles.detailedItem}>
                  <Icon name="people" size={20} color="#3b82f6" />
                  <Text style={styles.detailedLabel}>متوسط المتدربين لكل موظف</Text>
                  <Text style={styles.detailedValue}>{stats.detailed.averagePerEmployee}</Text>
                </View>
                <View style={styles.detailedItem}>
                  <Icon name="check-circle" size={20} color="#10b981" />
                  <Text style={styles.detailedLabel}>نسبة الموظفين النشطين</Text>
                  <Text style={styles.detailedValue}>{stats.detailed.activeEmployeesRate}%</Text>
                </View>
              </View>

              {/* Status Distribution */}
              {stats.detailed.statusDistribution && stats.detailed.statusDistribution.length > 0 && (
                <View style={styles.statusSection}>
                  <Text style={styles.statusTitle}>توزيع المتدربين حسب الحالة</Text>
                  {stats.detailed.statusDistribution.map((status, index) => (
                    <View key={index} style={styles.statusItem}>
                      <Text style={styles.statusLabel}>{status.status}</Text>
                      <Text style={styles.statusCount}>{status.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Period Info */}
            <View style={styles.periodInfo}>
              <Text style={styles.periodText}>
                الفترة: {MONTHS.find(m => m.value === stats.period.month)?.label} {stats.period.year}
              </Text>
              <Text style={styles.periodText}>
                من {new Date(stats.period.startDate).toLocaleDateString('ar-EG')} إلى {new Date(stats.period.endDate).toLocaleDateString('ar-EG')}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a237e',
    marginLeft: 16,
    letterSpacing: 0.5,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  periodSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  periodFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  filterContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCardWrapper: {
    width: '32%',
    minWidth: 105,
    maxWidth: 115,
  },
  detailedStats: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  detailedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailedLabel: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
    marginLeft: 16,
    fontWeight: '600',
  },
  detailedValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  statusCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  periodInfo: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  periodText: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 6,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default MarketingStatsScreen;

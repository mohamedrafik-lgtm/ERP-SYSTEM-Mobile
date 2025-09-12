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
  MarketingTargetWithAchieved,
  MarketingTargetStats,
  MONTHS,
  YEARS,
  CreateMarketingTargetRequest,
  UpdateMarketingTargetRequest,
} from '../types/marketing';
import SelectBox from '../components/SelectBox';
import TargetCard from '../components/TargetCard';
import AddTargetModal from '../components/AddTargetModal';
import EditTargetModal from '../components/EditTargetModal';

const TargetSettingScreen = ({ navigation }: any) => {
  const [targets, setTargets] = useState<MarketingTargetWithAchieved[]>([]);
  const [stats, setStats] = useState<MarketingTargetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<MarketingTargetWithAchieved | null>(null);
  const [marketingEmployees, setMarketingEmployees] = useState<any[]>([]);

  const getAchievementRate = useCallback((target: MarketingTargetWithAchieved) => {
    if (target.targetAmount === 0) return 0;
    return Math.round((target.achievedAmount / target.targetAmount) * 100);
  }, []);

  const calculateStatsFromTargets = useCallback((targetsData: MarketingTargetWithAchieved[]): MarketingTargetStats | null => {
    if (!targetsData || targetsData.length === 0) {
      return {
        totalTargets: 0,
        totalAchieved: 0,
        totalRemaining: 0,
        averageAchievement: 0,
      };
    }

    const totalTargets = targetsData.length;
    const totalTargetAmount = targetsData.reduce((sum, target) => sum + target.targetAmount, 0);
    const totalAchieved = targetsData.reduce((sum, target) => sum + target.achievedAmount, 0);
    const totalRemaining = Math.max(0, totalTargetAmount - totalAchieved);
    const averageAchievement = totalTargetAmount > 0 ? Math.round((totalAchieved / totalTargetAmount) * 100) : 0;

    // العثور على أفضل أداء
    let topPerformer = null;
    if (targetsData.length > 0) {
      const bestTarget = targetsData.reduce((best, current) => {
        const currentRate = getAchievementRate(current);
        const bestRate = getAchievementRate(best);
        return currentRate > bestRate ? current : best;
      });

      const achievementRate = getAchievementRate(bestTarget);
      if (achievementRate > 0) {
        topPerformer = {
          employeeId: bestTarget.employeeId,
          employeeName: bestTarget.employee.name,
          achievementRate: achievementRate,
        };
      }
    }

    return {
      totalTargets,
      totalAchieved,
      totalRemaining,
      averageAchievement,
      topPerformer: topPerformer || undefined,
    };
  }, [getAchievementRate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // جلب الأهداف
      const targetsResponse = await AuthService.getMarketingTargets({
        month: selectedMonth,
        year: selectedYear,
      });

      setTargets(targetsResponse || []);
      
      // حساب الإحصائيات محلياً من البيانات
      const calculatedStats = calculateStatsFromTargets(targetsResponse || []);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching target data:', error);
      setTargets([]);
      setStats(null);
      Alert.alert('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, calculateStatsFromTargets]);

  useEffect(() => {
    fetchData();
    fetchMarketingEmployees();
  }, [fetchData]);

  const fetchMarketingEmployees = async () => {
    try {
      const employees = await AuthService.getMarketingEmployees();
      setMarketingEmployees(employees || []);
    } catch (error) {
      console.error('Error fetching marketing employees:', error);
      setMarketingEmployees([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddTarget = async (targetData: CreateMarketingTargetRequest) => {
    try {
      await AuthService.createMarketingTarget(targetData);
      setShowAddModal(false);
      await fetchData();
      Alert.alert('نجح', 'تم إضافة الهدف بنجاح');
    } catch (error) {
      console.error('Error creating target:', error);
      Alert.alert('خطأ', 'فشل في إضافة الهدف');
    }
  };

  const handleEditTarget = (target: MarketingTargetWithAchieved) => {
    setSelectedTarget(target);
    setShowEditModal(true);
  };

  const handleUpdateTarget = async (targetId: number, targetData: UpdateMarketingTargetRequest) => {
    try {
      await AuthService.updateMarketingTarget(targetId, targetData);
      setShowEditModal(false);
      setSelectedTarget(null);
      await fetchData();
      Alert.alert('نجح', 'تم تحديث الهدف بنجاح');
    } catch (error) {
      console.error('Error updating target:', error);
      Alert.alert('خطأ', 'فشل في تحديث الهدف');
    }
  };

  const handleDeleteTarget = async (targetId: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الهدف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteMarketingTarget(targetId);
              await fetchData();
              Alert.alert('نجح', 'تم حذف الهدف بنجاح');
            } catch (error) {
              console.error('Error deleting target:', error);
              Alert.alert('خطأ', 'فشل في حذف الهدف');
            }
          },
        },
      ]
    );
  };

  const getSelectedMonthLabel = () => {
    return MONTHS?.find(m => m.value === selectedMonth)?.label || 'الشهر';
  };

  const getSelectedYearLabel = () => {
    return selectedYear.toString();
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="TargetSetting" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تحديد التارجيت</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleHeader}>
            <Icon name="track-changes" size={32} color="#1a237e" />
            <Text style={styles.pageTitle}>تحديد التارجيت</Text>
          </View>
          <Text style={styles.pageDescription}>
            تحديد ومتابعة أهداف المتدربين المطلوب جلبهم لفريق التسويق
          </Text>
          <Text style={styles.instructionText}>
            استخدم زر "تحديد هدف جديد" لإضافة أهداف جديدة أو زر "تعديل" لتحديث الأهداف الموجودة
          </Text>
        </View>

        {/* Add Target Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>تحديد هدف جديد</Text>
        </TouchableOpacity>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>السنة</Text>
              <SelectBox
                label="السنة"
                items={YEARS}
                selectedValue={selectedYear}
                onValueChange={(value) => setSelectedYear(value as number)}
                placeholder="اختر السنة"
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>الشهر</Text>
              <SelectBox
                label="الشهر"
                items={MONTHS}
                selectedValue={selectedMonth}
                onValueChange={(value) => setSelectedMonth(value as number)}
                placeholder="اختر الشهر"
              />
            </View>
          </View>
        </View>

        {/* Stats Section */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>إحصائيات الأداء</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalTargets}</Text>
                <Text style={styles.statLabel}>إجمالي الأهداف</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalAchieved}</Text>
                <Text style={styles.statLabel}>المحقق</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalRemaining}</Text>
                <Text style={styles.statLabel}>المتبقي</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.averageAchievement}%</Text>
                <Text style={styles.statLabel}>متوسط الإنجاز</Text>
              </View>
            </View>
          </View>
        )}

        {/* Targets List */}
        <View style={styles.targetsSection}>
          <Text style={styles.sectionTitle}>
            أهداف موظفي التسويق - {getSelectedMonthLabel()} {getSelectedYearLabel()}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل الأهداف...</Text>
            </View>
          ) : !targets || targets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="track-changes" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>لا توجد أهداف</Text>
              <Text style={styles.emptyDescription}>
                لم يتم تحديد أي أهداف لهذا الشهر بعد
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>إضافة هدف جديد</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.targetsGrid}>
              {targets?.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  achievementRate={getAchievementRate(target)}
                  onEdit={handleEditTarget}
                  onDelete={() => handleDeleteTarget(target.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Target Modal */}
      <AddTargetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddTarget}
        marketingEmployees={marketingEmployees}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

      <EditTargetModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTarget(null);
        }}
        onSubmit={handleUpdateTarget}
        target={selectedTarget}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 12,
  },
  pageDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'right',
  },
  instructionText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  filterSelect: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
  statsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  targetsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default TargetSettingScreen;

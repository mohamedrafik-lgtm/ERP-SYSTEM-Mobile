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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  TraineeWithMarketingInfo,
  MarketingTraineesResponse,
} from '../types/marketing';
import { TraineeStatus } from '../types/enums';
import TraineeCard from '../components/TraineeCard';
import SelectBox from '../components/SelectBox';

const MarketingTraineesScreen = ({ navigation }: any) => {
  const [trainees, setTrainees] = useState<TraineeWithMarketingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TraineeStatus | undefined>(undefined);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async (page: number = 1, search: string = '', status?: TraineeStatus) => {
    try {
      setLoading(true);
      
      const response: MarketingTraineesResponse = await AuthService.getMarketingTrainees({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: status || undefined,
      });

      setTrainees(response.data || []);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      console.error('Error fetching marketing trainees:', error);
      setTrainees([]);
      Alert.alert('خطأ', 'فشل في تحميل بيانات المتدربين');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchData(1, searchText, selectedStatus);
  }, [fetchData, searchText, selectedStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(1, searchText, selectedStatus);
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (status: TraineeStatus | undefined) => {
    setSelectedStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      fetchData(pagination.page + 1, searchText, selectedStatus);
    }
  };

  const getStatusOptions = () => [
    { value: undefined, label: 'جميع الحالات' },
    { value: TraineeStatus.ACTIVE, label: 'نشط' },
    { value: TraineeStatus.INACTIVE, label: 'غير نشط' },
    { value: TraineeStatus.SUSPENDED, label: 'معلق' },
    { value: TraineeStatus.GRADUATED, label: 'متخرج' },
  ];

  const handleTraineePress = (trainee: TraineeWithMarketingInfo) => {
    // يمكن إضافة navigation إلى صفحة تفاصيل المتدرب هنا
    console.log('Trainee pressed:', trainee);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MarketingTrainees" />
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="people" size={24} color="#1a237e" />
            <Text style={styles.headerTitle}>المتدربين مع تفاصيل التسويق</Text>
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
        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearch}
                placeholder="البحث بالاسم أو الهاتف أو الرقم القومي..."
                textAlign="right"
              />
              <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterContainer}>
            <SelectBox
              label="حالة المتدرب"
              items={getStatusOptions()}
              selectedValue={selectedStatus}
              onValueChange={(value) => handleStatusChange(value as TraineeStatus | undefined)}
              placeholder="اختر حالة المتدرب"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{pagination.total}</Text>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="list" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{trainees.length}</Text>
            <Text style={styles.statLabel}>المعروضين</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pages" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{pagination.totalPages}</Text>
            <Text style={styles.statLabel}>عدد الصفحات</Text>
          </View>
        </View>

        {/* Trainees List */}
        <View style={styles.traineesSection}>
          {loading && pagination.page === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل المتدربين...</Text>
            </View>
          ) : trainees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>لا توجد متدربين</Text>
              <Text style={styles.emptyDescription}>
                {searchText || selectedStatus 
                  ? 'لم يتم العثور على متدربين يطابقون معايير البحث'
                  : 'لم يتم تسجيل أي متدربين بعد'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.traineesList}>
              {trainees.map((trainee) => (
                <TraineeCard
                  key={trainee.id}
                  trainee={trainee}
                  onPress={() => handleTraineePress(trainee)}
                />
              ))}
            </View>
          )}

          {/* Load More Button */}
          {pagination.page < pagination.totalPages && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1a237e" />
              ) : (
                <>
                  <Icon name="expand-more" size={20} color="#1a237e" />
                  <Text style={styles.loadMoreText}>تحميل المزيد</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Pagination Info */}
          {pagination.totalPages > 1 && (
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                صفحة {pagination.page} من {pagination.totalPages}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: '#fff',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filtersSection: {
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
  },
  searchIcon: {
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  traineesSection: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  traineesList: {
    flex: 1,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginLeft: 8,
  },
  paginationInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default MarketingTraineesScreen;

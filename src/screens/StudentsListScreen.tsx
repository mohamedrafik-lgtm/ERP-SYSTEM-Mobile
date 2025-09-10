import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  programId?: string;
  programName?: string;
  enrollmentDate?: string;
  lastActivity?: string;
}

interface StudentsResponse {
  data: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const StudentsListScreen = ({ navigation }: any) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'inactive', label: 'غير نشط' },
    { value: 'suspended', label: 'معلق' },
    { value: 'graduated', label: 'متخرج' },
  ];

  const fetchStudents = async (page: number = 1, search: string = '', status: string = 'all') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        includeDetails,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      };

      const result = await AuthService.getTrainees(params);

      setStudents(result.data || []);
      if (result.pagination) {
        setCurrentPage(result.pagination.currentPage);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.totalItems);
      } else {
        // Fallback if pagination object is missing
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(result.data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل بيانات الطلاب';

      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
        AuthService.clearAuthData().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        });
      } else {
        Alert.alert('خطأ', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStudents(1, searchText, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchStudents(1, searchText, status);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents(currentPage, searchText, statusFilter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStudents(page, searchText, statusFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'suspended':
        return '#f59e0b';
      case 'graduated':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            i === currentPage && styles.activePageButton,
          ]}
          onPress={() => handlePageChange(i)}
        >
          <Text
            style={[
              styles.pageButtonText,
              i === currentPage && styles.activePageButtonText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>
        
        {pages}
        
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Icon name="chevron-right" size={20} color={currentPage === totalPages ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StudentsList" />
        <Text style={styles.title}>قائمة الطلاب</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        {/* شريط البحث والفلاتر */}
        <View style={styles.searchContainer}>
          <ArabicSearchInput
            placeholder="البحث عن الطلاب..."
            value={searchText}
            onChangeText={setSearchText}
            onSearch={handleSearch}
          />

          {/* فلاتر الحالة */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterButton,
                  statusFilter === option.value && styles.activeFilterButton,
                ]}
                onPress={() => handleStatusFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === option.value && styles.activeFilterButtonText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddStudent')}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة طالب</Text>
        </TouchableOpacity>

        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="school" size={24} color="#1a237e" />
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={styles.statLabel}>إجمالي الطلاب</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={24} color="#10b981" />
            <Text style={styles.statNumber}>
              {students.filter(s => s.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>نشط</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pause-circle" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>
              {students.filter(s => s.status === 'suspended').length}
            </Text>
            <Text style={styles.statLabel}>معلق</Text>
          </View>
        </View>

        {/* قائمة الطلاب */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الطلاب...</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا يوجد طلاب</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على أي طلاب يطابقون معايير البحث الحالية.</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchStudents(1, '', 'all')}
            >
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة تحميل الكل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentHeader}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(student.status) }]}>
                        {getStatusLabel(student.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.studentDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="email" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{student.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="phone" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{student.phone}</Text>
                    </View>
                    {student.programName && (
                      <View style={styles.detailRow}>
                        <Icon name="book" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>{student.programName}</Text>
                      </View>
                    )}
                    {student.enrollmentDate && (
                      <View style={styles.detailRow}>
                        <Icon name="calendar-today" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          تاريخ التسجيل: {new Date(student.enrollmentDate).toLocaleDateString('ar-EG')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="more-vert" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* الباجينيشن */}
        {!loading && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              صفحة {currentPage} من {totalPages} ({totalItems} طالب)
            </Text>
            {renderPagination()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterButton: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  studentsList: {
    marginBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  paginationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activePageButton: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activePageButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  retryButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default StudentsListScreen;


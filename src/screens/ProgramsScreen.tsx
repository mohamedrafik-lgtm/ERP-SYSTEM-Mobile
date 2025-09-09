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

interface Program {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  enrolledStudents?: number;
}

interface ProgramsResponse {
  data: Program[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

const ProgramsScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPrograms = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      });

      const response = await fetch(`http://10.0.2.2:4000/api/programs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في تحميل البرامج');
      }

      const result: ProgramsResponse = await response.json();
      
      setPrograms(result.data);
      setCurrentPage(result.pagination.currentPage);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching programs:', error);
      Alert.alert('خطأ', 'فشل في تحميل البرامج');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPrograms(1, searchText);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrograms(currentPage, searchText);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPrograms(page, searchText);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
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
        <CustomMenu navigation={navigation} activeRouteName="Programs" />
        <Text style={styles.title}>إدارة البرامج التدريبية</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProgram')}
          >
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>إضافة برنامج</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        {/* شريط البحث */}
        <ArabicSearchInput
          placeholder="البحث عن البرامج..."
          value={searchText}
          onChangeText={setSearchText}
          onSearch={handleSearch}
        />

        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="book" size={24} color="#1a237e" />
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={styles.statLabel}>إجمالي البرامج</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color="#10b981" />
            <Text style={styles.statNumber}>
              {programs.filter(p => p.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>
              {programs.reduce((sum, p) => sum + (p.enrolledStudents || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>الطلاب المسجلين</Text>
          </View>
        </View>

        {/* قائمة البرامج */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : (
          <View style={styles.programsList}>
            {programs.map((program) => (
              <View key={program.id} style={styles.programCard}>
                <View style={styles.programHeader}>
                  <View style={styles.programTitleContainer}>
                    <Text style={styles.programNameAr}>{program.nameAr}</Text>
                    <Text style={styles.programNameEn}>{program.nameEn}</Text>
                  </View>
                  <View style={styles.programPrice}>
                    <Text style={styles.priceText}>{formatPrice(program.price)}</Text>
                  </View>
                </View>
                
                <Text style={styles.programDescription} numberOfLines={3}>
                  {program.description}
                </Text>
                
                <View style={styles.programFooter}>
                  <View style={styles.programInfo}>
                    <View style={styles.infoItem}>
                      <Icon name="people" size={16} color="#6b7280" />
                      <Text style={styles.infoText}>
                        {program.enrolledStudents || 0} طالب
                      </Text>
                    </View>
                    {program.createdAt && (
                      <View style={styles.infoItem}>
                        <Icon name="calendar-today" size={16} color="#6b7280" />
                        <Text style={styles.infoText}>
                          {new Date(program.createdAt).toLocaleDateString('ar-EG')}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.programActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="edit" size={18} color="#1a237e" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="delete" size={18} color="#e53e3e" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* الباجينيشن */}
        {!loading && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              صفحة {currentPage} من {totalPages} ({totalItems} برنامج)
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  programsList: {
    marginBottom: 20,
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  programTitleContainer: {
    flex: 1,
  },
  programNameAr: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  programNameEn: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  programPrice: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  programDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  programActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginLeft: 8,
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
});

export default ProgramsScreen;

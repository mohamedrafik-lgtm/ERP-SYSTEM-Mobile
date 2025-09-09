import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';

export interface Program {
  id: number;
  nameAr: string;
  nameEn: string;
  price: number;
  description: string;
  _count: {
    trainees: number;
  };
}


const ProgramsScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, _setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      
      // جلب الـ token من AuthService
      const token = await AuthService.getToken();
      console.log('Token for programs request:', token);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // إضافة الـ token للـ headers إذا كان موجود
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch('http://10.0.2.2:4000/api/programs', {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          // Token غير صالح أو منتهي الصلاحية
          console.log('Token expired or invalid, redirecting to login');
          await AuthService.clearAuthData();
          // العودة لشاشة تسجيل الدخول
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Program[] = await response.json();
      setPrograms(data);
      setTotalItems(data.length);
    } catch (error) {
      console.error('Error fetching programs:', error);
      
      // Show error message
      Toast.show({
        type: 'error',
        text1: 'خطأ في الاتصال',
        text2: 'تعذر الاتصال بالخادم',
      });
      
      // Set empty array if API fails
      setPrograms([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    // For now, we'll fetch all programs and filter locally
    // In the future, you can implement server-side search
    fetchPrograms();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const handleDeleteProgram = (program: Program) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف البرنامج "${program.nameAr}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => deleteProgram(program.id),
        },
      ]
    );
  };

  const deleteProgram = async (programId: number) => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'خطأ في المصادقة',
          text2: 'يرجى تسجيل الدخول لحذف البرنامج',
        });
        return;
      }

      const response = await fetch(`http://10.0.2.2:4000/api/programs/${programId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Delete Program Response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired or invalid, redirecting to login');
          await AuthService.clearAuthData();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error(data.message || 'فشل في حذف البرنامج');
      }

      Toast.show({
        type: 'success',
        text1: 'تم بنجاح!',
        text2: 'تم حذف البرنامج التدريبي بنجاح',
      });

      // إعادة تحميل قائمة البرامج
      fetchPrograms();

    } catch (error) {
      console.error('Error deleting program:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error instanceof Error ? error.message : 'فشل في حذف البرنامج',
      });
    }
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
        <View style={styles.headerButtons} />
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
            <Text style={styles.statNumber}>{programs.length}</Text>
            <Text style={styles.statLabel}>نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{programs.reduce((sum, p) => sum + p._count.trainees, 0)}</Text>
            <Text style={styles.statLabel}>الطلاب المسجلين</Text>
          </View>
        </View>

        {/* زر إضافة برنامج تدريبي */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProgram')}
          >
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>إضافة برنامج تدريبي</Text>
          </TouchableOpacity>
        </View>

        {/* قائمة البرامج */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="book" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على أي برامج تدريبية أو تعذر الاتصال بالخادم</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchPrograms}
            >
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
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
                        {program._count.trainees} طالب
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.programActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="edit" size={18} color="#1a237e" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteProgram(program)}
                    >
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
      <Toast />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonContainer: {
    alignItems: 'center',
    marginVertical: 16,
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

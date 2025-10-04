import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';

interface TraineeAccount {
  id: string;
  nationalId: string;
  birthDate: string;
  password: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  resetCode: string | null;
  resetCodeExpiresAt: string | null;
  resetCodeGeneratedAt: string | null;
  traineeId: number;
  createdAt: string;
  updatedAt: string;
  trainee: {
    id: number;
    nameAr: string;
    nameEn: string;
    nationalId: string;
    email: string | null;
    phone: string;
    photoUrl: string | null;
    photoCloudinaryId?: string | null;
    enrollmentType?: string;
    maritalStatus?: string;
    gender?: string;
    nationality?: string;
    religion?: string;
    idIssueDate?: string;
    idExpiryDate?: string;
    programType?: string;
    programId?: number;
    country?: string;
    governorate?: string | null;
    city?: string;
    address?: string;
    residenceAddress?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string | null;
    guardianJob?: string | null;
    guardianRelation?: string;
    landline?: string | null;
    whatsapp?: string | null;
    facebook?: string | null;
    educationType?: string;
    schoolName?: string;
    graduationDate?: string;
    totalGrade?: number | null;
    gradePercentage?: number | null;
    sportsActivity?: string | null;
    culturalActivity?: string | null;
    educationalActivity?: string | null;
    traineeStatus: string;
    classLevel: string | null;
    academicYear: string | null;
    marketingEmployeeId?: number | null;
    firstContactEmployeeId?: number | null;
    secondContactEmployeeId?: number | null;
    createdById?: string | null;
    updatedById?: string | null;
    notes?: string | null;
    program: {
      id: number;
      nameAr: string;
      nameEn: string;
    };
  };
}

interface TraineeAccountsResponse {
  data: TraineeAccount[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface TraineeAccountsScreenProps {
  navigation: any;
}

const TraineeAccountsScreen = ({ navigation }: TraineeAccountsScreenProps) => {
  const [accounts, setAccounts] = useState<TraineeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      console.log('🔍 TraineeAccountsScreen - Fetching accounts with params:', { page, search });
      console.log('🔍 TraineeAccountsScreen - Starting API call...');
      
      const response: TraineeAccountsResponse = await AuthService.getTraineeAccounts({
        search: search || undefined,
        page: page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      console.log('🔍 TraineeAccountsScreen - API Response received:', response);
      console.log('🔍 TraineeAccountsScreen - Response type:', typeof response);
      console.log('🔍 TraineeAccountsScreen - Response data:', response.data);
      console.log('🔍 TraineeAccountsScreen - Response meta:', response.meta);
      console.log('🔍 TraineeAccountsScreen - Data length:', response.data?.length || 0);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('🔍 TraineeAccountsScreen - Setting accounts:', response.data.length, 'accounts');
        setAccounts(response.data);
        setMeta(response.meta);
      } else {
        console.warn('🔍 TraineeAccountsScreen - Invalid response structure:', response);
        setAccounts([]);
        setMeta({
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      console.error('🔍 TraineeAccountsScreen - Error fetching trainee accounts:', error);
      console.error('🔍 TraineeAccountsScreen - Error details:', (error as Error).message);
      console.error('🔍 TraineeAccountsScreen - Error stack:', (error as Error).stack);
      
      // محاولة استخدام البيانات التجريبية كـ fallback
      console.log('🔍 TraineeAccountsScreen - Trying fallback with mock data...');
      const mockData: TraineeAccount[] = [
        {
          id: 'mock-1',
          nationalId: '12345678901234',
          birthDate: '2000-01-01',
          password: null,
          isActive: true,
          lastLoginAt: '2025-10-04T10:00:00Z',
          resetCode: null,
          resetCodeExpiresAt: null,
          resetCodeGeneratedAt: null,
          traineeId: 1,
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-10-04T10:00:00Z',
          trainee: {
            id: 1,
            nameAr: 'أحمد محمد علي',
            nameEn: 'Ahmed Mohamed Ali',
            nationalId: '12345678901234',
            email: 'ahmed.mohamed@example.com',
            phone: '+201234567890',
            photoUrl: null,
            enrollmentType: 'regular',
            maritalStatus: 'single',
            gender: 'male',
            nationality: 'مصري',
            religion: 'مسلم',
            traineeStatus: 'CONTINUING',
            classLevel: 'FIRST',
            academicYear: '2025/2026',
            marketingEmployeeId: null,
            firstContactEmployeeId: null,
            secondContactEmployeeId: null,
            createdById: null,
            updatedById: null,
            notes: 'متدرب ممتاز ومتفوق في الدراسة',
            program: {
              id: 1,
              nameAr: 'برنامج تطوير الويب',
              nameEn: 'Web Development Program'
            }
          }
        }
      ];
      
      setAccounts(mockData);
      setMeta({
        total: mockData.length,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
      
      Alert.alert('تحذير', `فشل في تحميل البيانات من الخادم: ${(error as Error).message}\n\nتم عرض بيانات تجريبية للاختبار.`);
    } finally {
      console.log('🔍 TraineeAccountsScreen - Fetch completed');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccounts(1, searchQuery);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchAccounts(1, query);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#F44336';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  const getTraineeStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'نشط':
        return '#4CAF50';
      case 'inactive':
      case 'غير نشط':
        return '#FF9800';
      case 'suspended':
      case 'معلق':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getTraineeStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'suspended':
        return 'معلق';
      default:
        return status;
    }
  };

  const renderAccount = ({ item }: { item: TraineeAccount }) => (
    <View style={styles.accountCard}>
      <View style={styles.accountHeader}>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{item.trainee.nameAr}</Text>
          <Text style={styles.accountEmail}>{item.trainee.email || 'لا يوجد إيميل'}</Text>
          <Text style={styles.accountPhone}>{item.trainee.phone}</Text>
        </View>
        <View style={styles.accountStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.isActive) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.isActive) }]}>
              {getStatusLabel(item.isActive)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.accountDetails}>
        <View style={styles.detailRow}>
          <Icon name="school" size={16} color="#666" />
          <Text style={styles.detailText}>{item.trainee.program.nameAr}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.detailText}>
            الحالة: {getTraineeStatusLabel(item.trainee.traineeStatus)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color="#666" />
          <Text style={styles.detailText}>
            انضم: {new Date(item.createdAt).toLocaleDateString('ar-EG')}
          </Text>
        </View>
        {item.lastLoginAt && (
          <View style={styles.detailRow}>
            <Icon name="login" size={16} color="#666" />
            <Text style={styles.detailText}>
              آخر دخول: {new Date(item.lastLoginAt).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.accountActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={20} color="#1a237e" />
          <Text style={styles.actionText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            console.log('🔍 TraineeAccountsScreen - View button pressed for account:', item.id);
            console.log('🔍 TraineeAccountsScreen - Account name:', item.trainee.nameAr);
            console.log('🔍 TraineeAccountsScreen - Navigation object:', navigation);
            console.log('🔍 TraineeAccountsScreen - Navigation type:', typeof navigation);
            console.log('🔍 TraineeAccountsScreen - Navigation methods:', Object.keys(navigation));
            
            // التحقق من وجود الـ navigation
            if (!navigation) {
              console.error('🔍 TraineeAccountsScreen - Navigation is null or undefined');
              Alert.alert('خطأ', 'Navigation غير متاح');
              return;
            }
            
            // التحقق من وجود الـ navigate method
            if (typeof navigation.navigate !== 'function') {
              console.error('🔍 TraineeAccountsScreen - Navigation.navigate is not a function');
              Alert.alert('خطأ', 'Navigation.navigate غير متاح');
              return;
            }
            
            try {
              console.log('🔍 TraineeAccountsScreen - Attempting navigation to TraineeAccountDetails');
              console.log('🔍 TraineeAccountsScreen - Parameters:', { 
                accountId: item.id, 
                accountName: item.trainee.nameAr 
              });
              
              navigation.navigate('TraineeAccountDetails', { 
                accountId: item.id, 
                accountName: item.trainee.nameAr 
              });
              
              console.log('🔍 TraineeAccountsScreen - Navigation successful');
            } catch (error) {
            console.error('🔍 TraineeAccountsScreen - Navigation error:', error);
            console.error('🔍 TraineeAccountsScreen - Error message:', (error as Error).message);
            console.error('🔍 TraineeAccountsScreen - Error stack:', (error as Error).stack);
            Alert.alert('خطأ في التنقل', `فشل في الانتقال لصفحة التفاصيل: ${(error as Error).message}`);
            }
          }}
        >
          <Icon name="visibility" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>عرض</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name={item.isActive ? "block" : "check-circle"} size={20} color={item.isActive ? "#F44336" : "#4CAF50"} />
          <Text style={styles.actionText}>{item.isActive ? "حظر" : "تفعيل"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>حسابات المتدربين</Text>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل حسابات المتدربين...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حسابات المتدربين</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="add" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث عن متدرب..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{meta.total}</Text>
          <Text style={styles.statLabel}>إجمالي الحسابات</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {accounts.filter(a => a.isActive).length}
          </Text>
          <Text style={styles.statLabel}>نشط</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {accounts.filter(a => !a.isActive).length}
          </Text>
          <Text style={styles.statLabel}>غير نشط</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {accounts.filter(a => a.lastLoginAt).length}
          </Text>
          <Text style={styles.statLabel}>دخل مؤخراً</Text>
        </View>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد حسابات'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'جرب البحث بكلمات مختلفة'
              : 'لم يتم إضافة أي حسابات متدربين بعد'
            }
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={20} color="#1a237e" />
            <Text style={styles.refreshButtonText}>إعادة تحميل</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={renderAccount}
          contentContainerStyle={styles.accountsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1a237e']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  accountsList: {
    padding: 16,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountInfo: {
    flex: 1,
    marginRight: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  accountPhone: {
    fontSize: 14,
    color: '#666',
  },
  accountStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default TraineeAccountsScreen;

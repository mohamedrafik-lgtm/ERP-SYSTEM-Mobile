import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { TraineesForGradesResponse, TraineeForGrades, GradeParams } from '../types/grades';

const TraineeGradesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trainees, setTrainees] = useState<TraineeForGrades[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [totalTrainees, setTotalTrainees] = useState(0);

  useEffect(() => {
    fetchTrainees();
  }, []);

  const fetchTrainees = async (search: string = '', programId: string = '') => {
    try {
      setLoading(true);
      console.log('🔍 TraineeGradesScreen - Fetching all trainees for grades...');
      
      const params: GradeParams = {
        limit: '1000', // Get all trainees at once
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (programId) {
        params.programId = programId;
      }
      
      console.log('🔍 TraineeGradesScreen - API params:', params);
      
      const response = await AuthService.getTraineesForGrades(params);
      console.log('🔍 TraineeGradesScreen - API response:', JSON.stringify(response, null, 2));
      
      let traineesData: TraineeForGrades[] = [];
      let total = 0;
      
      if (response) {
        if (Array.isArray(response)) {
          traineesData = response;
          total = response.length;
        } else if (response.data) {
          traineesData = Array.isArray(response.data) ? response.data : [];
          total = response.total || traineesData.length;
        }
      }
      
      console.log('🔍 TraineeGradesScreen - Processed data:', {
        traineesCount: traineesData.length,
        total: total
      });
      
      setTrainees(traineesData);
      setTotalTrainees(total);
      
      console.log('🔍 TraineeGradesScreen - All trainees loaded:', traineesData.length);
    } catch (error) {
      console.error('🔍 TraineeGradesScreen - Error fetching trainees:', error);
      
      // Provide more specific error messages
      let errorMessage = 'فشل في تحميل المتدربين';
      if ((error as Error).message.includes('Network request failed')) {
        errorMessage = 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.';
      } else if ((error as Error).message.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال. حاول مرة أخرى.';
      } else if ((error as Error).message.includes('غير مصرح')) {
        errorMessage = 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else {
        errorMessage = `فشل في تحميل المتدربين: ${(error as Error).message}`;
      }
      
      Alert.alert('خطأ', errorMessage, [
        { text: 'إعادة المحاولة', onPress: () => fetchTrainees() },
        { text: 'موافق', style: 'cancel' }
      ]);
      
      setTrainees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrainees(searchQuery, selectedProgram);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchTrainees(query, selectedProgram);
  };

  const handleTraineePress = (trainee: TraineeForGrades) => {
    console.log('🔍 TraineeGradesScreen - Trainee pressed:', trainee);
    // Navigate to trainee grades details
    // navigation.navigate('TraineeGradeDetails', { traineeId: trainee.id, traineeName: trainee.nameAr });
  };


  const renderTraineeCard = ({ item }: { item: TraineeForGrades }) => (
    <TouchableOpacity style={styles.traineeCard} onPress={() => handleTraineePress(item)}>
      <View style={styles.traineeHeader}>
        <View style={styles.traineeInfo}>
          <Text style={styles.traineeName}>{item.nameAr}</Text>
          <Text style={styles.traineeId}>الرقم القومي: {item.nationalId}</Text>
        </View>
        <View style={styles.gradesBadge}>
          <Text style={styles.gradesText}>{item._count.grades}</Text>
          <Text style={styles.gradesLabel}>درجة</Text>
        </View>
      </View>
      
      <View style={styles.traineeDetails}>
        <View style={styles.detailRow}>
          <Icon name="school" size={16} color="#666" />
          <Text style={styles.detailText}>{item.program.nameAr}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="book" size={16} color="#666" />
          <Text style={styles.detailText}>{item.program._count.trainingContents} مادة تدريبية</Text>
        </View>
      </View>
      
      <View style={styles.traineeFooter}>
        <Text style={styles.programLabel}>البرنامج التدريبي</Text>
        <Icon name="chevron-right" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل المتدربين...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>درجات المتدربين</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalTrainees}</Text>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{trainees.length}</Text>
            <Text style={styles.statLabel}>المعروضين</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2196F3' }]}>{trainees.filter(t => t._count.grades > 0).length}</Text>
            <Text style={styles.statLabel}>لديهم درجات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{trainees.filter(t => t._count.grades === 0).length}</Text>
            <Text style={styles.statLabel}>بدون درجات</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث بالاسم أو الرقم القومي..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Icon name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>


        {/* Trainees List */}
        <View style={styles.traineesContainer}>
          <Text style={styles.sectionTitle}>المتدربين ({trainees.length} من {totalTrainees})</Text>
          
          {trainees.length > 0 ? (
            <FlatList
              data={trainees}
              renderItem={renderTraineeCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="people" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد متدربين متاحين</Text>
              <Text style={styles.emptySubtext}>لم يتم العثور على متدربين تطابق المعايير المحددة</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gradesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  gradeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  traineeId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradeDetails: {
    marginBottom: 12,
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
  gradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  gradeScore: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  traineesContainer: {
    marginBottom: 16,
  },
  traineeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  traineeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  traineeId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gradesBadge: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  gradesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  gradesLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
  traineeDetails: {
    marginBottom: 12,
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
  traineeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  programLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default TraineeGradesScreen;

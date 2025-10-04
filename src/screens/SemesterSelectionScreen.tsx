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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProgramsResponse } from '../types/scheduleManagement';
import AuthService from '../services/AuthService';

interface SemesterSelectionScreenProps {
  navigation: any;
  route: {
    params: {
      programId: number;
      programName: string;
      classrooms: ProgramsResponse['classrooms'];
    };
  };
}

interface Semester {
  id: number;
  name: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  programId: number;
}

const SemesterSelectionScreen = ({ navigation, route }: SemesterSelectionScreenProps) => {
  const { programId, programName, classrooms } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [semesters, setSemesters] = useState<ProgramsResponse['classrooms']>(classrooms);

  useEffect(() => {
    // استخدام الـ classrooms المرسلة من ScheduleScreen
    console.log('🔍 SemesterSelectionScreen - Received classrooms:', JSON.stringify(classrooms, null, 2));
    console.log('🔍 SemesterSelectionScreen - Classrooms length:', classrooms?.length || 0);
    setSemesters(classrooms);
  }, [classrooms]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      console.log('🔍 SemesterSelectionScreen - Using classrooms from ScheduleScreen:', classrooms);
      
      // استخدام الـ classrooms المرسلة من ScheduleScreen مباشرة
      setSemesters(classrooms);
      console.log('🔍 SemesterSelectionScreen - Classrooms loaded:', classrooms.length);
    } catch (error) {
      console.error('🔍 SemesterSelectionScreen - Error loading classrooms:', error);
      Alert.alert('خطأ', 'فشل في تحميل الفصول الدراسية');
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSemesters();
    setRefreshing(false);
  };

  const handleSemesterPress = (classroom: ProgramsResponse['classrooms'][0]) => {
    console.log('🔍 SemesterSelectionScreen - Classroom pressed:', {
      id: classroom.id,
      name: classroom.name,
      classNumber: classroom.classNumber,
      startDate: classroom.startDate,
      endDate: classroom.endDate,
      idType: typeof classroom.id,
      idValue: classroom.id,
      isIdValid: !isNaN(classroom.id) && classroom.id > 0
    });
    
    // Validate classroom ID
    if (!classroom.id || isNaN(classroom.id) || classroom.id <= 0) {
      console.error('🔍 SemesterSelectionScreen - Invalid classroom ID:', classroom.id);
      Alert.alert('خطأ', `معرف الفصل الدراسي غير صحيح: ${classroom.id}`);
      return;
    }
    
    console.log('🔍 SemesterSelectionScreen - Navigating to schedule details with:', {
      programId: programId,
      programName: programName,
      classroomId: classroom.id,
      classroomName: classroom.name
    });
    
    navigation.navigate('ScheduleDetails', { 
      programId: programId,
      programName: programName,
      classroomId: classroom.id,
      classroomName: classroom.name
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#F44336';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const renderSemesterCard = (classroom: ProgramsResponse['classrooms'][0]) => (
    <TouchableOpacity 
      key={classroom.id} 
      style={styles.semesterCard}
      onPress={() => handleSemesterPress(classroom)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Icon name="class" size={24} color="#1a237e" />
          <Text style={styles.semesterTitle}>{classroom.name}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>عرض الجدول</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="confirmation-number" size={20} color="#666" />
          <Text style={styles.infoLabel}>رقم الفصل:</Text>
          <Text style={styles.infoValue}>{classroom.classNumber}</Text>
        </View>

        {classroom.startDate && (
          <View style={styles.infoRow}>
            <Icon name="event" size={20} color="#666" />
            <Text style={styles.infoLabel}>تاريخ البداية:</Text>
            <Text style={styles.infoValue}>{formatDate(classroom.startDate)}</Text>
          </View>
        )}

        {classroom.endDate && (
          <View style={styles.infoRow}>
            <Icon name="event-available" size={20} color="#666" />
            <Text style={styles.infoLabel}>تاريخ النهاية:</Text>
            <Text style={styles.infoValue}>{formatDate(classroom.endDate)}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="school" size={20} color="#666" />
          <Text style={styles.infoLabel}>البرنامج:</Text>
          <Text style={styles.infoValue}>{programName}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="schedule" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>عرض الجدول الدراسي</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>اختيار الفصل الدراسي</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الفصول الدراسية...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اختيار الفصل الدراسي</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {/* إحصائيات سريعة */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="class" size={32} color="#1a237e" />
            <Text style={styles.statNumber}>{semesters.length}</Text>
            <Text style={styles.statLabel}>إجمالي الفصول</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="schedule" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{semesters.length}</Text>
            <Text style={styles.statLabel}>فصول متاحة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="school" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{programName}</Text>
            <Text style={styles.statLabel}>البرنامج</Text>
          </View>
        </View>

        {/* قائمة الفصول الدراسية */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الفصول الدراسية المتاحة</Text>
        </View>

        {semesters.length > 0 ? (
          <View style={styles.semestersList}>
            {semesters.map(renderSemesterCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="class" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد فصول دراسية</Text>
            <Text style={styles.emptySubtitle}>لم يتم إنشاء أي فصول دراسية لهذا البرنامج بعد</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.refreshButtonText}>إعادة تحميل</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50, // زيادة المسافة من الأعلى لتجنب الكاميرا
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  semestersList: {
    marginBottom: 20,
  },
  semesterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    minWidth: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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

export default SemesterSelectionScreen;

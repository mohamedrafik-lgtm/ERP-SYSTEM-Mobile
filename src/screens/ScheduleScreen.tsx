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
import AuthService from '../services/AuthService';
import { ProgramsResponse } from '../types/scheduleManagement';

interface ScheduleScreenProps {
  navigation: any;
}

const ScheduleScreen = ({ navigation }: ScheduleScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<ProgramsResponse[]>([]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      console.log('🔍 ScheduleScreen - Fetching programs...');
      
      const response = await AuthService.getAllPrograms();
      console.log('🔍 ScheduleScreen - Raw API response:', JSON.stringify(response, null, 2));
      
      let programsData: ProgramsResponse[] = [];
      if (response) {
        // getAllPrograms returns data directly, not wrapped in response.data
        if (Array.isArray(response)) {
          programsData = response;
          console.log('🔍 ScheduleScreen - Response is array, length:', response.length);
        } else if (response && typeof response === 'object') {
          programsData = (response as any).data || (response as any).programs || (response as any).items || [];
          console.log('🔍 ScheduleScreen - Response is object, extracted data length:', programsData.length);
        }
      }
      
      // Debug: Check if programs have classrooms
      programsData.forEach((program, index) => {
        console.log(`🔍 ScheduleScreen - Program ${index + 1}:`, {
          id: program.id,
          nameAr: program.nameAr,
          classrooms: program.classrooms,
          classroomsLength: program.classrooms?.length || 0
        });
        
        if (program.classrooms && program.classrooms.length > 0) {
          console.log(`🔍 ScheduleScreen - Program ${program.nameAr} classrooms:`, program.classrooms);
        } else {
          console.log(`🔍 ScheduleScreen - Program ${program.nameAr} has NO classrooms!`);
        }
      });
      
      setPrograms(programsData);
      console.log('🔍 ScheduleScreen - Programs loaded:', programsData.length);
    } catch (error) {
      console.error('🔍 ScheduleScreen - Error fetching programs:', error);
      Alert.alert('خطأ', 'فشل في تحميل البرامج التدريبية');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrograms();
    setRefreshing(false);
  };

  const handleProgramPress = (program: ProgramsResponse) => {
    console.log('🔍 ScheduleScreen - Program pressed:', {
      id: program.id,
      nameAr: program.nameAr,
      classrooms: program.classrooms,
      classroomsLength: program.classrooms?.length || 0
    });
    
    // Debug: Check each classroom ID
    if (program.classrooms && program.classrooms.length > 0) {
      program.classrooms.forEach((classroom, index) => {
        console.log(`🔍 ScheduleScreen - Classroom ${index + 1}:`, {
          id: classroom.id,
          name: classroom.name,
          classNumber: classroom.classNumber,
          idType: typeof classroom.id,
          idValue: classroom.id,
          isIdValid: !isNaN(classroom.id) && classroom.id > 0
        });
      });
    }
    
    if (!program.classrooms || program.classrooms.length === 0) {
      Alert.alert(
        'تحذير', 
        `البرنامج "${program.nameAr}" لا يحتوي على فصول دراسية متاحة.`,
        [{ text: 'موافق' }]
      );
      return;
    }
    
    console.log('🔍 ScheduleScreen - Navigating to semester selection with classrooms:', program.classrooms);
    navigation.navigate('SemesterSelection', { 
      programId: program.id, 
      programName: program.nameAr,
      classrooms: program.classrooms,
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#F44336';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  const getClassLevelLabel = (level: string) => {
    switch (level) {
      case 'FIRST':
        return 'الفرقة الأولى';
      case 'SECOND':
        return 'الفرقة الثانية';
      case 'THIRD':
        return 'الفرقة الثالثة';
      case 'FOURTH':
        return 'الفرقة الرابعة';
      default:
        return level;
    }
  };

  const renderProgramCard = (program: ProgramsResponse) => (
    <TouchableOpacity 
      key={program.id} 
      style={styles.programCard}
      onPress={() => handleProgramPress(program)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Icon name="school" size={24} color="#1a237e" />
          <Text style={styles.programTitle}>{program.nameAr}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>عرض الجدول</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="description" size={20} color="#666" />
          <Text style={styles.infoLabel}>الوصف:</Text>
          <Text style={styles.infoValue}>{program.description || 'لا يوجد وصف'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="schedule" size={20} color="#666" />
          <Text style={styles.infoLabel}>المدة:</Text>
          <Text style={styles.infoValue}>{program.duration} أسبوع</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="group" size={20} color="#666" />
          <Text style={styles.infoLabel}>عدد المتدربين:</Text>
          <Text style={styles.infoValue}>{program._count.trainees}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="class" size={20} color="#666" />
          <Text style={styles.infoLabel}>عدد الفصول:</Text>
          <Text style={styles.infoValue}>{program._count.classrooms}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="visibility" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>عرض الجدول</Text>
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
          <Text style={styles.headerTitle}>الجداول الدراسية</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل البرامج التدريبية...</Text>
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
        <Text style={styles.headerTitle}>الجداول الدراسية</Text>
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
            <Icon name="school" size={32} color="#1a237e" />
            <Text style={styles.statNumber}>{programs.length}</Text>
            <Text style={styles.statLabel}>إجمالي البرامج</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="schedule" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{programs.length}</Text>
            <Text style={styles.statLabel}>برامج متاحة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="group" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{programs.reduce((sum, p) => sum + p._count.trainees, 0)}</Text>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
          </View>
        </View>

        {/* قائمة البرامج */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>البرامج التدريبية</Text>
        </View>

        {programs.length > 0 ? (
          <View style={styles.programsList}>
            {programs.map(renderProgramCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="school" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
            <Text style={styles.emptySubtitle}>لم يتم إنشاء أي برامج تدريبية بعد</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
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
  schedulesList: {
    marginBottom: 20,
  },
  scheduleCard: {
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
  scheduleTitle: {
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
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
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
  // Styles للفترات الدراسية
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
  },
  slotsList: {
    marginBottom: 20,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
    flex: 1,
  },
  timeBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  emptySlotsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptySlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  emptySlotsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Styles للبرامج التدريبية
  programsList: {
    marginBottom: 20,
  },
  programCard: {
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
  programTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
    flex: 1,
  },
});

export default ScheduleScreen;


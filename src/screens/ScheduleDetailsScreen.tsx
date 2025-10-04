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
import AddScheduleSlotModal from '../components/AddScheduleSlotModal';
import AuthService from '../services/AuthService';
import { ClassroomScheduleResponse, DayOfWeek, SessionType } from '../types/scheduleManagement';

interface ScheduleDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      programId: number;
      programName: string;
      classroomId: number;
      classroomName: string;
    };
  };
}

const ScheduleDetailsScreen = ({ navigation, route }: ScheduleDetailsScreenProps) => {
  const { programId, programName, classroomId, classroomName } = route.params;
  
  console.log('🔍 ScheduleDetailsScreen - Component loaded with params:', {
    programId: programId,
    programName: programName,
    classroomId: classroomId,
    classroomName: classroomName,
    classroomIdType: typeof classroomId,
    classroomIdValue: classroomId
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<ClassroomScheduleResponse[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);

  useEffect(() => {
    if (classroomId) {
      console.log('🔍 ScheduleDetailsScreen - classroomId exists, fetching schedule slots');
      console.log('🔍 ScheduleDetailsScreen - Current API endpoint:', 'https://mansapi.tiba29.com');
      fetchScheduleSlots();
    } else {
      console.log('🔍 ScheduleDetailsScreen - classroomId is missing or invalid:', classroomId);
      Alert.alert('خطأ', 'معرف الفصل الدراسي غير صحيح');
      setLoading(false);
    }
  }, [classroomId]);

  const fetchScheduleSlots = async () => {
    try {
      setLoading(true);
      console.log('🔍 ScheduleDetailsScreen - Fetching classroom schedule for classroomId:', classroomId);
      console.log('🔍 ScheduleDetailsScreen - classroomId type:', typeof classroomId);
      console.log('🔍 ScheduleDetailsScreen - classroomId value:', classroomId);
      console.log('🔍 ScheduleDetailsScreen - classroomId is number?', typeof classroomId === 'number');
      console.log('🔍 ScheduleDetailsScreen - classroomId is string?', typeof classroomId === 'string');
      console.log('🔍 ScheduleDetailsScreen - classroomId toString:', classroomId?.toString());
      
      // Ensure classroomId is a number
      const numericClassroomId = typeof classroomId === 'string' ? parseInt(classroomId, 10) : classroomId;
      console.log('🔍 ScheduleDetailsScreen - Numeric classroomId:', numericClassroomId);
      console.log('🔍 ScheduleDetailsScreen - Is numeric classroomId valid?', !isNaN(numericClassroomId) && numericClassroomId > 0);
      
      if (isNaN(numericClassroomId) || numericClassroomId <= 0) {
        throw new Error(`Invalid classroomId: ${classroomId} (converted to: ${numericClassroomId})`);
      }
      
      // Use the new classroom schedule endpoint
      const response = await AuthService.getClassroomSchedule(numericClassroomId);
      console.log('🔍 ScheduleDetailsScreen - Classroom schedule response:', JSON.stringify(response, null, 2));
      console.log('🔍 ScheduleDetailsScreen - Response type:', typeof response);
      console.log('🔍 ScheduleDetailsScreen - Is response array?', Array.isArray(response));
      
      let scheduleData: ClassroomScheduleResponse[] = [];
      if (response) {
        // Handle different response structures
        if (Array.isArray(response)) {
          scheduleData = response;
          console.log('🔍 ScheduleDetailsScreen - Response is array, using directly');
        } else if (response.data) {
          console.log('🔍 ScheduleDetailsScreen - Response has data property:', response.data);
          scheduleData = Array.isArray(response.data) ? response.data : response.data.slots || response.data.schedule || [];
        } else if (response.schedule) {
          console.log('🔍 ScheduleDetailsScreen - Response has schedule property:', response.schedule);
          scheduleData = Array.isArray(response.schedule) ? response.schedule : [];
        } else {
          console.log('🔍 ScheduleDetailsScreen - Unknown response structure, trying to extract data');
          // Try to find any array in the response
          const responseKeys = Object.keys(response);
          console.log('🔍 ScheduleDetailsScreen - Response keys:', responseKeys);
          
          for (const key of responseKeys) {
            if (Array.isArray(response[key])) {
              scheduleData = response[key];
              console.log('🔍 ScheduleDetailsScreen - Found array in key:', key);
              break;
            }
          }
        }
      } else {
        console.log('🔍 ScheduleDetailsScreen - Response is null or undefined');
      }
      
      console.log('🔍 ScheduleDetailsScreen - Final scheduleData:', scheduleData);
      console.log('🔍 ScheduleDetailsScreen - ScheduleData length:', scheduleData.length);
      
      setScheduleSlots(scheduleData);
      console.log('🔍 ScheduleDetailsScreen - Schedule slots loaded:', scheduleData.length);
    } catch (error) {
      console.error('🔍 ScheduleDetailsScreen - Error fetching classroom schedule:', error);
      console.error('🔍 ScheduleDetailsScreen - Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      
      // Provide more specific error messages
      let errorMessage = 'فشل في تحميل الجدول الدراسي';
      if ((error as Error).message.includes('Network request failed')) {
        errorMessage = 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.';
      } else if ((error as Error).message.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال. حاول مرة أخرى.';
      } else if ((error as Error).message.includes('غير مصرح')) {
        errorMessage = 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else if ((error as Error).message.includes('غير موجود')) {
        errorMessage = 'الفصل الدراسي غير موجود.';
      } else {
        errorMessage = `فشل في تحميل الجدول الدراسي: ${(error as Error).message}`;
      }
      
      Alert.alert('خطأ', errorMessage, [
        { text: 'إعادة المحاولة', onPress: () => fetchScheduleSlots() },
        { text: 'موافق', style: 'cancel' }
      ]);
      setScheduleSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScheduleSlots();
    setRefreshing(false);
  };

  const handleAddSlotSuccess = () => {
    console.log('🔍 ScheduleDetailsScreen - Slot added successfully, refreshing data...');
    fetchScheduleSlots();
  };

  const getDayLabel = (dayOfWeek: string) => {
    const days = {
      'SUNDAY': 'الأحد',
      'MONDAY': 'الاثنين',
      'TUESDAY': 'الثلاثاء',
      'WEDNESDAY': 'الأربعاء',
      'THURSDAY': 'الخميس',
      'FRIDAY': 'الجمعة',
      'SATURDAY': 'السبت',
    };
    return days[dayOfWeek as keyof typeof days] || dayOfWeek;
  };

  const getSessionTypeLabel = (type: SessionType) => {
    const types = {
      'THEORY': 'نظري',
      'PRACTICAL': 'عملي',
    };
    return types[type] || type;
  };

  const renderScheduleSlotCard = (slot: ClassroomScheduleResponse) => (
    <View key={slot.id} style={styles.slotCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Icon name="access-time" size={20} color="#1a237e" />
          <Text style={styles.slotTitle}>{slot.content.name}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{slot.startTime} - {slot.endTime}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="code" size={16} color="#666" />
          <Text style={styles.infoLabel}>الكود:</Text>
          <Text style={styles.infoValue}>{slot.content.code}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.infoLabel}>المحاضر:</Text>
          <Text style={styles.infoValue}>{slot.content.instructor.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="calendar-today" size={16} color="#666" />
          <Text style={styles.infoLabel}>اليوم:</Text>
          <Text style={styles.infoValue}>{getDayLabel(slot.dayOfWeek)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="school" size={16} color="#666" />
          <Text style={styles.infoLabel}>الفصل:</Text>
          <Text style={styles.infoValue}>{slot.classroom.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.infoLabel}>النوع:</Text>
          <Text style={styles.infoValue}>{getSessionTypeLabel(slot.type)}</Text>
        </View>

        {slot.location && (
          <View style={styles.infoRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.infoLabel}>المكان:</Text>
            <Text style={styles.infoValue}>{slot.location}</Text>
          </View>
        )}

        {slot.distributionRoom && (
          <View style={styles.infoRow}>
            <Icon name="meeting-room" size={16} color="#666" />
            <Text style={styles.infoLabel}>القاعة:</Text>
            <Text style={styles.infoValue}>{slot.distributionRoom.roomName} - {slot.distributionRoom.roomNumber}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.infoLabel}>الجلسات:</Text>
          <Text style={styles.infoValue}>{slot._count.sessions}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={20} color="#1a237e" />
          <Text style={styles.actionText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="delete" size={20} color="#F44336" />
          <Text style={styles.actionText}>حذف</Text>
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
          <Text style={styles.headerTitle}>جدول {classroomName}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الجدول الدراسي...</Text>
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
        <Text style={styles.headerTitle}>جدول {classroomName}</Text>
        <TouchableOpacity onPress={() => setShowAddSlotModal(true)}>
          <Icon name="add" size={24} color="#1a237e" />
        </TouchableOpacity>
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
            <Icon name="schedule" size={32} color="#1a237e" />
            <Text style={styles.statNumber}>{scheduleSlots.length}</Text>
            <Text style={styles.statLabel}>إجمالي الفترات</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="access-time" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{scheduleSlots.length}</Text>
            <Text style={styles.statLabel}>فترات نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="group" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{new Set(scheduleSlots.map(s => s.dayOfWeek)).size}</Text>
            <Text style={styles.statLabel}>أيام مختلفة</Text>
          </View>
        </View>

        {/* الفترات الدراسية */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الفترات الدراسية</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddSlotModal(true)}
          >
            <Icon name="add" size={20} color="#1a237e" />
            <Text style={styles.addButtonText}>إضافة فترة</Text>
          </TouchableOpacity>
        </View>

        {scheduleSlots.length > 0 ? (
          <View style={styles.slotsList}>
            {scheduleSlots.map(renderScheduleSlotCard)}
          </View>
        ) : (
          <View style={styles.emptySlotsContainer}>
            <Icon name="access-time" size={48} color="#ccc" />
            <Text style={styles.emptySlotsTitle}>لا توجد فترات دراسية</Text>
            <Text style={styles.emptySlotsSubtitle}>اضغط على "إضافة فترة" لإنشاء فترة دراسية جديدة</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal إضافة فترة دراسية */}
      <AddScheduleSlotModal
        visible={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onSuccess={handleAddSlotSuccess}
        classroomId={programId}
      />
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
});

export default ScheduleDetailsScreen;

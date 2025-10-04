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

interface ScheduleScreenProps {
  navigation: any;
}

const ScheduleScreen = ({ navigation }: ScheduleScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      console.log('🔍 ScheduleScreen - Fetching schedules...');
      
      // TODO: Replace with actual API call
      // const response = await AuthService.getSchedules();
      // setSchedules(response.data);
      
      // Mock data for now
      const mockSchedules = [
        {
          id: 1,
          title: 'جدول البرمجة - الفرقة الأولى',
          program: 'برنامج تطوير الويب',
          classLevel: 'FIRST',
          academicYear: '2025/2026',
          startDate: '2025-01-15',
          endDate: '2025-06-15',
          isActive: true,
          createdAt: '2025-01-10T10:00:00Z',
        },
        {
          id: 2,
          title: 'جدول التصميم - الفرقة الثانية',
          program: 'برنامج التصميم الجرافيكي',
          classLevel: 'SECOND',
          academicYear: '2025/2026',
          startDate: '2025-01-20',
          endDate: '2025-06-20',
          isActive: true,
          createdAt: '2025-01-12T10:00:00Z',
        },
        {
          id: 3,
          title: 'جدول الشبكات - الفرقة الثالثة',
          program: 'برنامج الشبكات',
          classLevel: 'THIRD',
          academicYear: '2025/2026',
          startDate: '2025-01-25',
          endDate: '2025-06-25',
          isActive: false,
          createdAt: '2025-01-14T10:00:00Z',
        },
      ];
      
      setSchedules(mockSchedules);
      console.log('🔍 ScheduleScreen - Schedules loaded:', mockSchedules.length);
    } catch (error) {
      console.error('🔍 ScheduleScreen - Error fetching schedules:', error);
      Alert.alert('خطأ', 'فشل في تحميل الجداول الدراسية');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSchedules();
    setRefreshing(false);
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

  const renderScheduleCard = (schedule: any) => (
    <View key={schedule.id} style={styles.scheduleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Icon name="schedule" size={24} color="#1a237e" />
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.isActive) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(schedule.isActive) }]}>
            {getStatusLabel(schedule.isActive)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="school" size={20} color="#666" />
          <Text style={styles.infoLabel}>البرنامج:</Text>
          <Text style={styles.infoValue}>{schedule.program}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="class" size={20} color="#666" />
          <Text style={styles.infoLabel}>الفرقة:</Text>
          <Text style={styles.infoValue}>{getClassLevelLabel(schedule.classLevel)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="calendar-today" size={20} color="#666" />
          <Text style={styles.infoLabel}>العام الدراسي:</Text>
          <Text style={styles.infoValue}>{schedule.academicYear}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="date-range" size={20} color="#666" />
          <Text style={styles.infoLabel}>الفترة:</Text>
          <Text style={styles.infoValue}>
            {new Date(schedule.startDate).toLocaleDateString('ar-EG')} - {new Date(schedule.endDate).toLocaleDateString('ar-EG')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="access-time" size={20} color="#666" />
          <Text style={styles.infoLabel}>تاريخ الإنشاء:</Text>
          <Text style={styles.infoValue}>{new Date(schedule.createdAt).toLocaleDateString('ar-EG')}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="visibility" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>عرض</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={20} color="#1a237e" />
          <Text style={styles.actionText}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name={schedule.isActive ? "block" : "check-circle"} size={20} color={schedule.isActive ? "#F44336" : "#4CAF50"} />
          <Text style={styles.actionText}>{schedule.isActive ? "إيقاف" : "تفعيل"}</Text>
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
          <Text style={styles.headerTitle}>الجداول الدراسية</Text>
          <TouchableOpacity>
            <Icon name="add" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الجداول الدراسية...</Text>
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
        <TouchableOpacity>
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
            <Text style={styles.statNumber}>{schedules.length}</Text>
            <Text style={styles.statLabel}>إجمالي الجداول</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{schedules.filter(s => s.isActive).length}</Text>
            <Text style={styles.statLabel}>جداول نشطة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="block" size={32} color="#F44336" />
            <Text style={styles.statNumber}>{schedules.filter(s => !s.isActive).length}</Text>
            <Text style={styles.statLabel}>جداول متوقفة</Text>
          </View>
        </View>

        {/* قائمة الجداول */}
        {schedules.length > 0 ? (
          <View style={styles.schedulesList}>
            {schedules.map(renderScheduleCard)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="schedule" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد جداول دراسية</Text>
            <Text style={styles.emptySubtitle}>لم يتم إنشاء أي جداول دراسية بعد</Text>
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
    paddingTop: 20,
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
});

export default ScheduleScreen;

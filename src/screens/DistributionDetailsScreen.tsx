import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { TraineeDistributionDetail, DistributionType } from '../types/distribution';

const DistributionDetailsScreen = ({ navigation, route }: any) => {
  const { distributionId } = route.params;
  const [distribution, setDistribution] = useState<TraineeDistributionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadDistribution = async () => {
      try {
        setLoading(true);
        const data = await AuthService.getTraineeDistribution(distributionId);
        setDistribution(data);
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'فشل تحميل التوزيع', text2: error?.message, position: 'bottom' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadDistribution();
  }, [distributionId]);

  const getTypeLabel = (type: DistributionType) => {
    return type === DistributionType.THEORY ? 'نظري' : 'عملي';
  };

  const getTypeColor = (type: DistributionType) => {
    return type === DistributionType.THEORY ? '#1976d2' : '#059669';
  };

  const getTypeBgColor = (type: DistributionType) => {
    return type === DistributionType.THEORY ? '#e3f2fd' : '#e8f5e9';
  };

  const renderTraineeItem = ({ item }: { item: any }) => (
    <View style={styles.traineeItem}>
      <Text style={styles.traineeName}>{item.trainee.nameAr}</Text>
      <Text style={styles.traineeDetails}>
        {item.trainee.nationalId && `الرقم القومي: ${item.trainee.nationalId}`}
        {item.trainee.phone && ` • ${item.trainee.phone}`}
      </Text>
      {item.notes && <Text style={styles.traineeNotes}>{item.notes}</Text>}
      <Text style={styles.orderNumber}>ترتيب: {item.orderNumber}</Text>
    </View>
  );

  const renderModalTraineeItem = ({ item }: { item: any }) => (
    <View style={styles.modalTraineeItem}>
      <View style={styles.modalTraineeHeader}>
        <Text style={styles.modalTraineeName}>{item.trainee.nameAr}</Text>
        <Text style={styles.modalOrderNumber}>#{item.orderNumber}</Text>
      </View>
      <Text style={styles.modalTraineeDetails}>
        {item.trainee.nationalId && `الرقم القومي: ${item.trainee.nationalId}`}
        {item.trainee.phone && ` • ${item.trainee.phone}`}
        {item.trainee.email && ` • ${item.trainee.email}`}
      </Text>
      {item.notes && <Text style={styles.modalTraineeNotes}>{item.notes}</Text>}
    </View>
  );

  const handleViewTrainees = (room: any) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const renderRoomCard = ({ item }: { item: any }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{item.roomName}</Text>
        <View style={styles.traineeCountBadge}>
          <Text style={styles.traineeCountText}>{item.assignments.length} متدرب</Text>
        </View>
      </View>
        <View style={styles.roomContent}>
          <Text style={styles.roomLabel}>عدد المتدربين: {item.assignments.length}</Text>
          <Text style={styles.capacityLabel}>السعة: {item.capacity}</Text>
          <FlatList
            data={item.assignments}
            keyExtractor={(assignment) => assignment.id}
            renderItem={renderTraineeItem}
            showsVerticalScrollIndicator={false}
            style={styles.traineesList}
          />
        </View>
      <View style={styles.roomActions}>
        <TouchableOpacity style={styles.printBtn}>
          <Icon name="print" size={16} color="#1a237e" />
          <Text style={styles.printText}>طباعة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewTrainees(item)}>
          <Icon name="visibility" size={16} color="#1a237e" />
          <Text style={styles.viewText}>استعراض</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="DistributionDetails" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل التوزيع</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل التوزيع...</Text>
        </View>
      </View>
    );
  }

  if (!distribution) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="DistributionDetails" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>تفاصيل التوزيع</Text>
            <Text style={styles.subtitle}>لم يتم العثور على التوزيع</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalTrainees = distribution.rooms.reduce((sum, room) => sum + room.assignments.length, 0);
  const averagePerRoom = distribution.rooms.length > 0 ? Math.round(totalTrainees / distribution.rooms.length) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DistributionDetails" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>توزيع متدربي {distribution.program.nameAr}</Text>
          <Text style={styles.subtitle}>
            {getTypeLabel(distribution.type)} • العام الدراسي: {distribution.academicYear}
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.redistributeBtn}>
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.redistributeText}>إعادة التوزيع</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.printBtn}>
            <Icon name="print" size={20} color="#fff" />
            <Text style={styles.printText}>طباعة</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>متوسط المتدربين / القاعة</Text>
            <Text style={styles.statValue}>{averagePerRoom}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
            <Text style={styles.statValue}>{totalTrainees}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>عدد القاعات</Text>
            <Text style={styles.statValue}>{distribution.rooms.length}</Text>
          </View>
        </View>

        {/* Room Cards */}
        <View style={styles.roomsContainer}>
          <Text style={styles.roomsTitle}>قاعات {getTypeLabel(distribution.type)}</Text>
          <FlatList
            data={distribution.rooms}
            keyExtractor={(room) => room.id}
            renderItem={renderRoomCard}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Modal for viewing trainees */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedRoom?.roomName} - قائمة المتدربين
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalStats}>
                إجمالي المتدربين: {selectedRoom?.assignments.length || 0}
              </Text>
              
              <FlatList
                data={selectedRoom?.assignments || []}
                keyExtractor={(assignment) => assignment.id}
                renderItem={renderModalTraineeItem}
                showsVerticalScrollIndicator={true}
                style={styles.modalTraineesList}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DistributionDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, padding: 20 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  redistributeBtn: {
    flex: 1,
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  redistributeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  printBtn: {
    flex: 1,
    backgroundColor: '#8e24aa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  printText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1a237e' },
  roomsContainer: { marginBottom: 20 },
  roomsTitle: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 16 },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  roomName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  traineeCountBadge: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  traineeCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  roomContent: { padding: 16 },
  roomLabel: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  traineesList: { maxHeight: 200 },
  traineeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  traineeName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  traineeDetails: { fontSize: 12, color: '#6b7280' },
  traineeNotes: { fontSize: 12, color: '#059669', fontStyle: 'italic', marginTop: 4 },
  orderNumber: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  capacityLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderColor: '#1a237e',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 8,
  },
  viewText: { color: '#1a237e', fontWeight: '600', fontSize: 12 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    flex: 1,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  modalContent: {
    padding: 20,
  },
  modalStats: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalTraineesList: {
    maxHeight: 400,
  },
  modalTraineeItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTraineeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTraineeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  modalOrderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a237e',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  modalTraineeDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalTraineeNotes: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
});

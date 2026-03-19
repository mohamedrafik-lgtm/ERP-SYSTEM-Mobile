import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Modal, Image } from 'react-native';
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

  const getTraineeImage = (trainee: any): string | undefined => {
    return trainee?.photoUrl || trainee?.photo || undefined;
  };

  const renderTraineeItem = ({ item }: { item: any }) => (
    <View style={styles.traineeItem}>
      <View style={styles.traineeTopRow}>
        <View style={styles.traineeIdentityRow}>
          {getTraineeImage(item.trainee) ? (
            <Image source={{ uri: getTraineeImage(item.trainee) }} style={styles.traineeAvatar} />
          ) : (
            <View style={styles.traineeAvatarPlaceholder}>
              <Text style={styles.traineeAvatarPlaceholderText}>
                {item?.trainee?.nameAr?.charAt(0) || 'م'}
              </Text>
            </View>
          )}
          <View style={styles.traineeInfoBlock}>
            <Text style={styles.traineeName}>{item.trainee.nameAr}</Text>
            <Text style={styles.traineeDetails} numberOfLines={1}>
              {item.trainee.nationalId && `الرقم القومي: ${item.trainee.nationalId}`}
              {item.trainee.phone && ` • ${item.trainee.phone}`}
            </Text>
          </View>
        </View>
        <View style={styles.orderPill}>
          <Text style={styles.orderPillText}>#{item.orderNumber}</Text>
        </View>
      </View>
      {item.notes ? <Text style={styles.traineeNotes}>{item.notes}</Text> : null}
    </View>
  );

  const renderModalTraineeItem = ({ item }: { item: any }) => (
    <View style={styles.modalTraineeItem}>
      <View style={styles.modalTraineeHeader}>
        <View style={styles.traineeIdentityRow}>
          {getTraineeImage(item.trainee) ? (
            <Image source={{ uri: getTraineeImage(item.trainee) }} style={styles.modalAvatar} />
          ) : (
            <View style={styles.modalAvatarPlaceholder}>
              <Text style={styles.modalAvatarPlaceholderText}>{item?.trainee?.nameAr?.charAt(0) || 'م'}</Text>
            </View>
          )}
          <Text style={styles.modalTraineeName}>{item.trainee.nameAr}</Text>
        </View>
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
        <View>
          <Text style={styles.roomName}>{item.roomName}</Text>
          <Text style={styles.roomSubTitle}>قاعة رقم {item.roomNumber}</Text>
        </View>
        <View style={styles.traineeCountBadge}>
          <Text style={styles.traineeCountText}>{item.assignments.length} متدرب</Text>
        </View>
      </View>
      <View style={styles.roomMetaRow}>
        <View style={styles.metaChip}>
          <Icon name="groups" size={14} color="#334155" />
          <Text style={styles.metaChipText}>عدد المتدربين: {item.assignments.length}</Text>
        </View>
        <View style={styles.metaChip}>
          <Icon name="meeting-room" size={14} color="#334155" />
          <Text style={styles.metaChipText}>السعة: {item.capacity}</Text>
        </View>
      </View>

      <View style={styles.roomContent}>
        <FlatList
          data={item.assignments}
          keyExtractor={(assignment) => assignment.id}
          renderItem={renderTraineeItem}
          showsVerticalScrollIndicator={false}
          style={styles.traineesList}
        />
      </View>
      <View style={styles.roomActions}>
        <TouchableOpacity style={styles.roomActionBtn}>
          <Icon name="print" size={16} color="#7e22ce" />
          <Text style={styles.roomActionText}>طباعة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roomActionBtn, styles.roomActionPrimary]} onPress={() => handleViewTrainees(item)}>
          <Icon name="visibility" size={16} color="#1d4ed8" />
          <Text style={[styles.roomActionText, styles.roomActionPrimaryText]}>استعراض</Text>
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
          <TouchableOpacity style={styles.printTopBtn}>
            <Icon name="print" size={20} color="#fff" />
            <Text style={styles.printTopText}>طباعة</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Statistics */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderTopColor: '#0f766e' }]}>
            <Text style={styles.statLabel}>متوسط المتدربين / القاعة</Text>
            <Text style={styles.statValue}>{averagePerRoom}</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#1d4ed8' }]}>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
            <Text style={styles.statValue}>{totalTrainees}</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#7e22ce' }]}>
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
  container: { flex: 1, backgroundColor: '#eef2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: { flex: 1, marginHorizontal: 10 },
  title: { fontSize: 23, fontWeight: '800', color: '#1e3a8a' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, padding: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  redistributeBtn: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#fb923c',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  redistributeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  printTopBtn: {
    flex: 1,
    backgroundColor: '#7e22ce',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#9333ea',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  printTopText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 3,
  },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8, textAlign: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  roomsContainer: { marginBottom: 20 },
  roomsTitle: { fontSize: 19, fontWeight: '800', color: '#1e3a8a', marginBottom: 12 },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  roomName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  roomSubTitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  traineeCountBadge: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  traineeCountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  roomMetaRow: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaChipText: { fontSize: 12, color: '#334155', fontWeight: '600' },
  roomContent: { paddingHorizontal: 14, paddingVertical: 10 },
  traineesList: { maxHeight: 220 },
  traineeItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  traineeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  traineeIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  traineeInfoBlock: {
    flex: 1,
    marginRight: 8,
  },
  traineeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#e2e8f0',
  },
  traineeAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  traineeAvatarPlaceholderText: {
    color: '#1e3a8a',
    fontWeight: '800',
    fontSize: 14,
  },
  traineeName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  traineeDetails: { fontSize: 12, color: '#64748b' },
  traineeNotes: { fontSize: 12, color: '#059669', fontStyle: 'italic', marginTop: 6 },
  orderPill: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  orderPillText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 11,
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  roomActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
    borderRadius: 8,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    backgroundColor: '#faf5ff',
  },
  roomActionPrimary: {
    marginLeft: 8,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  roomActionText: { color: '#7e22ce', fontWeight: '700', fontSize: 12 },
  roomActionPrimaryText: { color: '#1d4ed8' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
    padding: 16,
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
    backgroundColor: '#eef2ff',
  },
  modalContent: {
    padding: 14,
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
    borderRadius: 10,
    padding: 10,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  modalAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  modalAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalAvatarPlaceholderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
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

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { TraineeDistributionsResponse, DistributionType } from '../types/distribution';

interface ProgramDistributionsScreenProps {
  navigation: any;
  route: any;
}

const ProgramDistributionsScreen: React.FC<ProgramDistributionsScreenProps> = ({ navigation, route }) => {
  const { programId, programName } = route.params;
  const [distributions, setDistributions] = useState<TraineeDistributionsResponse>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDistributions = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getTraineeDistributions({ programId });
      setDistributions(data);
    } catch (error) {
      console.error('Error loading distributions:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ في تحميل التوزيعات',
        text2: 'تعذر الاتصال بالخادم',
        position: 'bottom'
      });
      setDistributions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDistributions();
  }, [programId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDistributions();
  };

  const getTypeLabel = (type: DistributionType) => {
    return type === DistributionType.THEORY ? 'نظري' : 'عملي';
  };

  const getTypeColor = (type: DistributionType) => {
    return type === DistributionType.THEORY ? '#1976d2' : '#059669';
  };

  const getTypeBgColor = (type: DistributionType) => {
    return type === DistributionType.THEORY ? '#e3f2fd' : '#e8f5e9';
  };

  const handleViewDistribution = (distributionId: string) => {
    navigation.navigate('DistributionDetails', { distributionId });
  };

  const handlePrintDistribution = (distribution: any) => {
    // TODO: Implement print functionality
    Toast.show({
      type: 'info',
      text1: 'طباعة التوزيع',
      text2: 'سيتم إضافة وظيفة الطباعة قريباً',
      position: 'bottom'
    });
  };

  const renderDistributionCard = ({ item }: { item: any }) => (
    <View style={styles.distributionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]} />
          <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.academicYear}>{item.academicYear}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>عدد القاعات</Text>
            <Text style={styles.statValue}>{item.numberOfRooms}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
            <Text style={styles.statValue}>
              {item.rooms.reduce((sum: number, room: any) => sum + room._count.assignments, 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>متوسط / قاعة</Text>
            <Text style={styles.statValue}>
              {item.rooms.length > 0 
                ? Math.round(item.rooms.reduce((sum: number, room: any) => sum + room._count.assignments, 0) / item.rooms.length)
                : 0
              }
            </Text>
          </View>
        </View>

        <View style={styles.roomsPreview}>
          <Text style={styles.roomsTitle}>القاعات:</Text>
          <View style={styles.roomsList}>
            {item.rooms.slice(0, 3).map((room: any, index: number) => (
              <View key={room.id} style={styles.roomItem}>
                <Text style={styles.roomName}>{room.roomName}</Text>
                <Text style={styles.roomCount}>({room._count.assignments})</Text>
              </View>
            ))}
            {item.rooms.length > 3 && (
              <Text style={styles.moreRooms}>+{item.rooms.length - 3} قاعات أخرى</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.viewBtn}
          onPress={() => handleViewDistribution(item.id)}
        >
          <Icon name="visibility" size={16} color="#1a237e" />
          <Text style={styles.viewText}>عرض التفاصيل</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.printBtn}
          onPress={() => handlePrintDistribution(item)}
        >
          <Icon name="print" size={16} color="#059669" />
          <Text style={styles.printText}>طباعة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="ProgramDistributions" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>توزيعات {programName}</Text>
            <Text style={styles.subtitle}>جاري التحميل...</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل التوزيعات...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="ProgramDistributions" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>توزيعات {programName}</Text>
          <Text style={styles.subtitle}>
            {distributions.length} توزيع • نظري وعملي
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {distributions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد توزيعات</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم إنشاء أي توزيعات لهذا البرنامج بعد
            </Text>
            <TouchableOpacity 
              style={styles.createBtn}
              onPress={() => navigation.navigate('AddDistribution', { programId })}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>إنشاء توزيع جديد</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.distributionsContainer}>
            <Text style={styles.sectionTitle}>جميع التوزيعات</Text>
            <FlatList
              data={distributions}
              keyExtractor={(item) => item.id}
              renderItem={renderDistributionCard}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
      <Toast />
    </View>
  );
};

export default ProgramDistributionsScreen;

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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  distributionsContainer: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 16,
  },
  distributionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  academicYear: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
  },
  roomsPreview: {
    marginTop: 8,
  },
  roomsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  roomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  roomName: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  roomCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  moreRooms: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
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
  },
  viewText: {
    color: '#1a237e',
    fontWeight: '600',
    fontSize: 12,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  printText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 12,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import Toast from 'react-native-toast-message';
import StudyMaterialsService from '../services/StudyMaterialsService';
import AuthService from '../services/AuthService';

type Program = {
  id: number;
  nameAr: string;
  nameEn?: string;
};

type StudyMaterialLite = {
  id: string;
  name: string;
  nameEn?: string | null;
  quantity: number;
  linkedFee?: {
    id: number;
    name: string;
    amount: number;
  } | null;
  _count?: {
    deliveries?: number;
  };
};

const DeliveryTrackingScreen = ({ navigation }: any) => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialLite[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isLoading = loadingPrograms || loadingMaterials;

  const titleText = useMemo(() => {
    if (selectedProgram) {
      return `تسليم الأدوات - ${selectedProgram.nameAr}`;
    }
    return 'تتبع التسليم';
  }, [selectedProgram]);

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const authAny = AuthService as any;
      const apiResponse = typeof authAny.getTrainingPrograms === 'function'
        ? await authAny.getTrainingPrograms()
        : await authAny.getAllPrograms();
      const list = Array.isArray(apiResponse)
        ? apiResponse
        : apiResponse?.data || apiResponse?.programs || [];

      const normalized = list.map((program: any) => ({
        id: Number(program.id),
        nameAr: String(program.nameAr || program.name || `برنامج ${program.id}`),
        nameEn: program.nameEn || undefined,
      }));

      setPrograms(normalized);
    } catch (error: any) {
      setPrograms([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل البرامج التدريبية',
        text2: error?.message,
        position: 'bottom',
      });
    } finally {
      setLoadingPrograms(false);
      setRefreshing(false);
    }
  };

  const loadMaterials = async (programId: number, query: string) => {
    try {
      setLoadingMaterials(true);
      const response = await StudyMaterialsService.getStudyMaterials({
        programId,
        isActive: true,
        search: query || undefined,
        page: 1,
        limit: 200,
      });

      setMaterials((response?.materials || []) as StudyMaterialLite[]);
    } catch (error: any) {
      setMaterials([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الأدوات الدراسية',
        text2: error?.message,
        position: 'bottom',
      });
    } finally {
      setLoadingMaterials(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      loadMaterials(selectedProgram.id, searchQuery);
    }
  }, [selectedProgram, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedProgram) {
      await loadMaterials(selectedProgram.id, searchQuery);
    } else {
      await loadPrograms();
    }
  };

  const handleSelectProgram = (program: Program) => {
    setSelectedProgram(program);
    setSearchInput('');
    setSearchQuery('');
  };

  const handleBackToPrograms = () => {
    setSelectedProgram(null);
    setMaterials([]);
    setSearchInput('');
    setSearchQuery('');
  };

  const renderProgramCard = ({ item }: { item: Program }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectProgram(item)}>
      <View style={styles.cardIconWrap}>
        <Icon name="school" size={22} color="#1d4ed8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.nameAr}</Text>
        {!!item.nameEn && <Text style={styles.cardSubtitle}>{item.nameEn}</Text>}
      </View>
      <Icon name="arrow-forward-ios" size={16} color="#94a3b8" />
    </TouchableOpacity>
  );

  const renderMaterialCard = ({ item }: { item: StudyMaterialLite }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryTrackingMaterial', { materialId: item.id })}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: '#ecfdf5' }]}>
        <Icon name="inventory" size={22} color="#059669" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {!!item.nameEn && <Text style={styles.cardSubtitle}>{item.nameEn}</Text>}
        <View style={styles.inlineMeta}>
          <Text style={styles.metaText}>الكمية: {item.quantity}</Text>
          <Text style={styles.metaText}>تم التسليم: {item._count?.deliveries || 0}</Text>
        </View>
        {item.linkedFee ? (
          <Text style={styles.feeText}>يتطلب سداد: {item.linkedFee.name} ({item.linkedFee.amount} ج.م)</Text>
        ) : (
          <Text style={styles.freeText}>مجاني - لا يتطلب رسوم</Text>
        )}
      </View>
      <Icon name="arrow-forward-ios" size={16} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DeliveryTracking" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (selectedProgram ? handleBackToPrograms() : navigation.goBack())}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title}>{titleText}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!selectedProgram ? (
          <>
            <Text style={styles.sectionTitle}>اختر البرنامج التدريبي</Text>
            {loadingPrograms ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1a237e" />
              </View>
            ) : programs.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="school" size={72} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
                <Text style={styles.emptySubtitle}>لم يتم العثور على برامج متاحة</Text>
              </View>
            ) : (
              <FlatList
                data={programs}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderProgramCard}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.searchWrap}>
              <Icon name="search" size={20} color="#94a3b8" style={{ marginHorizontal: 8 }} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="ابحث في الأدوات الدراسية..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                onSubmitEditing={() => setSearchQuery(searchInput.trim())}
              />
              {!!searchQuery && (
                <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); }}>
                  <Icon name="close" size={20} color="#64748b" style={{ marginHorizontal: 8 }} />
                </TouchableOpacity>
              )}
            </View>

            {loadingMaterials ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1a237e" />
              </View>
            ) : materials.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="inventory-2" size={72} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>لا توجد أدوات دراسية</Text>
                <Text style={styles.emptySubtitle}>جرّب البحث بكلمة مختلفة أو اختر برنامج آخر</Text>
              </View>
            ) : (
              <FlatList
                data={materials}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderMaterialCard}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
              />
            )}
          </>
        )}
      </ScrollView>
      {isLoading && selectedProgram && (
        <View style={styles.floatingLoading}>
          <ActivityIndicator size="small" color="#1a237e" />
        </View>
      )}
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#1f2937',
    textAlign: 'right',
  },
  loaderWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
  },
  inlineMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  feeText: {
    marginTop: 6,
    fontSize: 12,
    color: '#b45309',
  },
  freeText: {
    marginTop: 6,
    fontSize: 12,
    color: '#047857',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 10,
  },
  floatingLoading: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default DeliveryTrackingScreen;
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import ArabicSearchInput from '../components/ArabicSearchInput';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { DistributionType } from '../types/distribution';

interface ProgramItem {
  id: number;
  nameAr: string;
}

interface UndistributedTrainee {
  id: number;
  nameAr: string;
  nameEn?: string;
  nationalId: string;
  photoUrl?: string | null;
  photo?: string | null;
  program: {
    id: number;
    nameAr: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UndistributedTraineesScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [trainees, setTrainees] = useState<UndistributedTrainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [programFilter, setProgramFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<DistributionType | undefined>(undefined);

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    loadTrainees(1);
  }, [programFilter, typeFilter, debouncedSearch]);

  const loadPrograms = async () => {
    try {
      const data = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading programs:', error);
      setPrograms([]);
    }
  };

  const loadTrainees = async (page: number) => {
    try {
      setLoading(true);

      const response = await AuthService.getUndistributedTrainees({
        page,
        limit: pagination.limit,
        programId: programFilter,
        type: typeFilter,
        search: debouncedSearch || undefined,
      });

      setTrainees(Array.isArray(response?.trainees) ? response.trainees : []);
      setPagination(
        response?.pagination || {
          page,
          limit: pagination.limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      );
    } catch (error: any) {
      console.error('Error loading undistributed trainees:', error);
      setTrainees([]);
      setPagination({
        page: 1,
        limit: pagination.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
      Toast.show({
        type: 'error',
        text1: 'تعذر تحميل المتدربين غير الموزعين',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrainees(pagination.page || 1);
  };

  const programOptions = [
    { value: undefined, label: 'جميع البرامج' },
    ...programs.map((p) => ({ value: p.id, label: p.nameAr })),
  ];

  const typeOptions = [
    { value: undefined, label: 'جميع الأنواع' },
    { value: DistributionType.THEORY, label: 'النظري' },
    { value: DistributionType.PRACTICAL, label: 'العملي' },
  ];

  const renderCard = ({ item, index }: { item: UndistributedTrainee; index: number }) => {
    const imageUri = item.photoUrl || item.photo || undefined;

    return (
      <View style={styles.traineeCard}>
        <View style={styles.traineeHeader}>
          <View style={styles.identityRow}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>{item.nameAr?.charAt(0) || 'م'}</Text>
              </View>
            )}

            <View style={styles.nameBlock}>
              <Text style={styles.name}>{item.nameAr}</Text>
              {item.nameEn ? <Text style={styles.nameEn}>{item.nameEn}</Text> : null}
            </View>
          </View>

          <Text style={styles.indexText}>#{(pagination.page - 1) * pagination.limit + index + 1}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>الرقم القومي:</Text>
          <Text style={styles.metaValue}>{item.nationalId || '-'}</Text>
        </View>

        <View style={styles.programBadgeRow}>
          <View style={styles.programBadge}>
            <Text style={styles.programBadgeText}>{item.program?.nameAr || '-'}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('DistributionManagement')}
          >
            <Icon name="open-in-new" size={15} color="#fff" />
            <Text style={styles.primaryBtnText}>توزيع</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="UndistributedTrainees" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>طلاب غير موزعين</Text>
          <Text style={styles.subtitle}>عرض المتدربين الذين لم يتم توزيعهم على أي مجموعة</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        <View style={styles.filterCard}>
          <SelectBox
            label="البرنامج التدريبي"
            selectedValue={programFilter}
            onValueChange={setProgramFilter}
            items={programOptions}
            placeholder="اختر البرنامج"
          />

          <SelectBox
            label="نوع التوزيع"
            selectedValue={typeFilter}
            onValueChange={setTypeFilter}
            items={typeOptions}
            placeholder="اختر النوع"
          />

          <ArabicSearchInput
            placeholder="ابحث بالاسم أو الرقم القومي"
            value={searchText}
            onChangeText={setSearchText}
            onSearch={() => setDebouncedSearch(searchText.trim())}
            style={{ marginBottom: 0 }}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>إجمالي غير الموزعين</Text>
            <Text style={styles.statValue}>{pagination.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>الصفحة الحالية</Text>
            <Text style={styles.statValue}>{pagination.page}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>نتائج الصفحة</Text>
            <Text style={styles.statValue}>{trainees.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : trainees.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="groups" size={56} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
            <Text style={styles.emptySubTitle}>لا يوجد متدربون غير موزعين وفق الفلاتر الحالية</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={trainees}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderCard}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[styles.pageBtn, !pagination.hasPrev && styles.pageBtnDisabled]}
            disabled={!pagination.hasPrev}
            onPress={() => loadTrainees(pagination.page - 1)}
          >
            <Text style={[styles.pageBtnText, !pagination.hasPrev && styles.pageBtnTextDisabled]}>السابق</Text>
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            صفحة {pagination.page} من {Math.max(1, pagination.totalPages || 1)}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, !pagination.hasNext && styles.pageBtnDisabled]}
            disabled={!pagination.hasNext}
            onPress={() => loadTrainees(pagination.page + 1)}
          >
            <Text style={[styles.pageBtnText, !pagination.hasNext && styles.pageBtnTextDisabled]}>التالي</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};

export default UndistributedTraineesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: { flex: 1, marginHorizontal: 10 },
  title: { fontSize: 21, fontWeight: '800', color: '#1e3a8a' },
  subtitle: { marginTop: 4, color: '#64748b', fontSize: 12 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  content: { flex: 1, padding: 16 },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1e3a8a', marginTop: 4 },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    padding: 28,
  },
  loadingText: { marginTop: 8, color: '#64748b' },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    padding: 28,
  },
  emptyTitle: { marginTop: 8, fontSize: 17, fontWeight: '700', color: '#334155' },
  emptySubTitle: { marginTop: 4, color: '#64748b', textAlign: 'center' },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  traineeCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 12,
  },
  traineeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  avatarPlaceholderText: { fontSize: 16, fontWeight: '800', color: '#1e3a8a' },
  nameBlock: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  nameEn: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  indexText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: { fontSize: 12, color: '#64748b' },
  metaValue: { fontSize: 12, color: '#334155', fontWeight: '600' },
  programBadgeRow: { marginTop: 8 },
  programBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  programBadgeText: { color: '#1d4ed8', fontSize: 11, fontWeight: '700' },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  paginationRow: {
    marginTop: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pageBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  pageBtnText: { color: '#1e293b', fontWeight: '700' },
  pageBtnTextDisabled: { color: '#94a3b8' },
  pageIndicator: { color: '#475569', fontWeight: '700' },
});

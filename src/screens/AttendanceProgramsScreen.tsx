import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import { usePermissions } from '../hooks/usePermissions';
import AuthService from '../services/AuthService';
import { AttendanceProgram } from '../types/studentAttendance';

interface AttendanceProgramsScreenProps {
  navigation: any;
}

const CARD_COLORS = ['#2563eb', '#0ea5e9', '#059669', '#7c3aed', '#ea580c', '#db2777'];

const AttendanceProgramsScreen = ({ navigation }: AttendanceProgramsScreenProps) => {
  const { canAccessScreen } = usePermissions();

  const [programs, setPrograms] = useState<AttendanceProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);

      const response = await AuthService.getAllPrograms();
      const normalized = (Array.isArray(response) ? response : []).map((item: any) => ({
        id: Number(item.id),
        nameAr: item.nameAr || item.name || `Program ${item.id}`,
        nameEn: item.nameEn,
        description: item.description,
        _count: {
          classrooms: Number(item?._count?.classrooms || 0),
        },
      }));

      setPrograms(normalized.filter(item => Number.isFinite(item.id)));
    } catch (error: any) {
      setPrograms([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل البرامج التدريبية',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const totalClassrooms = useMemo(
    () => programs.reduce((sum, item) => sum + Number(item?._count?.classrooms || 0), 0),
    [programs],
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPrograms();
  };

  const openProgram = (program: AttendanceProgram) => {
    navigation.navigate('AttendanceClassrooms', {
      programId: Number(program.id),
      programName: program.nameAr,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AttendancePrograms" />

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>رصد الحضور والغياب</Text>
          <Text style={styles.headerSubtitle}>اختر البرنامج ثم الفصل ثم المادة</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
          <Icon name="refresh" size={21} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Icon name="fact-check" size={28} color="#ffffff" />
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>لوحة حضور المتدربين</Text>
            <Text style={styles.heroSubtitle}>نفس تسلسل الويب: برامج ← فصول ← مواد ← محاضرات ← تسجيل</Text>
          </View>

          {canAccessScreen('AttendanceStats') ? (
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => navigation.navigate('AttendanceStats')}
            >
              <Icon name="bar-chart" size={18} color="#1d4ed8" />
              <Text style={styles.statsButtonText}>التقارير</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name="school" size={18} color="#2563eb" />
            <Text style={styles.statValue}>{programs.length}</Text>
            <Text style={styles.statLabel}>البرامج</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="meeting-room" size={18} color="#059669" />
            <Text style={styles.statValue}>{totalClassrooms}</Text>
            <Text style={styles.statLabel}>الفصول</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل البرامج...</Text>
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="school" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
            <Text style={styles.emptySubtitle}>لا توجد بيانات متاحة حالياً لهذا المستخدم</Text>
          </View>
        ) : (
          <View style={styles.cardsWrap}>
            {programs.map((program, idx) => (
              <TouchableOpacity
                key={program.id}
                activeOpacity={0.88}
                style={styles.programCard}
                onPress={() => openProgram(program)}
              >
                <View
                  style={[
                    styles.programAccent,
                    { backgroundColor: CARD_COLORS[idx % CARD_COLORS.length] },
                  ]}
                />

                <View style={styles.programTopRow}>
                  <View style={styles.programIconWrap}>
                    <Icon name="auto-stories" size={18} color="#1d4ed8" />
                  </View>
                  <Icon name="chevron-left" size={22} color="#94a3b8" />
                </View>

                <Text style={styles.programName}>{program.nameAr}</Text>
                <Text numberOfLines={2} style={styles.programDescription}>
                  {program.description || 'بدون وصف'}
                </Text>

                <View style={styles.programFooter}>
                  <Icon name="meeting-room" size={14} color="#1d4ed8" />
                  <Text style={styles.programFooterText}>
                    {Number(program?._count?.classrooms || 0)} فصل دراسي
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbe7ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
  },
  heroCard: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe7ff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
  },
  heroTextWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  heroSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '600',
  },
  statsButton: {
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  loadingWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  emptyCard: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardsWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  programCard: {
    width: '48.2%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  programAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  programTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  programIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0f172a',
    minHeight: 38,
  },
  programDescription: {
    marginTop: 5,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    minHeight: 32,
  },
  programFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eef2ff',
    paddingTop: 8,
    gap: 4,
  },
  programFooterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e3a8a',
  },
});

export default AttendanceProgramsScreen;

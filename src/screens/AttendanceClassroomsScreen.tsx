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
import AuthService from '../services/AuthService';
import { AttendanceClassroom, AttendanceProgramDetails } from '../types/studentAttendance';

interface AttendanceClassroomsScreenProps {
  navigation: any;
  route: {
    params?: {
      programId?: number;
      programName?: string;
    };
  };
}

const CARD_COLORS = ['#10b981', '#2563eb', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

const AttendanceClassroomsScreen = ({ navigation, route }: AttendanceClassroomsScreenProps) => {
  const programId = Number(route?.params?.programId || 0);
  const fallbackProgramName = route?.params?.programName || 'البرنامج';

  const [program, setProgram] = useState<AttendanceProgramDetails | null>(null);
  const [classrooms, setClassrooms] = useState<AttendanceClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }

    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      setLoading(true);

      const data = await AuthService.getProgramById(programId);
      const normalizedClassrooms = Array.isArray(data?.classrooms)
        ? data.classrooms.map((classroom: any) => ({
            id: Number(classroom.id),
            name: classroom.name || `Classroom ${classroom.id}`,
            classNumber: Number(classroom.classNumber || 0),
            startDate: classroom.startDate,
            endDate: classroom.endDate,
            isActive: classroom.isActive,
            _count: {
              trainingContents: Number(classroom?._count?.trainingContents || 0),
            },
          }))
        : [];

      setProgram({
        id: Number(data?.id || programId),
        nameAr: data?.nameAr || fallbackProgramName,
        classrooms: normalizedClassrooms,
      });
      setClassrooms(normalizedClassrooms);
    } catch (error: any) {
      setProgram(null);
      setClassrooms([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل فصول البرنامج',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProgram();
  };

  const totalContents = useMemo(
    () => classrooms.reduce((sum, item) => sum + Number(item?._count?.trainingContents || 0), 0),
    [classrooms],
  );

  const getRemainingDays = (endDate?: string | null) => {
    if (!endDate) {
      return null;
    }

    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diffDays) ? diffDays : null;
  };

  const openClassroom = (classroom: AttendanceClassroom) => {
    navigation.navigate('AttendanceContents', {
      programId,
      programName: program?.nameAr || fallbackProgramName,
      classroomId: Number(classroom.id),
      classroomName: classroom.name,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="AttendancePrograms" />
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={21} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {program?.nameAr || fallbackProgramName}
          </Text>
          <Text style={styles.headerSubtitle}>اختر الفصل الدراسي</Text>
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
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Icon name="meeting-room" size={18} color="#059669" />
            <Text style={styles.summaryValue}>{classrooms.length}</Text>
            <Text style={styles.summaryLabel}>الفصول</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="menu-book" size={18} color="#2563eb" />
            <Text style={styles.summaryValue}>{totalContents}</Text>
            <Text style={styles.summaryLabel}>المواد</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل الفصول...</Text>
          </View>
        ) : classrooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="meeting-room" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد فصول دراسية</Text>
            <Text style={styles.emptySubtitle}>لا يوجد فصل متاح لهذا البرنامج حالياً</Text>
          </View>
        ) : (
          <View style={styles.cardsWrap}>
            {classrooms.map((classroom, idx) => {
              const remainingDays = getRemainingDays(classroom.endDate);
              const isExpired = remainingDays !== null && remainingDays < 0;

              return (
                <TouchableOpacity
                  key={classroom.id}
                  activeOpacity={0.9}
                  style={[styles.classroomCard, isExpired && styles.expiredCard]}
                  onPress={() => openClassroom(classroom)}
                >
                  <View
                    style={[
                      styles.classroomAccent,
                      { backgroundColor: CARD_COLORS[idx % CARD_COLORS.length] },
                    ]}
                  />

                  <View style={styles.classroomHeader}>
                    <View style={styles.classNumberWrap}>
                      <Text style={styles.classNumberText}>{classroom.classNumber || '-'}</Text>
                    </View>
                    <Icon name="chevron-left" size={22} color="#94a3b8" />
                  </View>

                  <Text style={styles.classroomName}>{classroom.name}</Text>

                  {classroom.startDate && classroom.endDate ? (
                    <View style={styles.datesWrap}>
                      <Text style={styles.dateText}>من: {new Date(classroom.startDate).toLocaleDateString('ar-EG')}</Text>
                      <Text style={styles.dateText}>الى: {new Date(classroom.endDate).toLocaleDateString('ar-EG')}</Text>
                    </View>
                  ) : null}

                  <View style={styles.footerRow}>
                    <View style={styles.contentsBadge}>
                      <Icon name="library-books" size={13} color="#1d4ed8" />
                      <Text style={styles.contentsBadgeText}>
                        {Number(classroom?._count?.trainingContents || 0)} مادة
                      </Text>
                    </View>

                    {remainingDays !== null ? (
                      <View
                        style={[
                          styles.daysBadge,
                          isExpired
                            ? styles.daysBadgeExpired
                            : remainingDays <= 30
                              ? styles.daysBadgeWarning
                              : styles.daysBadgeOk,
                        ]}
                      >
                        <Icon name="schedule" size={12} color={isExpired ? '#b91c1c' : remainingDays <= 30 ? '#b45309' : '#166534'} />
                        <Text
                          style={[
                            styles.daysBadgeText,
                            isExpired
                              ? styles.daysBadgeTextExpired
                              : remainingDays <= 30
                                ? styles.daysBadgeTextWarning
                                : styles.daysBadgeTextOk,
                          ]}
                        >
                          {isExpired ? 'منتهي' : `${remainingDays} يوم`}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    maxWidth: 220,
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
  summaryRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  loadingWrap: {
    marginTop: 26,
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
    marginTop: 12,
    paddingBottom: 22,
  },
  classroomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  expiredCard: {
    opacity: 0.7,
  },
  classroomAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  classroomHeader: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classNumberWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  classNumberText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#166534',
  },
  classroomName: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  datesWrap: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentsBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contentsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  daysBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysBadgeOk: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  daysBadgeWarning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  daysBadgeExpired: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  daysBadgeTextOk: {
    color: '#166534',
  },
  daysBadgeTextWarning: {
    color: '#b45309',
  },
  daysBadgeTextExpired: {
    color: '#b91c1c',
  },
});

export default AttendanceClassroomsScreen;

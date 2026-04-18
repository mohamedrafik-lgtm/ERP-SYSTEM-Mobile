import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

type Program = {
  id: number;
  nameAr?: string;
  nameEn?: string;
};

type TopStudent = {
  trainee: {
    id: number;
    nameAr?: string;
    nationalId?: string;
    photoUrl?: string;
    program?: {
      nameAr?: string;
    };
  };
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  subjectsCount: number;
};

type ClassroomTopStudents = {
  classroom: {
    id: number;
    name: string;
  };
  topStudents: TopStudent[];
};

const LIMIT_OPTIONS = [
  { value: '5', label: '5 متدربين' },
  { value: '10', label: '10 متدربين' },
  { value: '20', label: '20 متدرب' },
];

const GradeReportsScreen = ({ navigation }: any) => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingTopStudents, setLoadingTopStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [limit, setLimit] = useState<string>('10');
  const [topStudentsData, setTopStudentsData] = useState<ClassroomTopStudents[]>([]);

  const programOptions = useMemo(
    () => programs.map((p) => ({ value: String(p.id), label: p.nameAr || p.nameEn || `برنامج #${p.id}` })),
    [programs]
  );

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: '#eab308', text: '#fff' };
    if (index === 1) return { bg: '#9ca3af', text: '#fff' };
    if (index === 2) return { bg: '#f97316', text: '#fff' };
    return { bg: '#2563eb', text: '#fff' };
  };

  const normalizePrograms = (data: any): Program[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.programs)) return data.programs;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const loadTopStudents = useCallback(async (programIdParam?: string, limitParam?: string) => {
    const targetProgram = programIdParam ?? selectedProgram;
    const targetLimit = Number(limitParam ?? limit) || 10;

    if (!targetProgram) {
      setTopStudentsData([]);
      return;
    }

    try {
      setLoadingTopStudents(true);
      const data = await AuthService.getTopStudentsByClassroom(Number(targetProgram), targetLimit);
      setTopStudentsData(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading top students:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الأوائل',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
      setTopStudentsData([]);
    } finally {
      setLoadingTopStudents(false);
    }
  }, [limit, selectedProgram]);

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const data = await AuthService.getAllPrograms();
      const list = normalizePrograms(data);
      setPrograms(list);

      if (list.length > 0) {
        const firstProgramId = String(list[0].id);
        setSelectedProgram(firstProgramId);
        await loadTopStudents(firstProgramId, limit);
      } else {
        setSelectedProgram('');
        setTopStudentsData([]);
      }
    } catch (error: any) {
      console.error('Error loading programs:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل البرامج',
        text2: error?.message || 'حدث خطأ غير متوقع',
        position: 'bottom',
      });
    } finally {
      setLoadingPrograms(false);
    }
  }, [limit, loadTopStudents]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedProgram) {
      await loadTopStudents(selectedProgram, limit);
    } else {
      await loadPrograms();
    }
    setRefreshing(false);
  }, [limit, loadPrograms, loadTopStudents, selectedProgram]);

  const handleSelectProgram = async (value: string) => {
    setSelectedProgram(value);
    await loadTopStudents(value, limit);
  };

  const handleSelectLimit = async (value: string) => {
    setLimit(value);
    await loadTopStudents(selectedProgram, value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="GradeReports" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>رصد الأوائل</Text>
          <Text style={styles.subtitle}>عرض الطلاب المتفوقين في كل فصل دراسي</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a237e']} />}
      >
        <View style={styles.filterCard}>
          <SelectBox
            label="البرنامج التدريبي"
            selectedValue={selectedProgram || undefined}
            onValueChange={handleSelectProgram}
            items={programOptions}
            placeholder="اختر البرنامج"
            loading={loadingPrograms}
          />

          <SelectBox
            label="عدد الأوائل"
            selectedValue={limit}
            onValueChange={handleSelectLimit}
            items={LIMIT_OPTIONS}
            placeholder="اختر العدد"
            disabled={!selectedProgram}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (!selectedProgram || loadingTopStudents) && styles.primaryBtnDisabled]}
            disabled={!selectedProgram || loadingTopStudents}
            onPress={() => loadTopStudents()}
          >
            {loadingTopStudents ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="emoji-events" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>عرض الأوائل</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loadingTopStudents ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.centerText}>جاري تحميل الأوائل...</Text>
          </View>
        ) : topStudentsData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="emoji-events" size={44} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد بيانات للعرض</Text>
            <Text style={styles.emptyText}>اختر برنامجا تدريبيا لعرض الأوائل</Text>
          </View>
        ) : (
          <View style={styles.classroomsWrap}>
            {topStudentsData.map((classroomData) => (
              <View key={classroomData.classroom.id} style={styles.classroomCard}>
                <View style={styles.classroomHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="school" size={18} color="#64748b" />
                    <Text style={styles.classroomTitle}>{classroomData.classroom.name}</Text>
                  </View>
                  <Text style={styles.classroomCount}>{classroomData.topStudents.length} متدرب</Text>
                </View>

                {classroomData.topStudents.length === 0 ? (
                  <View style={styles.noStudentsBox}>
                    <Text style={styles.noStudentsText}>لا توجد درجات مسجلة في هذا الفصل</Text>
                  </View>
                ) : (
                  classroomData.topStudents.map((student, index) => {
                    const rank = getRankStyle(index);
                    return (
                      <View key={student.trainee.id} style={styles.studentRow}>
                        <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                          <Text style={[styles.rankText, { color: rank.text }]}>{index + 1}</Text>
                        </View>

                        <View style={styles.avatarWrap}>
                          {student.trainee.photoUrl ? (
                            <Image source={{ uri: student.trainee.photoUrl }} style={styles.avatar} />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Icon name="person" size={14} color="#94a3b8" />
                            </View>
                          )}
                        </View>

                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.trainee.nameAr || 'غير معروف'}</Text>
                          <Text style={styles.studentMeta}>{student.trainee.nationalId || '-'}</Text>
                          <Text style={styles.studentMeta}>{student.trainee.program?.nameAr || '-'}</Text>
                        </View>

                        <View style={styles.scoreBox}>
                          <Text style={styles.scorePercent}>{(student.percentage || 0).toFixed(1)}%</Text>
                          <Text style={styles.scoreMeta}>
                            {(student.totalMarks || 0).toFixed(1)} / {(student.maxMarks || 0).toFixed(1)}
                          </Text>
                          <Text style={styles.scoreMeta}>{student.subjectsCount || 0} مادة</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default GradeReportsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 21, fontWeight: '800', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  primaryBtn: {
    marginTop: 4,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 4 },
  centerBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
  },
  centerText: { marginTop: 10, color: '#6b7280' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  classroomsWrap: { gap: 10 },
  classroomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  classroomTitle: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#0f172a' },
  classroomCount: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  noStudentsBox: { padding: 14 },
  noStudentsText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: { fontWeight: '800', fontSize: 12 },
  avatarWrap: { marginRight: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15 },
  avatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: { flex: 1 },
  studentName: { color: '#111827', fontSize: 13, fontWeight: '700' },
  studentMeta: { color: '#64748b', fontSize: 11, marginTop: 1 },
  scoreBox: { alignItems: 'flex-end' },
  scorePercent: { color: '#2563eb', fontSize: 14, fontWeight: '800' },
  scoreMeta: { color: '#64748b', fontSize: 10, marginTop: 1 },
});

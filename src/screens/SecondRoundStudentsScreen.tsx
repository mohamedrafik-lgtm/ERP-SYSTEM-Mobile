import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import { ClassroomSecondRound } from '../types/grades';

type ProgramOption = {
  id: number;
  nameAr: string;
};

type ClassroomOption = {
  id: number;
  name: string;
};

interface SecondRoundStudentsScreenProps {
  navigation: any;
}

const SecondRoundStudentsScreen: React.FC<SecondRoundStudentsScreenProps> = ({ navigation }) => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');

  const [rawData, setRawData] = useState<ClassroomSecondRound[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const loadPrograms = useCallback(async () => {
    try {
      setLoadingPrograms(true);
      const res = await AuthService.getAllPrograms();
      const arr = Array.isArray(res) ? res : [];
      setPrograms(
        arr.map((p: any) => ({
          id: Number(p.id),
          nameAr: p.nameAr || p.name || `برنامج ${p.id}`,
        }))
      );
    } catch (error) {
      console.error('Error loading programs:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل البرامج التدريبية',
        position: 'bottom',
      });
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  const loadClassrooms = useCallback(async (programId: number) => {
    try {
      setLoadingClassrooms(true);
      const program = await AuthService.getProgramById(programId);
      const classroomsArr = Array.isArray(program?.classrooms) ? program.classrooms : [];
      setClassrooms(
        classroomsArr.map((c: any) => ({
          id: Number(c.id),
          name: c.name || `فصل ${c.id}`,
        }))
      );
    } catch (error) {
      console.error('Error loading classrooms:', error);
      setClassrooms([]);
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgramId) {
      setClassrooms([]);
      setSelectedClassroomId('all');
      return;
    }

    const numericProgramId = Number(selectedProgramId);
    if (Number.isNaN(numericProgramId)) {
      return;
    }

    loadClassrooms(numericProgramId);
    setRawData([]);
    setHasSearched(false);
    setSearchQuery('');
    setExpandedRows({});
    setSelectedClassroomId('all');
  }, [selectedProgramId, loadClassrooms]);

  const handleFetchSecondRound = useCallback(async () => {
    if (!selectedProgramId) {
      Toast.show({
        type: 'error',
        text1: 'يرجى اختيار البرنامج التدريبي أولاً',
        position: 'bottom',
      });
      return;
    }

    try {
      setLoadingData(true);
      setHasSearched(true);
      const list = await AuthService.getSecondRoundStudents(Number(selectedProgramId));

      let normalized = Array.isArray(list) ? (list as ClassroomSecondRound[]) : [];
      if (selectedClassroomId !== 'all') {
        const classroomId = Number(selectedClassroomId);
        normalized = normalized.filter((c) => c?.classroom?.id === classroomId);
      }

      setRawData(normalized);
      setExpandedRows({});
    } catch (error: any) {
      console.error('Error loading second-round data:', error);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل طلاب الدور الثاني',
        text2: error?.message || 'حدث خطأ أثناء التحميل',
        position: 'bottom',
      });
      setRawData([]);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [selectedProgramId, selectedClassroomId]);

  const onRefresh = useCallback(async () => {
    if (!hasSearched) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    await handleFetchSecondRound();
  }, [hasSearched, handleFetchSecondRound]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawData;

    return rawData
      .map((classroomData) => {
        const students = (classroomData.students || []).filter((s) => {
          const name = (s.trainee?.nameAr || '').toLowerCase();
          const nationalId = s.trainee?.nationalId || '';
          const hasSubject = (s.failedSubjects || []).some((f) =>
            (f.content?.name || '').toLowerCase().includes(q)
          );
          return name.includes(q) || nationalId.includes(q) || hasSubject;
        });

        return {
          ...classroomData,
          students,
          totalStudents: students.length,
        };
      })
      .filter((classroomData) => classroomData.totalStudents > 0);
  }, [rawData, searchQuery]);

  const stats = useMemo(() => {
    const totalStudents = filteredData.reduce((sum, c) => sum + (c.totalStudents || 0), 0);
    const totalFailedSubjects = filteredData.reduce(
      (sum, c) => sum + (c.students || []).reduce((s, st) => s + (st.failedSubjects || []).length, 0),
      0
    );

    return {
      totalStudents,
      totalFailedSubjects,
      totalClassrooms: filteredData.length,
    };
  }, [filteredData]);

  const toggleExpanded = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="SecondRoundStudents" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>طلاب الدور الثاني</Text>
          <Text style={styles.subtitle}>عرض المتدربين الأقل من 50% في المواد</Text>
        </View>
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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تصفية النتائج</Text>

          <SelectBox<string>
            label="البرنامج التدريبي"
            selectedValue={selectedProgramId}
            onValueChange={setSelectedProgramId}
            items={programs.map((p) => ({ value: String(p.id), label: p.nameAr }))}
            placeholder={loadingPrograms ? 'جاري تحميل البرامج...' : 'اختر البرنامج'}
            loading={loadingPrograms}
          />

          <SelectBox<string>
            label="الفصل الدراسي"
            selectedValue={selectedClassroomId}
            onValueChange={setSelectedClassroomId}
            items={[
              { value: 'all', label: 'جميع الفصول' },
              ...classrooms.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            placeholder={loadingClassrooms ? 'جاري تحميل الفصول...' : 'اختر الفصل الدراسي'}
            disabled={!selectedProgramId}
            loading={loadingClassrooms}
          />

          <TouchableOpacity
            style={[styles.fetchBtn, (!selectedProgramId || loadingData) && styles.fetchBtnDisabled]}
            onPress={handleFetchSecondRound}
            disabled={!selectedProgramId || loadingData}
          >
            {loadingData ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="search" size={18} color="#fff" />
                <Text style={styles.fetchBtnText}>عرض طلاب الدور الثاني</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {hasSearched && rawData.length > 0 ? (
          <View style={styles.searchCard}>
            <Icon name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="بحث بالاسم أو الرقم القومي أو اسم المادة..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {hasSearched && filteredData.length > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>إجمالي الطلاب</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#dc2626' }]}>{stats.totalFailedSubjects}</Text>
              <Text style={styles.statLabel}>إجمالي المواد الراسبة</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#2563eb' }]}>{stats.totalClassrooms}</Text>
              <Text style={styles.statLabel}>عدد الفصول</Text>
            </View>
          </View>
        ) : null}

        {loadingData ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.emptyBox}>
            <Icon name="info-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>اختر البرنامج والفصل ثم اضغط عرض</Text>
            <Text style={styles.emptyText}>سيتم عرض طلاب الدور الثاني حسب الفلاتر المحددة</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check-circle-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد طلاب دور ثاني'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'جرّب تغيير كلمة البحث' : 'لا يوجد متدربين بنسبة أقل من 50%'}
            </Text>
          </View>
        ) : (
          filteredData.map((classroomData) => (
            <View key={classroomData.classroom.id} style={styles.classroomCard}>
              <View style={styles.classroomHeader}>
                <View style={styles.classroomLeft}>
                  <Icon name="meeting-room" size={20} color="#475569" />
                  <Text style={styles.classroomTitle}>{classroomData.classroom.name}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{classroomData.totalStudents} طالب</Text>
                </View>
              </View>

              {(classroomData.students || []).map((student, index) => {
                const rowKey = `${classroomData.classroom.id}-${student.trainee.id}`;
                const expanded = !!expandedRows[rowKey];

                return (
                  <View key={rowKey} style={styles.studentRowWrap}>
                    <TouchableOpacity style={styles.studentRow} onPress={() => toggleExpanded(rowKey)}>
                      <View style={styles.studentMain}>
                        <View style={styles.rankCircle}>
                          <Text style={styles.rankText}>{index + 1}</Text>
                        </View>

                        {student.trainee.photoUrl ? (
                          <Image source={{ uri: student.trainee.photoUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, styles.avatarFallback]}>
                            <Icon name="person" size={18} color="#64748b" />
                          </View>
                        )}

                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{student.trainee.nameAr}</Text>
                          <Text style={styles.studentMeta}>الرقم القومي: {student.trainee.nationalId}</Text>
                        </View>
                      </View>

                      <View style={styles.studentRight}>
                        <View style={styles.failedBadge}>
                          <Text style={styles.failedBadgeText}>{student.failedSubjects.length} مواد</Text>
                        </View>
                        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color="#64748b" />
                      </View>
                    </TouchableOpacity>

                    {expanded ? (
                      <View style={styles.subjectsWrap}>
                        {(student.failedSubjects || []).map((subject, subjectIndex) => (
                          <View key={`${rowKey}-${subjectIndex}`} style={styles.subjectRow}>
                            <View style={styles.subjectLeft}>
                              <Icon name="cancel" size={16} color="#dc2626" />
                              <Text style={styles.subjectName}>{subject.content.name}</Text>
                              {subject.content.code ? (
                                <Text style={styles.subjectCode}>({subject.content.code})</Text>
                              ) : null}
                            </View>
                            <View style={styles.subjectRight}>
                              <Text style={styles.subjectMarks}>
                                {subject.totalMarks} / {subject.maxMarks}
                              </Text>
                              <Text style={styles.subjectPercent}>{Number(subject.percentage || 0).toFixed(1)}%</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#64748b' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  fetchBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fetchBtnDisabled: {
    opacity: 0.6,
  },
  fetchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statLabel: { marginTop: 4, fontSize: 12, color: '#64748b', textAlign: 'center' },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 14 },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  classroomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
  },
  classroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  classroomLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  classroomTitle: { fontSize: 15, color: '#334155', fontWeight: '700' },
  countBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countBadgeText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
  studentRowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: { color: '#b91c1c', fontSize: 12, fontWeight: '700' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    backgroundColor: '#e2e8f0',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: { flex: 1, paddingRight: 8 },
  studentName: { fontSize: 14, color: '#0f172a', fontWeight: '700' },
  studentMeta: { marginTop: 2, fontSize: 12, color: '#64748b' },
  studentRight: { alignItems: 'flex-end', gap: 4 },
  failedBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  failedBadgeText: { color: '#b91c1c', fontSize: 11, fontWeight: '700' },
  subjectsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  subjectRow: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    backgroundColor: '#fff5f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 5 },
  subjectName: { fontSize: 13, color: '#374151', fontWeight: '600', flexShrink: 1 },
  subjectCode: { fontSize: 11, color: '#6b7280' },
  subjectRight: { alignItems: 'flex-end', marginLeft: 8 },
  subjectMarks: { fontSize: 11, color: '#6b7280' },
  subjectPercent: { marginTop: 2, fontSize: 13, color: '#dc2626', fontWeight: '800' },
});

export default SecondRoundStudentsScreen;

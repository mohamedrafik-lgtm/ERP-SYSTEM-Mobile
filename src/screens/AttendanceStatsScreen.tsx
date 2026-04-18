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
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';

interface AttendanceStatsScreenProps {
  navigation: any;
}

interface TraineeAttendanceStat {
  traineeId: number;
  nameAr: string;
  nationalId: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

const AttendanceStatsScreen = ({ navigation }: AttendanceStatsScreenProps) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [stats, setStats] = useState<TraineeAttendanceStat[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [statsProgress, setStatsProgress] = useState({ done: 0, total: 0 });

  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | undefined>(undefined);
  const [selectedContentId, setSelectedContentId] = useState<number | undefined>(undefined);

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const data = await AuthService.getAllPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setPrograms([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل البرامج',
        text2: error?.message || 'تعذر تحميل البرامج التدريبية',
        position: 'top',
      });
    } finally {
      setLoadingPrograms(false);
    }
  };

  const loadClassrooms = async (programId: number) => {
    try {
      setLoadingClassrooms(true);
      const program = await AuthService.getProgramById(programId);
      setClassrooms(Array.isArray(program?.classrooms) ? program.classrooms : []);
    } catch (error: any) {
      setClassrooms([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الفصول',
        text2: error?.message || 'تعذر تحميل فصول البرنامج',
        position: 'top',
      });
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const loadContents = async (classroomId: number) => {
    try {
      setLoadingContents(true);
      const data = await AuthService.getTrainingContentsByClassroom(classroomId);
      setContents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setContents([]);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل المواد',
        text2: error?.message || 'تعذر تحميل المواد التدريبية',
        position: 'top',
      });
    } finally {
      setLoadingContents(false);
    }
  };

  const onProgramChange = (programId: number) => {
    setSelectedProgramId(programId);
    setSelectedClassroomId(undefined);
    setSelectedContentId(undefined);
    setStats([]);
    setStatsLoaded(false);
    setClassrooms([]);
    setContents([]);
    loadClassrooms(programId);
  };

  const onClassroomChange = (classroomId: number) => {
    setSelectedClassroomId(classroomId);
    setSelectedContentId(undefined);
    setStats([]);
    setStatsLoaded(false);
    setContents([]);
    loadContents(classroomId);
  };

  const onContentChange = (contentId: number) => {
    setSelectedContentId(contentId);
    setStats([]);
    setStatsLoaded(false);
  };

  const normalizeStatus = (status: any): 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' => {
    const normalized = String(status || 'ABSENT').toUpperCase();
    if (normalized === 'PRESENT' || normalized === 'LATE' || normalized === 'EXCUSED') {
      return normalized;
    }
    return 'ABSENT';
  };

  const loadStats = async (isRefresh = false) => {
    if (!selectedClassroomId || !selectedContentId) {
      Toast.show({
        type: 'error',
        text1: 'اختر المادة أولاً',
        text2: 'يلزم اختيار البرنامج والفصل والمادة',
        position: 'top',
      });
      return;
    }

    if (isRefresh) {
      setRefreshingStats(true);
    } else {
      setLoadingStats(true);
    }

    try {
      const sessions = await AuthService.getAttendanceSessionsForContent(selectedClassroomId, selectedContentId);
      const activeSessions = (Array.isArray(sessions) ? sessions : []).filter(session => !session?.isCancelled);

      if (!activeSessions.length) {
        setStats([]);
        setStatsLoaded(true);
        setStatsProgress({ done: 0, total: 0 });
        return;
      }

      const traineesMap = new Map<number, TraineeAttendanceStat>();
      setStatsProgress({ done: 0, total: activeSessions.length });

      for (let index = 0; index < activeSessions.length; index += 1) {
        const session = activeSessions[index];
        const sessionData = await AuthService.getExpectedAttendanceTrainees(Number(session.id));

        const expectedTrainees = Array.isArray(sessionData?.trainees) ? sessionData.trainees : [];
        const attendanceRecords = Array.isArray(sessionData?.session?.attendance)
          ? sessionData.session.attendance
          : [];

        const attendanceByTrainee = new Map<number, string>();
        attendanceRecords.forEach((record: any) => {
          attendanceByTrainee.set(Number(record?.traineeId), String(record?.status || 'ABSENT'));
        });

        expectedTrainees.forEach((trainee: any) => {
          const traineeId = Number(trainee?.id);
          if (!Number.isFinite(traineeId)) {
            return;
          }

          if (!traineesMap.has(traineeId)) {
            traineesMap.set(traineeId, {
              traineeId,
              nameAr: String(trainee?.nameAr || `متدرب ${traineeId}`),
              nationalId: String(trainee?.nationalId || '-'),
              totalSessions: 0,
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              attendanceRate: 0,
            });
          }

          const entry = traineesMap.get(traineeId)!;
          entry.totalSessions += 1;

          const status = normalizeStatus(attendanceByTrainee.get(traineeId));
          if (status === 'PRESENT') {
            entry.present += 1;
          } else if (status === 'LATE') {
            entry.late += 1;
          } else if (status === 'EXCUSED') {
            entry.excused += 1;
          } else {
            entry.absent += 1;
          }
        });

        setStatsProgress({ done: index + 1, total: activeSessions.length });
      }

      const computedStats = Array.from(traineesMap.values())
        .map(item => {
          const attended = item.present + item.late;
          const attendanceRate = item.totalSessions > 0
            ? Math.round((attended / item.totalSessions) * 100)
            : 0;

          return {
            ...item,
            attendanceRate,
          };
        })
        .sort((a, b) => {
          if (a.attendanceRate !== b.attendanceRate) {
            return b.attendanceRate - a.attendanceRate;
          }
          return a.nameAr.localeCompare(b.nameAr, 'ar');
        });

      setStats(computedStats);
      setStatsLoaded(true);
    } catch (error: any) {
      setStats([]);
      setStatsLoaded(false);
      Toast.show({
        type: 'error',
        text1: 'فشل تحميل الإحصائيات',
        text2: error?.message || 'تعذر تحليل بيانات حضور المادة',
        position: 'top',
      });
    } finally {
      setLoadingStats(false);
      setRefreshingStats(false);
    }
  };

  const selectedProgramName = useMemo(() => {
    const selected = programs.find(item => Number(item.id) === Number(selectedProgramId));
    return selected?.nameAr || '-';
  }, [programs, selectedProgramId]);

  const selectedClassroomName = useMemo(() => {
    const selected = classrooms.find(item => Number(item.id) === Number(selectedClassroomId));
    return selected?.name || '-';
  }, [classrooms, selectedClassroomId]);

  const selectedContentName = useMemo(() => {
    const selected = contents.find(item => Number(item.id) === Number(selectedContentId));
    return selected?.name || '-';
  }, [contents, selectedContentId]);

  const overview = useMemo(() => {
    if (!stats.length) {
      return {
        avg: 0,
        highest: 0,
        lowest: 0,
        totalSessions: 0,
      };
    }

    const rates = stats.map(item => item.attendanceRate);
    const totalSessions = stats.reduce((acc, item) => acc + item.totalSessions, 0);

    return {
      avg: Math.round(rates.reduce((acc, value) => acc + value, 0) / rates.length),
      highest: Math.max(...rates),
      lowest: Math.min(...rates),
      totalSessions,
    };
  }, [stats]);

  const onRefreshStats = () => {
    if (!selectedContentId || loadingStats) {
      return;
    }
    loadStats(true);
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
          <Text style={styles.headerTitle}>تقارير الحضور</Text>
          <Text style={styles.headerSubtitle}>اختر البرنامج والفصل والمادة</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={loadPrograms}>
          <Icon name="refresh" size={21} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <Icon name="filter-alt" size={18} color="#7c3aed" />
            <Text style={styles.filtersTitle}>فلاتر التقرير</Text>
          </View>

          <SelectBox<number>
            label="البرنامج التدريبي"
            selectedValue={selectedProgramId}
            onValueChange={onProgramChange}
            items={programs.map(program => ({ value: Number(program.id), label: String(program.nameAr) }))}
            placeholder="اختر البرنامج"
            loading={loadingPrograms}
          />

          <SelectBox<number>
            label="الفصل الدراسي"
            selectedValue={selectedClassroomId}
            onValueChange={onClassroomChange}
            items={classrooms.map(classroom => ({ value: Number(classroom.id), label: String(classroom.name) }))}
            placeholder="اختر الفصل"
            loading={loadingClassrooms}
            disabled={!selectedProgramId}
          />

          <SelectBox<number>
            label="المادة"
            selectedValue={selectedContentId}
            onValueChange={onContentChange}
            items={contents.map(content => ({ value: Number(content.id), label: String(content.name) }))}
            placeholder="اختر المادة"
            loading={loadingContents}
            disabled={!selectedClassroomId}
          />

          <TouchableOpacity
            style={[styles.showStatsButton, !selectedContentId && styles.showStatsButtonDisabled]}
            onPress={() => loadStats(false)}
            disabled={!selectedContentId || loadingStats}
          >
            {loadingStats ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Icon name="analytics" size={16} color="#ffffff" />
            )}
            <Text style={styles.showStatsButtonText}>
              {loadingStats ? 'جاري تحليل البيانات...' : 'عرض الإحصائيات'}
            </Text>
          </TouchableOpacity>

          {loadingStats && statsProgress.total > 0 ? (
            <Text style={styles.progressText}>
              تمت معالجة {statsProgress.done} من {statsProgress.total} محاضرة
            </Text>
          ) : null}
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Icon name="insights" size={18} color="#1d4ed8" />
            <Text style={styles.previewTitle}>معاينة الاختيار الحالي</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>البرنامج:</Text>
            <Text style={styles.previewValue}>{selectedProgramName}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>الفصل:</Text>
            <Text style={styles.previewValue}>{selectedClassroomName}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>المادة:</Text>
            <Text style={styles.previewValue}>{selectedContentName}</Text>
          </View>
        </View>

        {(loadingPrograms || loadingClassrooms || loadingContents) ? (
          <View style={styles.loadingRowWrap}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1d4ed8" />
              <Text style={styles.loadingText}>جاري تحميل بيانات القوائم...</Text>
            </View>
          </View>
        ) : null}

        {statsLoaded && stats.length > 0 ? (
          <ScrollView
            style={styles.statsArea}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshingStats} onRefresh={onRefreshStats} />}
          >
            <View style={styles.overviewGrid}>
              <View style={[styles.overviewCard, { backgroundColor: '#ecfdf5' }]}>
                <Text style={[styles.overviewValue, { color: '#059669' }]}>{stats.length}</Text>
                <Text style={styles.overviewLabel}>عدد المتدربين</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#eff6ff' }]}>
                <Text style={[styles.overviewValue, { color: '#1d4ed8' }]}>{overview.avg}%</Text>
                <Text style={styles.overviewLabel}>متوسط الحضور</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.overviewValue, { color: '#b45309' }]}>{overview.highest}%</Text>
                <Text style={styles.overviewLabel}>أعلى نسبة</Text>
              </View>
              <View style={[styles.overviewCard, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.overviewValue, { color: '#b91c1c' }]}>{overview.lowest}%</Text>
                <Text style={styles.overviewLabel}>أقل نسبة</Text>
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultHeader}>نتائج المادة ({stats.length})</Text>
              {stats.map((item, index) => (
                <View key={item.traineeId} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <View style={styles.indexCircle}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{item.nameAr}</Text>
                      <Text style={styles.rowNationalId}>{item.nationalId}</Text>
                    </View>
                    <View style={[
                      styles.rateBadge,
                      item.attendanceRate >= 80
                        ? styles.rateBadgeGood
                        : item.attendanceRate >= 60
                          ? styles.rateBadgeWarn
                          : styles.rateBadgeBad,
                    ]}>
                      <Text style={styles.rateBadgeText}>{item.attendanceRate}%</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>إجمالي</Text>
                      <Text style={styles.statMiniValue}>{item.totalSessions}</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>حاضر</Text>
                      <Text style={[styles.statMiniValue, { color: '#059669' }]}>{item.present}</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>غائب</Text>
                      <Text style={[styles.statMiniValue, { color: '#dc2626' }]}>{item.absent}</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>متأخر</Text>
                      <Text style={[styles.statMiniValue, { color: '#d97706' }]}>{item.late}</Text>
                    </View>
                    <View style={styles.statMini}>
                      <Text style={styles.statMiniLabel}>بعذر</Text>
                      <Text style={[styles.statMiniValue, { color: '#1d4ed8' }]}>{item.excused}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Icon name="bar-chart" size={28} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>تقارير المادة</Text>
            <Text style={styles.emptyText}>
              {statsLoaded
                ? 'لا توجد بيانات حضور متاحة للمادة المختارة حالياً.'
                : 'اختر البرنامج والفصل والمادة ثم اضغط عرض الإحصائيات.'}
            </Text>
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
  filtersCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  showStatsButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  showStatsButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  showStatsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  progressText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  previewCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    padding: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e3a8a',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
    paddingBottom: 5,
  },
  previewLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  previewValue: {
    maxWidth: '70%',
    textAlign: 'right',
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 18,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingRowWrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    padding: 10,
    alignItems: 'center',
  },
  statsArea: {
    marginTop: 10,
    marginBottom: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  overviewCard: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  overviewLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  resultCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  resultHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 10,
    marginTop: 8,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  rowNationalId: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  rateBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rateBadgeGood: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  rateBadgeWarn: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  rateBadgeBad: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0f172a',
  },
  statsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statMini: {
    minWidth: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    paddingVertical: 5,
    paddingHorizontal: 7,
    alignItems: 'center',
  },
  statMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  statMiniValue: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  loadingText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
});

export default AttendanceStatsScreen;

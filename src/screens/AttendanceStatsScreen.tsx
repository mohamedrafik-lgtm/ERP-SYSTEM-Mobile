import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

const AttendanceStatsScreen = ({ navigation }: AttendanceStatsScreenProps) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);

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
    setClassrooms([]);
    setContents([]);
    loadClassrooms(programId);
  };

  const onClassroomChange = (classroomId: number) => {
    setSelectedClassroomId(classroomId);
    setSelectedContentId(undefined);
    setContents([]);
    loadContents(classroomId);
  };

  const onContentChange = (contentId: number) => {
    setSelectedContentId(contentId);
  };

  const showStatsMessage = () => {
    if (!selectedContentId) {
      Toast.show({
        type: 'error',
        text1: 'اختر المادة أولاً',
        text2: 'يلزم اختيار البرنامج والفصل والمادة',
        position: 'top',
      });
      return;
    }

    Toast.show({
      type: 'info',
      text1: 'قيد التنفيذ',
      text2: 'Endpoint الإحصائيات الشامل للمادة لم يتم إكماله في الـ backend بعد',
      position: 'top',
    });
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
            onPress={showStatsMessage}
            disabled={!selectedContentId}
          >
            <Icon name="analytics" size={16} color="#ffffff" />
            <Text style={styles.showStatsButtonText}>عرض الإحصائيات</Text>
          </TouchableOpacity>
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

        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Icon name="bar-chart" size={28} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>تقارير المادة</Text>
          <Text style={styles.emptyText}>
            الواجهة جاهزة، لكن API الخاص بتجميع احصائيات الحضور للمادة لم يتم تفعيله بعد في النسخة الحالية من الـ backend.
          </Text>

          {(loadingPrograms || loadingClassrooms || loadingContents) ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#1d4ed8" />
              <Text style={styles.loadingText}>جاري تحميل بيانات القوائم...</Text>
            </View>
          ) : null}
        </View>
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
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
});

export default AttendanceStatsScreen;

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import DateTimePickerField from '../components/DateTimePickerField';
import { usePermissions } from '../hooks/usePermissions';
import AuthService from '../services/AuthService';

interface ClassroomItem {
  id: number;
  name: string;
  classNumber: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface ProgramItem {
  id: number;
  nameAr: string;
  nameEn?: string;
  classrooms: ClassroomItem[];
}

interface EditingState {
  classroomId: number;
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
}

const CARD_COLORS = ['#2563eb', '#0ea5e9', '#059669', '#7c3aed', '#ea580c', '#db2777'];

const toDateInput = (value?: string | null): string => {
  if (!value) return '';
  const text = String(value);
  if (text.includes('T')) {
    return text.split('T')[0];
  }
  return text;
};

const isEndDateValid = (startDate?: string, endDate?: string): boolean => {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
  return end > start;
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'غير محدد';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'غير محدد';
  return parsed.toLocaleDateString('ar-EG');
};

const normalizePrograms = (response: any[]): ProgramItem[] => {
  return (Array.isArray(response) ? response : []).map((program: any) => {
    const classrooms = Array.isArray(program?.classrooms)
      ? program.classrooms.map((classroom: any, index: number) => ({
          id: Number(classroom?.id),
          name: String(classroom?.name || `الفصل ${index + 1}`),
          classNumber: Number(classroom?.classNumber || index + 1),
          startDate: classroom?.startDate || null,
          endDate: classroom?.endDate || null,
        }))
      : [];

    return {
      id: Number(program?.id),
      nameAr: String(program?.nameAr || program?.name || `برنامج ${program?.id}`),
      nameEn: program?.nameEn ? String(program.nameEn) : undefined,
      classrooms: classrooms.filter(item => Number.isFinite(item.id)),
    };
  }).filter(item => Number.isFinite(item.id));
};

const ClassroomsScreen = ({ navigation }: any) => {
  const { hasPermission } = usePermissions();

  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [addingProgramId, setAddingProgramId] = useState<number | null>(null);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const canEdit = hasPermission('dashboard.classrooms', 'edit');

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getAllPrograms();
      const normalized = normalizePrograms(response || []);
      setPrograms(normalized);
    } catch (error: any) {
      setPrograms([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل بيانات الفصول الدراسية',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrograms();
  };

  const totalClassrooms = useMemo(
    () => programs.reduce((sum, program) => sum + program.classrooms.length, 0),
    [programs],
  );

  const handleToggleAdd = (programId: number) => {
    if (!canEdit) return;
    if (addingProgramId === programId) {
      setAddingProgramId(null);
      setNewClassroomName('');
      return;
    }

    setAddingProgramId(programId);
    setNewClassroomName('');
  };

  const handleCreateClassroom = async (programId: number) => {
    const classroomName = newClassroomName.trim();
    if (!classroomName) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الفصل');
      return;
    }

    try {
      setAddingLoading(true);
      await AuthService.createProgramClassroom(programId, { name: classroomName });
      setAddingProgramId(null);
      setNewClassroomName('');
      await loadPrograms();
      Toast.show({
        type: 'success',
        text1: 'تم بنجاح',
        text2: 'تمت إضافة الفصل الدراسي بنجاح',
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل إضافة الفصل الدراسي',
        position: 'top',
      });
    } finally {
      setAddingLoading(false);
    }
  };

  const handleOpenEdit = (programId: number, classroom: ClassroomItem) => {
    if (!canEdit) return;

    setEditingState({
      classroomId: classroom.id,
      programId,
      name: classroom.name,
      startDate: toDateInput(classroom.startDate),
      endDate: toDateInput(classroom.endDate),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingState) return;

    const classroomName = editingState.name.trim();
    if (!classroomName) {
      Alert.alert('تنبيه', 'اسم الفصل مطلوب');
      return;
    }

    if (!isEndDateValid(editingState.startDate, editingState.endDate)) {
      Alert.alert('تنبيه', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }

    try {
      setSavingEdit(true);
      await AuthService.updateProgramClassroom(editingState.classroomId, {
        name: classroomName,
        startDate: editingState.startDate || '',
        endDate: editingState.endDate || '',
      });

      setEditingState(null);
      await loadPrograms();
      Toast.show({
        type: 'success',
        text1: 'تم بنجاح',
        text2: 'تم تحديث بيانات الفصل',
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحديث بيانات الفصل',
        position: 'top',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClassroom = (classroom: ClassroomItem) => {
    if (!canEdit) return;

    Alert.alert(
      'حذف الفصل الدراسي',
      `هل أنت متأكد من حذف "${classroom.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.deleteProgramClassroom(classroom.id);
              await loadPrograms();
              Toast.show({
                type: 'success',
                text1: 'تم بنجاح',
                text2: 'تم حذف الفصل الدراسي',
                position: 'top',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: error?.message || 'فشل حذف الفصل الدراسي',
                position: 'top',
              });
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftGroup}>
          <CustomMenu navigation={navigation} activeRouteName="Classrooms" />
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={21} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>الفصول الدراسية</Text>
          <Text style={styles.headerSubtitle}>إدارة الفصول لكل البرامج التدريبية</Text>
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
            <Icon name="meeting-room" size={28} color="#ffffff" />
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>لوحة إدارة الفصول</Text>
            <Text style={styles.heroSubtitle}>نفس منطق الويب: إضافة وتعديل وحذف الفصول داخل كل برنامج</Text>
          </View>

          <View style={styles.permissionBadge}>
            <Icon name={canEdit ? 'edit' : 'visibility'} size={16} color="#1d4ed8" />
            <Text style={styles.permissionBadgeText}>{canEdit ? 'وضع التعديل' : 'عرض فقط'}</Text>
          </View>
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
            <Text style={styles.loadingText}>جاري تحميل بيانات الفصول...</Text>
          </View>
        ) : programs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="school" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد برامج تدريبية</Text>
            <Text style={styles.emptySubtitle}>قم بإضافة برنامج تدريبي أولاً</Text>
          </View>
        ) : (
          <View style={styles.programsWrap}>
            {programs.map((program, index) => (
              <View key={program.id} style={styles.programCard}>
                <View
                  style={[
                    styles.programAccent,
                    { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] },
                  ]}
                />

                <View style={styles.programHeader}>
                  <View style={styles.programHeaderInfo}>
                    <Text style={styles.programName}>{program.nameAr}</Text>
                    {program.nameEn ? <Text style={styles.programNameEn}>{program.nameEn}</Text> : null}
                  </View>

                  <View style={styles.programHeaderActions}>
                    <View style={styles.countBadge}>
                      <Icon name="meeting-room" size={14} color="#1d4ed8" />
                      <Text style={styles.countBadgeText}>{program.classrooms.length} فصل</Text>
                    </View>

                    {canEdit ? (
                      <TouchableOpacity
                        style={styles.addClassroomButton}
                        onPress={() => handleToggleAdd(program.id)}
                      >
                        <Icon name={addingProgramId === program.id ? 'close' : 'add'} size={16} color="#ffffff" />
                        <Text style={styles.addClassroomButtonText}>
                          {addingProgramId === program.id ? 'إلغاء' : 'إضافة فصل'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {canEdit && addingProgramId === program.id ? (
                  <View style={styles.addFormWrap}>
                    <TextInput
                      style={styles.addFormInput}
                      placeholder="اسم الفصل الجديد"
                      placeholderTextColor="#94a3b8"
                      value={newClassroomName}
                      onChangeText={setNewClassroomName}
                    />

                    <TouchableOpacity
                      style={[styles.addFormSubmitButton, addingLoading && styles.disabledButton]}
                      onPress={() => handleCreateClassroom(program.id)}
                      disabled={addingLoading}
                    >
                      {addingLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Icon name="check" size={16} color="#ffffff" />
                          <Text style={styles.addFormSubmitButtonText}>حفظ</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}

                {program.classrooms.length === 0 ? (
                  <View style={styles.emptyClassroomsWrap}>
                    <Text style={styles.emptyClassroomsText}>لا توجد فصول دراسية لهذا البرنامج</Text>
                  </View>
                ) : (
                  <View style={styles.classroomsWrap}>
                    {program.classrooms.map(classroom => (
                      <View key={classroom.id} style={styles.classroomCard}>
                        <View style={styles.classroomHeader}>
                          <View style={styles.classroomTitleGroup}>
                            <View style={styles.classNumberWrap}>
                              <Text style={styles.classNumberText}>{classroom.classNumber || '-'}</Text>
                            </View>
                            <Text style={styles.classroomName}>{classroom.name}</Text>
                          </View>

                          {canEdit ? (
                            <View style={styles.classroomActions}>
                              <TouchableOpacity
                                style={styles.classroomActionButton}
                                onPress={() => handleOpenEdit(program.id, classroom)}
                              >
                                <Icon name="edit" size={16} color="#2563eb" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.classroomActionButton}
                                onPress={() => handleDeleteClassroom(classroom)}
                              >
                                <Icon name="delete" size={16} color="#dc2626" />
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.classroomDatesRow}>
                          <View style={styles.dateBadge}>
                            <Icon name="event" size={12} color="#059669" />
                            <Text style={styles.dateBadgeText}>من: {formatDate(classroom.startDate)}</Text>
                          </View>
                          <View style={styles.dateBadge}>
                            <Icon name="event" size={12} color="#b45309" />
                            <Text style={styles.dateBadgeText}>إلى: {formatDate(classroom.endDate)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!editingState}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingState(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل بيانات الفصل</Text>
              <TouchableOpacity onPress={() => setEditingState(null)}>
                <Icon name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {editingState ? (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>اسم الفصل</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editingState.name}
                    onChangeText={value => setEditingState({ ...editingState, name: value })}
                    placeholder="اسم الفصل"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <DateTimePickerField
                  label="تاريخ البداية"
                  mode="date"
                  value={editingState.startDate}
                  onChange={value => setEditingState({ ...editingState, startDate: value })}
                  placeholder="اختر تاريخ البداية"
                />
                {editingState.startDate ? (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setEditingState({ ...editingState, startDate: '' })}
                  >
                    <Icon name="close" size={14} color="#475569" />
                    <Text style={styles.clearDateButtonText}>مسح تاريخ البداية</Text>
                  </TouchableOpacity>
                ) : null}

                <DateTimePickerField
                  label="تاريخ النهاية"
                  mode="date"
                  value={editingState.endDate}
                  onChange={value => setEditingState({ ...editingState, endDate: value })}
                  placeholder="اختر تاريخ النهاية"
                />
                {editingState.endDate ? (
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setEditingState({ ...editingState, endDate: '' })}
                  >
                    <Icon name="close" size={14} color="#475569" />
                    <Text style={styles.clearDateButtonText}>مسح تاريخ النهاية</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setEditingState(null)}
                    disabled={savingEdit}
                  >
                    <Text style={styles.modalCancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSaveButton, savingEdit && styles.disabledButton]}
                    onPress={handleSaveEdit}
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Icon name="check" size={16} color="#ffffff" />
                        <Text style={styles.modalSaveButtonText}>حفظ</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  permissionBadge: {
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
  permissionBadgeText: {
    fontSize: 11,
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
  programsWrap: {
    marginTop: 12,
    paddingBottom: 24,
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  programAccent: {
    height: 4,
    width: '100%',
  },
  programHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  programHeaderInfo: {
    marginBottom: 8,
  },
  programName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  programNameEn: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  programHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  addClassroomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addClassroomButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  addFormWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 8,
  },
  addFormInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  addFormSubmitButton: {
    minWidth: 88,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 4,
  },
  addFormSubmitButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyClassroomsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  emptyClassroomsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  classroomsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  classroomCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    backgroundColor: '#f8fafc',
  },
  classroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classroomTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  classNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1d4ed8',
  },
  classroomName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    flexShrink: 1,
  },
  classroomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classroomActionButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classroomDatesRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalField: {
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: -10,
    marginBottom: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearDateButtonText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  modalActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 4,
  },
  modalSaveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default ClassroomsScreen;

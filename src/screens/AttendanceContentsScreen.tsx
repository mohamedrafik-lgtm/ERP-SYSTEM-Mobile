import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
import {
  AttendanceClassroomInfo,
  AttendanceTrainingContent,
} from '../types/studentAttendance';

interface AttendanceContentsScreenProps {
  navigation: any;
  route: {
    params?: {
      programId?: number;
      programName?: string;
      classroomId?: number;
      classroomName?: string;
    };
  };
}

const CARD_COLORS = ['#8b5cf6', '#2563eb', '#059669', '#f59e0b', '#ec4899', '#14b8a6'];

const AttendanceContentsScreen = ({ navigation, route }: AttendanceContentsScreenProps) => {
  const programId = Number(route?.params?.programId || 0);
  const classroomId = Number(route?.params?.classroomId || 0);
  const fallbackProgramName = route?.params?.programName || '';
  const fallbackClassroomName = route?.params?.classroomName || 'الفصل';

  const [classroomInfo, setClassroomInfo] = useState<AttendanceClassroomInfo | null>(null);
  const [contents, setContents] = useState<AttendanceTrainingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<AttendanceTrainingContent | null>(null);
  const [printOptions, setPrintOptions] = useState({
    includeTraineePhone: false,
    includeGuardianPhone: false,
    includeNotes: false,
  });

  useEffect(() => {
    if (!classroomId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [classroomId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [classroomResponse, contentsResponse] = await Promise.all([
        AuthService.getAttendanceClassroomById(classroomId),
        AuthService.getTrainingContentsByClassroom(classroomId),
      ]);

      setClassroomInfo(classroomResponse || null);

      const normalizedContents = (Array.isArray(contentsResponse) ? contentsResponse : [])
        .map((item: any) => ({
          id: Number(item.id),
          code: item.code || '-',
          name: item.name || `Content ${item.id}`,
          classroomId: Number(item.classroomId || classroomId),
          instructor: item.instructor
            ? {
                id: String(item.instructor.id),
                name: item.instructor.name || 'غير محدد',
              }
            : null,
          _count: {
            scheduleSlots: Number(item?._count?.scheduleSlots || 0),
          },
        }))
        .filter((item: AttendanceTrainingContent) => Number(item.classroomId) === classroomId);

      setContents(normalizedContents);
    } catch (error: any) {
      setClassroomInfo(null);
      setContents([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل بيانات المواد',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openSessions = (content: AttendanceTrainingContent) => {
    navigation.navigate('AttendanceSessions', {
      programId,
      classroomId,
      contentId: Number(content.id),
      programName: classroomInfo?.program?.nameAr || fallbackProgramName,
      classroomName: classroomInfo?.name || fallbackClassroomName,
      contentName: content.name,
    });
  };

  const openPrintModal = (content: AttendanceTrainingContent) => {
    setSelectedContent(content);
    setPrintOptions({
      includeTraineePhone: false,
      includeGuardianPhone: false,
      includeNotes: false,
    });
    setShowPrintModal(true);
  };

  const confirmPrint = async () => {
    if (!selectedContent) {
      return;
    }

    try {
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const query = new URLSearchParams();

      if (printOptions.includeTraineePhone) query.append('includeTraineePhone', 'true');
      if (printOptions.includeGuardianPhone) query.append('includeGuardianPhone', 'true');
      if (printOptions.includeNotes) query.append('includeNotes', 'true');

      const reportUrl = `${baseUrl}/print/content-attendance-report/${selectedContent.id}${
        query.toString() ? `?${query.toString()}` : ''
      }`;

      const canOpen = await Linking.canOpenURL(reportUrl);
      if (!canOpen) {
        Alert.alert('تنبيه', 'لا يمكن فتح رابط التقرير على هذا الجهاز');
        return;
      }

      await Linking.openURL(reportUrl);
      setShowPrintModal(false);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر فتح تقرير الطباعة');
    }
  };

  const classroomTitle = useMemo(
    () => classroomInfo?.name || fallbackClassroomName || 'الفصل الدراسي',
    [classroomInfo?.name, fallbackClassroomName],
  );

  const programTitle = useMemo(
    () => classroomInfo?.program?.nameAr || fallbackProgramName,
    [classroomInfo?.program?.nameAr, fallbackProgramName],
  );

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
          <Text numberOfLines={1} style={styles.headerTitle}>{classroomTitle}</Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>{programTitle || 'المواد التدريبية'}</Text>
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
        <View style={styles.topInfoCard}>
          <View style={styles.topInfoItem}>
            <Icon name="menu-book" size={16} color="#7c3aed" />
            <Text style={styles.topInfoValue}>{contents.length}</Text>
            <Text style={styles.topInfoLabel}>عدد المواد</Text>
          </View>

          <View style={styles.topInfoDivider} />

          <View style={styles.topInfoItem}>
            <Icon name="meeting-room" size={16} color="#1d4ed8" />
            <Text style={styles.topInfoValue}>{classroomTitle}</Text>
            <Text style={styles.topInfoLabel}>الفصل الحالي</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل المواد...</Text>
          </View>
        ) : contents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="menu-book" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد مواد تدريبية</Text>
            <Text style={styles.emptySubtitle}>لم يتم ربط مواد تدريبية بهذا الفصل حتى الآن</Text>
          </View>
        ) : (
          <View style={styles.cardsWrap}>
            {contents.map((contentItem, idx) => (
              <View key={contentItem.id} style={styles.contentCard}>
                <View
                  style={[
                    styles.contentAccent,
                    { backgroundColor: CARD_COLORS[idx % CARD_COLORS.length] },
                  ]}
                />

                <View style={styles.contentHeadRow}>
                  <View style={styles.contentIconWrap}>
                    <Icon name="auto-stories" size={18} color="#7c3aed" />
                  </View>
                  <Text style={styles.contentCode}>{contentItem.code}</Text>
                </View>

                <Text style={styles.contentName}>{contentItem.name}</Text>

                <View style={styles.instructorRow}>
                  <Icon name="person" size={14} color="#64748b" />
                  <Text style={styles.instructorText}>{contentItem.instructor?.name || 'غير محدد'}</Text>
                </View>

                <View style={styles.contentFooter}>
                  <View style={styles.sessionsBadge}>
                    <Icon name="schedule" size={13} color="#1d4ed8" />
                    <Text style={styles.sessionsBadgeText}>
                      {Number(contentItem?._count?.scheduleSlots || 0)} فترات
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => openSessions(contentItem)}>
                    <Icon name="visibility" size={16} color="#ffffff" />
                    <Text style={styles.primaryButtonText}>المحاضرات</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.outlineButton} onPress={() => openPrintModal(contentItem)}>
                    <Icon name="print" size={16} color="#1d4ed8" />
                    <Text style={styles.outlineButtonText}>طباعة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showPrintModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowPrintModal(false)} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>خيارات تقرير الحضور</Text>
              <TouchableOpacity onPress={() => setShowPrintModal(false)}>
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedContent ? `مادة: ${selectedContent.name}` : ''}
            </Text>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                setPrintOptions(prev => ({
                  ...prev,
                  includeTraineePhone: !prev.includeTraineePhone,
                }))
              }
            >
              <Icon
                name={printOptions.includeTraineePhone ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color="#1d4ed8"
              />
              <Text style={styles.optionText}>اضافة رقم هاتف المتدرب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                setPrintOptions(prev => ({
                  ...prev,
                  includeGuardianPhone: !prev.includeGuardianPhone,
                }))
              }
            >
              <Icon
                name={printOptions.includeGuardianPhone ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color="#1d4ed8"
              />
              <Text style={styles.optionText}>اضافة رقم هاتف ولي الامر</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                setPrintOptions(prev => ({
                  ...prev,
                  includeNotes: !prev.includeNotes,
                }))
              }
            >
              <Icon
                name={printOptions.includeNotes ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color="#1d4ed8"
              />
              <Text style={styles.optionText}>اضافة ملاحظات المتدرب</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPrintModal(false)}>
                <Text style={styles.modalCancelText}>الغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalPrintButton} onPress={confirmPrint}>
                <Icon name="print" size={16} color="#ffffff" />
                <Text style={styles.modalPrintText}>طباعة الآن</Text>
              </TouchableOpacity>
            </View>
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
    maxWidth: 220,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    maxWidth: 220,
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
  topInfoCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  topInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  topInfoValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  topInfoLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  topInfoDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#e2e8f0',
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
    paddingBottom: 24,
  },
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  contentAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  contentHeadRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  contentName: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  instructorRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instructorText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  contentFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionsBadge: {
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
  sessionsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  outlineButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  outlineButtonText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  optionRow: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalButtonsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  modalPrintButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  modalPrintText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default AttendanceContentsScreen;

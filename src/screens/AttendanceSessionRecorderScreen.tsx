import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import AuthService from '../services/AuthService';
import { AttendanceStatus, AttendanceStatusArabic } from '../types/enums';
import {
  AttendanceCodeResponse,
  AttendanceSessionContext,
  AttendanceTrainee,
} from '../types/studentAttendance';

interface AttendanceSessionRecorderScreenProps {
  navigation: any;
  route: {
    params?: {
      sessionId?: number;
      contentName?: string;
    };
  };
}

const DAYS_AR: Record<string, string> = {
  SUNDAY: 'الاحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الاربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

const STATUS_BUTTONS: Array<{
  value: AttendanceStatus;
  label: string;
  color: string;
  bg: string;
  icon: string;
}> = [
  {
    value: AttendanceStatus.PRESENT,
    label: 'حاضر',
    color: '#166534',
    bg: '#dcfce7',
    icon: 'check-circle',
  },
  {
    value: AttendanceStatus.LATE,
    label: 'متأخر',
    color: '#b45309',
    bg: '#fef3c7',
    icon: 'schedule',
  },
  {
    value: AttendanceStatus.EXCUSED,
    label: 'بعذر',
    color: '#1d4ed8',
    bg: '#eff6ff',
    icon: 'report-gmailerrorred',
  },
  {
    value: AttendanceStatus.ABSENT,
    label: 'غائب',
    color: '#b91c1c',
    bg: '#fee2e2',
    icon: 'cancel',
  },
];

const AttendanceSessionRecorderScreen = ({
  navigation,
  route,
}: AttendanceSessionRecorderScreenProps) => {
  const sessionId = Number(route?.params?.sessionId || 0);
  const fallbackContentName = route?.params?.contentName || 'المادة';

  const [session, setSession] = useState<AttendanceSessionContext | null>(null);
  const [trainees, setTrainees] = useState<AttendanceTrainee[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [scannerInput, setScannerInput] = useState('');
  const [scannedCount, setScannedCount] = useState(0);

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [confirmTimer, setConfirmTimer] = useState(6);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState<AttendanceCodeResponse | null>(null);

  const unmountingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [sessionId]);

  useEffect(() => {
    if (!showFinishModal) {
      return;
    }

    setConfirmTimer(6);
    const interval = setInterval(() => {
      setConfirmTimer(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [showFinishModal]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const interval = setInterval(() => {
      saveAllChanges(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, attendance, notes]);

  useEffect(() => {
    return () => {
      unmountingRef.current = true;
      if (hasUnsavedChanges) {
        saveAllChanges(true);
      }
    };
  }, [hasUnsavedChanges, attendance, notes]);

  const loadData = async () => {
    try {
      setLoading(true);

      const data = await AuthService.getExpectedAttendanceTrainees(sessionId);

      const normalizedSession: AttendanceSessionContext = {
        id: Number(data?.session?.id || sessionId),
        date: data?.session?.date,
        isCancelled: Boolean(data?.session?.isCancelled),
        scheduleSlot: {
          id: Number(data?.session?.scheduleSlot?.id || 0),
          dayOfWeek: data?.session?.scheduleSlot?.dayOfWeek,
          startTime: data?.session?.scheduleSlot?.startTime,
          endTime: data?.session?.scheduleSlot?.endTime,
          type: data?.session?.scheduleSlot?.type,
          content: {
            id: Number(data?.session?.scheduleSlot?.content?.id || 0),
            code: data?.session?.scheduleSlot?.content?.code || '-',
            name: data?.session?.scheduleSlot?.content?.name || fallbackContentName,
            classroom: data?.session?.scheduleSlot?.content?.classroom,
            program: data?.session?.scheduleSlot?.content?.program,
          },
          distributionRoom: data?.session?.scheduleSlot?.distributionRoom || null,
        },
        attendance: Array.isArray(data?.session?.attendance)
          ? data.session.attendance.map((record: any) => ({
              traineeId: Number(record.traineeId),
              status: record.status,
              notes: record.notes || '',
            }))
          : [],
      };

      const normalizedTrainees: AttendanceTrainee[] = (Array.isArray(data?.trainees) ? data.trainees : [])
        .map((trainee: any) => ({
          id: Number(trainee.id),
          nameAr: trainee.nameAr || `متدرب ${trainee.id}`,
          nationalId: String(trainee.nationalId || ''),
          phone: String(trainee.phone || '-'),
          email: trainee.email || '',
        }))
        .filter((trainee: AttendanceTrainee) => Number.isFinite(trainee.id));

      const existingAttendance: Record<number, AttendanceStatus> = {};
      const existingNotes: Record<number, string> = {};

      normalizedSession.attendance.forEach(record => {
        existingAttendance[Number(record.traineeId)] = record.status;
        if (record.notes) {
          existingNotes[Number(record.traineeId)] = String(record.notes);
        }
      });

      setSession(normalizedSession);
      setTrainees(normalizedTrainees);
      setAttendance(existingAttendance);
      setNotes(existingNotes);
      setHasUnsavedChanges(false);
      setLastSaved(null);
    } catch (error: any) {
      setSession(null);
      setTrainees([]);
      setAttendance({});
      setNotes({});

      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل بيانات الحضور',
        position: 'top',
      });

      if (error?.message?.includes('المحاضرة السابقة')) {
        setTimeout(() => {
          navigation.goBack();
        }, 1300);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getRecordsFromState = (
    attendanceMap: Record<number, AttendanceStatus>,
    notesMap: Record<number, string>,
  ) => {
    return trainees
      .filter(trainee => !!attendanceMap[trainee.id])
      .map(trainee => ({
        traineeId: trainee.id,
        status: attendanceMap[trainee.id],
        notes: notesMap[trainee.id] ? notesMap[trainee.id] : undefined,
      }));
  };

  const saveRecords = async (
    records: Array<{ traineeId: number; status: AttendanceStatus; notes?: string }>,
    isAutoSave: boolean,
  ) => {
    if (!records.length) {
      return;
    }

    if (isAutoSave) {
      setAutoSaving(true);
    } else {
      setSaving(true);
    }

    try {
      await AuthService.bulkRecordStudentAttendance({
        sessionId,
        records,
      });

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error: any) {
      if (!unmountingRef.current) {
        Toast.show({
          type: 'error',
          text1: 'فشل الحفظ',
          text2: error?.message || 'حدث خطأ أثناء حفظ الحضور',
          position: 'top',
        });
      }
      throw error;
    } finally {
      if (isAutoSave) {
        setAutoSaving(false);
      } else {
        setSaving(false);
      }
    }
  };

  const saveAllChanges = async (silent: boolean) => {
    if (autoSaving) {
      return;
    }

    const records = getRecordsFromState(attendance, notes);
    if (!records.length) {
      return;
    }

    try {
      await saveRecords(records, true);

      if (!silent) {
        Toast.show({
          type: 'success',
          text1: 'تم الحفظ',
          text2: 'تم حفظ التغييرات بنجاح',
          position: 'top',
        });
      }
    } catch (_error) {
      // no-op
    }
  };

  const immediateAutoSave = async (
    traineeId: number,
    status: AttendanceStatus,
    note?: string,
  ) => {
    try {
      await saveRecords(
        [
          {
            traineeId,
            status,
            notes: note || undefined,
          },
        ],
        true,
      );
    } catch (_error) {
      // رسالة الخطأ تعرض داخل saveRecords
    }
  };

  const handleStatusChange = async (traineeId: number, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [traineeId]: status }));
    setHasUnsavedChanges(true);
    await immediateAutoSave(traineeId, status, notes[traineeId]);
  };

  const handleNoteChange = async (traineeId: number, note: string) => {
    setNotes(prev => ({ ...prev, [traineeId]: note }));
    setHasUnsavedChanges(true);

    if (attendance[traineeId]) {
      await immediateAutoSave(traineeId, attendance[traineeId], note);
    }
  };

  const processNationalId = async (nationalId: string) => {
    const trainee = trainees.find(item => item.nationalId === nationalId);

    if (!trainee) {
      Toast.show({
        type: 'error',
        text1: 'غير موجود',
        text2: 'الرقم القومي غير مسجل في هذه المحاضرة',
        position: 'top',
      });
      return;
    }

    if (attendance[trainee.id] === AttendanceStatus.PRESENT) {
      Toast.show({
        type: 'info',
        text1: trainee.nameAr,
        text2: 'تم تسجيله حاضر مسبقاً',
        position: 'top',
      });
      return;
    }

    setAttendance(prev => ({ ...prev, [trainee.id]: AttendanceStatus.PRESENT }));
    setScannedCount(prev => prev + 1);
    setHasUnsavedChanges(true);
    await immediateAutoSave(trainee.id, AttendanceStatus.PRESENT, notes[trainee.id]);

    Toast.show({
      type: 'success',
      text1: trainee.nameAr,
      text2: 'تم تسجيل الحضور بنجاح',
      position: 'top',
    });
  };

  const handleScannerInput = async (value: string) => {
    const numeric = value.replace(/\D/g, '');
    setScannerInput(numeric);

    if (numeric.length >= 14) {
      const nationalId = numeric.slice(0, 14);
      setScannerInput('');
      await processNationalId(nationalId);
    }
  };

  const markAll = async (status: AttendanceStatus) => {
    if (!filteredTrainees.length) {
      return;
    }

    const nextAttendance = { ...attendance };
    filteredTrainees.forEach(trainee => {
      nextAttendance[trainee.id] = status;
    });

    setAttendance(nextAttendance);
    setHasUnsavedChanges(true);

    const records = getRecordsFromState(nextAttendance, notes);
    try {
      await saveRecords(records, true);
      Toast.show({
        type: 'success',
        text1: 'تم التحديث',
        text2: `تم تعيين ${filteredTrainees.length} متدرب كـ ${AttendanceStatusArabic[status]}`,
        position: 'top',
      });
    } catch (_error) {
      // no-op
    }
  };

  const finishSession = async () => {
    try {
      setSaving(true);

      const finalAttendance: Record<number, AttendanceStatus> = { ...attendance };
      let absentCount = 0;

      trainees.forEach(trainee => {
        if (!finalAttendance[trainee.id]) {
          finalAttendance[trainee.id] = AttendanceStatus.ABSENT;
          absentCount += 1;
        }
      });

      const records = getRecordsFromState(finalAttendance, notes);

      await AuthService.bulkRecordStudentAttendance({
        sessionId,
        records,
      });

      setAttendance(finalAttendance);
      setHasUnsavedChanges(false);
      setShowFinishModal(false);

      Toast.show({
        type: 'success',
        text1: 'تم إنهاء المحاضرة',
        text2:
          absentCount > 0
            ? `تم تسجيل غياب تلقائي لـ ${absentCount} متدرب`
            : 'تم حفظ السجلات بالكامل',
        position: 'top',
      });

      navigation.navigate('AttendancePrograms');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل إنهاء المحاضرة',
        text2: error?.message || 'حدث خطأ أثناء الحفظ',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  const openFinishModal = () => {
    setShowFinishModal(true);
  };

  const openPrintAttendance = async () => {
    try {
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const reportUrl = `${baseUrl}/print/session-attendance/${sessionId}`;
      const canOpen = await Linking.canOpenURL(reportUrl);

      if (!canOpen) {
        Alert.alert('تنبيه', 'لا يمكن فتح رابط التقرير على هذا الجهاز');
        return;
      }

      await Linking.openURL(reportUrl);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر فتح تقرير الحضور');
    }
  };

  const generateAttendanceCode = async () => {
    try {
      setGeneratingCode(true);
      const codeResponse = await AuthService.generateAttendanceSessionCode(sessionId);
      setAttendanceCode(codeResponse);
      setShowCodeModal(true);

      Toast.show({
        type: 'success',
        text1: codeResponse?.isNew ? 'تم إنشاء الكود' : 'تم جلب الكود النشط',
        text2: 'يمكن للمتدربين استخدامه للتسجيل الذاتي',
        position: 'top',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل إنشاء الكود',
        text2: error?.message || 'حدث خطأ',
        position: 'top',
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const deactivateCode = () => {
    Alert.alert('تعطيل الكود', 'هل تريد تعطيل كود الحضور الحالي؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تعطيل',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deactivateAttendanceSessionCode(sessionId);
            setAttendanceCode(null);
            setShowCodeModal(false);
            Toast.show({
              type: 'success',
              text1: 'تم تعطيل الكود',
              text2: 'لن يعمل الكود الحالي بعد الآن',
              position: 'top',
            });
          } catch (error: any) {
            Toast.show({
              type: 'error',
              text1: 'فشل تعطيل الكود',
              text2: error?.message || 'حدث خطأ',
              position: 'top',
            });
          }
        },
      },
    ]);
  };

  const filteredTrainees = useMemo(() => {
    if (!searchQuery.trim()) {
      return trainees;
    }

    const query = searchQuery.trim().toLowerCase();
    return trainees.filter(trainee => {
      return (
        trainee.nameAr.toLowerCase().includes(query) || trainee.nationalId.includes(searchQuery.trim())
      );
    });
  }, [trainees, searchQuery]);

  const stats = useMemo(() => {
    const result = {
      total: trainees.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    trainees.forEach(trainee => {
      const status = attendance[trainee.id];
      if (status === AttendanceStatus.PRESENT) result.present += 1;
      if (status === AttendanceStatus.ABSENT) result.absent += 1;
      if (status === AttendanceStatus.LATE) result.late += 1;
      if (status === AttendanceStatus.EXCUSED) result.excused += 1;
    });

    return result;
  }, [attendance, trainees]);

  const statusText = autoSaving
    ? 'جاري الحفظ التلقائي...'
    : hasUnsavedChanges
      ? 'توجد تغييرات غير محفوظة'
      : lastSaved
        ? `آخر حفظ: ${lastSaved.toLocaleTimeString('ar-EG')}`
        : 'الحفظ التلقائي الفوري مفعل';

  const contentName =
    session?.scheduleSlot?.content?.name || attendanceCode?.session?.content || fallbackContentName;

  const sessionDate = session?.date ? new Date(session.date) : null;

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loaderText}>جاري تحميل بيانات الجلسة...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centerLoader}>
        <Icon name="event-busy" size={48} color="#94a3b8" />
        <Text style={styles.loaderText}>الجلسة غير متاحة</Text>
        <TouchableOpacity style={styles.backToRootBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backToRootBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text numberOfLines={1} style={styles.headerTitle}>{contentName}</Text>
          <Text numberOfLines={1} style={styles.headerSubtitle}>تسجيل الحضور</Text>
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
        <View style={styles.saveStatusRow}>
          <Icon
            name={
              autoSaving ? 'autorenew' : hasUnsavedChanges ? 'error-outline' : lastSaved ? 'check-circle' : 'cloud-done'
            }
            size={14}
            color={autoSaving ? '#1d4ed8' : hasUnsavedChanges ? '#b45309' : '#059669'}
          />
          <Text style={styles.saveStatusText}>{statusText}</Text>
        </View>

        <View style={styles.sessionInfoCard}>
          <View style={styles.sessionInfoItem}>
            <Icon name="book" size={16} color="#7c3aed" />
            <Text style={styles.sessionInfoLabel}>المادة</Text>
            <Text numberOfLines={1} style={styles.sessionInfoValue}>
              {session.scheduleSlot.content.name}
            </Text>
          </View>

          <View style={styles.sessionInfoDivider} />

          <View style={styles.sessionInfoItem}>
            <Icon name="event" size={16} color="#1d4ed8" />
            <Text style={styles.sessionInfoLabel}>التاريخ</Text>
            <Text style={styles.sessionInfoValue}>
              {(DAYS_AR[session.scheduleSlot.dayOfWeek] || session.scheduleSlot.dayOfWeek) +
                ' - ' +
                (sessionDate ? sessionDate.toLocaleDateString('ar-EG') : '-')}
            </Text>
          </View>

          <View style={styles.sessionInfoDivider} />

          <View style={styles.sessionInfoItem}>
            <Icon name="schedule" size={16} color="#059669" />
            <Text style={styles.sessionInfoLabel}>الوقت</Text>
            <Text style={styles.sessionInfoValue}>
              {session.scheduleSlot.startTime} - {session.scheduleSlot.endTime}
            </Text>
          </View>
        </View>

        <View style={styles.statsWrap}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>المجموع</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={[styles.statValue, styles.successText]}>{stats.present}</Text>
            <Text style={styles.statLabel}>حاضر</Text>
          </View>

          <View style={[styles.statCard, styles.statCardDanger]}>
            <Text style={[styles.statValue, styles.dangerText]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>غائب</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text style={[styles.statValue, styles.warningText]}>{stats.late}</Text>
            <Text style={styles.statLabel}>متأخر</Text>
          </View>

          <View style={[styles.statCard, styles.statCardInfo]}>
            <Text style={[styles.statValue, styles.infoText]}>{stats.excused}</Text>
            <Text style={styles.statLabel}>بعذر</Text>
          </View>
        </View>

        <View style={styles.scannerCard}>
          <View style={styles.scannerHeaderRow}>
            <View style={styles.scannerIconWrap}>
              <Icon name="qr-code-scanner" size={22} color="#ffffff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.scannerTitle}>الماسح السريع</Text>
              <Text style={styles.scannerSubtitle}>اكتب أو امسح الرقم القومي (14 رقم)</Text>
            </View>

            <View style={styles.scannedCountWrap}>
              <Text style={styles.scannedCount}>{scannedCount}</Text>
              <Text style={styles.scannedCountLabel}>تم المسح</Text>
            </View>
          </View>

          <TextInput
            value={scannerInput}
            onChangeText={handleScannerInput}
            placeholder="ادخل/امسح الرقم القومي..."
            keyboardType="number-pad"
            maxLength={14}
            style={styles.scannerInput}
          />

          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickBtnOutline} onPress={openPrintAttendance}>
              <Icon name="print" size={16} color="#1d4ed8" />
              <Text style={styles.quickBtnOutlineText}>طباعة كشف الحضور</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtnSolid, generatingCode && styles.disabledBtn]}
              onPress={generateAttendanceCode}
              disabled={generatingCode}
            >
              <Icon name="pin" size={16} color="#ffffff" />
              <Text style={styles.quickBtnSolidText}>
                {generatingCode ? 'جاري الإنشاء...' : 'كود تسجيل الحضور'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickTagBtn} onPress={() => markAll(AttendanceStatus.PRESENT)}>
              <Text style={styles.quickTagText}>تحديد الكل حاضر</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickTagBtn} onPress={() => markAll(AttendanceStatus.ABSENT)}>
              <Text style={styles.quickTagText}>تحديد الكل غائب</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickTagBtn, styles.quickTagBtnDanger, saving && styles.disabledBtn]}
              onPress={openFinishModal}
              disabled={saving}
            >
              <Text style={[styles.quickTagText, styles.quickTagTextDanger]}>
                {saving ? 'جاري الحفظ...' : 'إنهاء المحاضرة'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="بحث بالاسم أو الرقم القومي..."
            style={styles.searchInput}
          />
          {hasUnsavedChanges ? (
            <TouchableOpacity style={styles.manualSaveBtn} onPress={() => saveAllChanges(false)}>
              <Icon name="save" size={14} color="#1d4ed8" />
              <Text style={styles.manualSaveBtnText}>حفظ</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listWrap}>
          <Text style={styles.listTitle}>قائمة المتدربين ({filteredTrainees.length})</Text>

          {filteredTrainees.map((trainee, index) => {
            const status = attendance[trainee.id];
            const isPresent = status === AttendanceStatus.PRESENT;

            return (
              <View
                key={trainee.id}
                style={[
                  styles.traineeCard,
                  status ? (isPresent ? styles.traineeCardPresent : styles.traineeCardChecked) : undefined,
                ]}
              >
                <View style={styles.traineeHeadRow}>
                  <View style={[styles.traineeIndexWrap, status && isPresent && styles.traineeIndexWrapPresent]}>
                    {status && isPresent ? (
                      <Icon name="check" size={16} color="#ffffff" />
                    ) : (
                      <Text style={styles.traineeIndexText}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.traineeNameRow}>
                      <Text style={styles.traineeName}>{trainee.nameAr}</Text>
                      {status ? (
                        <View style={styles.statusBadgeOnName}>
                          <Text style={styles.statusBadgeOnNameText}>{AttendanceStatusArabic[status]}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.traineeMeta}>الرقم القومي: {trainee.nationalId}</Text>
                    <Text style={styles.traineeMeta}>هاتف: {trainee.phone}</Text>
                  </View>
                </View>

                <View style={styles.statusButtonsWrap}>
                  {STATUS_BUTTONS.map(btn => {
                    const isActive = status === btn.value;
                    return (
                      <TouchableOpacity
                        key={btn.value}
                        style={[
                          styles.statusButton,
                          isActive && {
                            borderColor: btn.color,
                            backgroundColor: btn.bg,
                          },
                        ]}
                        onPress={() => handleStatusChange(trainee.id, btn.value)}
                      >
                        <Icon
                          name={btn.icon}
                          size={13}
                          color={isActive ? btn.color : '#64748b'}
                        />
                        <Text
                          style={[
                            styles.statusButtonText,
                            isActive && {
                              color: btn.color,
                            },
                          ]}
                        >
                          {btn.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {status ? (
                  <TextInput
                    value={notes[trainee.id] || ''}
                    onChangeText={text => handleNoteChange(trainee.id, text)}
                    placeholder="ملاحظات (اختياري)..."
                    style={styles.noteInput}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowFinishModal(false)} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>تأكيد إنهاء المحاضرة</Text>
              <TouchableOpacity onPress={() => setShowFinishModal(false)}>
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.finishWarningBox}>
              <Text style={styles.finishWarningText}>
                سيتم تسجيل غياب تلقائي لكل متدرب لم يتم تحديد حالته.
              </Text>
            </View>

            {confirmTimer > 0 ? (
              <View style={styles.timerBox}>
                <ActivityIndicator size="small" color="#1d4ed8" />
                <Text style={styles.timerText}>انتظر {confirmTimer} ثانية للتأكيد...</Text>
              </View>
            ) : null}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowFinishModal(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelBtnText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  (confirmTimer > 0 || saving) && styles.disabledBtn,
                ]}
                onPress={finishSession}
                disabled={confirmTimer > 0 || saving}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {saving ? 'جاري الحفظ...' : 'تأكيد وإنهاء'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCodeModal && !!attendanceCode}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowCodeModal(false)} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>كود تسجيل الحضور</Text>
              <TouchableOpacity onPress={() => setShowCodeModal(false)}>
                <Icon name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.codeDigitsWrap}>
              {(attendanceCode?.code || '').split('').map((digit, idx) => (
                <View key={`${digit}-${idx}`} style={styles.codeDigitBox}>
                  <Text style={styles.codeDigitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.codeHintText}>الكود صالح للاستخدام الفوري من منصة المتدربين</Text>

            {attendanceCode?.expiresAt ? (
              <Text style={styles.codeMetaText}>
                ينتهي: {new Date(attendanceCode.expiresAt).toLocaleString('ar-EG')}
              </Text>
            ) : (
              <Text style={styles.codeMetaText}>لا يوجد وقت انتهاء محدد</Text>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCodeModal(false)}>
                <Text style={styles.modalCancelBtnText}>إغلاق</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalDangerBtn} onPress={deactivateCode}>
                <Text style={styles.modalDangerBtnText}>تعطيل الكود</Text>
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
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f6fb',
    paddingHorizontal: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
    textAlign: 'center',
  },
  backToRootBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backToRootBtnText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '800',
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
  saveStatusRow: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  sessionInfoCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sessionInfoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sessionInfoLabel: {
    marginTop: 3,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  sessionInfoValue: {
    marginTop: 2,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
    textAlign: 'center',
  },
  sessionInfoDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  statsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flexGrow: 1,
    minWidth: '31%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingVertical: 9,
    alignItems: 'center',
  },
  statCardSuccess: {
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  statCardDanger: {
    borderTopWidth: 3,
    borderTopColor: '#ef4444',
  },
  statCardWarning: {
    borderTopWidth: 3,
    borderTopColor: '#f59e0b',
  },
  statCardInfo: {
    borderTopWidth: 3,
    borderTopColor: '#3b82f6',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  successText: {
    color: '#059669',
  },
  dangerText: {
    color: '#dc2626',
  },
  warningText: {
    color: '#d97706',
  },
  infoText: {
    color: '#2563eb',
  },
  scannerCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  scannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  scannerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  scannedCountWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  scannedCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#166534',
    lineHeight: 20,
  },
  scannedCountLabel: {
    fontSize: 9,
    color: '#166534',
    fontWeight: '700',
  },
  scannerInput: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 18,
    color: '#0f172a',
    textAlign: 'center',
    fontWeight: '800',
  },
  quickActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickBtnOutline: {
    flex: 1,
    minWidth: 140,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  quickBtnOutlineText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  quickBtnSolid: {
    flex: 1,
    minWidth: 140,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#0f766e',
    backgroundColor: '#0d9488',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  quickBtnSolidText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '800',
  },
  quickTagBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f8fafc',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTagBtnDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
  },
  quickTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  quickTagTextDanger: {
    color: '#b91c1c',
  },
  searchCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    paddingVertical: 4,
  },
  manualSaveBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  manualSaveBtnText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  listWrap: {
    marginTop: 12,
    paddingBottom: 24,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  traineeCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 9,
    padding: 10,
  },
  traineeCardPresent: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  traineeCardChecked: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  traineeHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  traineeIndexWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  traineeIndexWrapPresent: {
    borderColor: '#22c55e',
    backgroundColor: '#16a34a',
  },
  traineeIndexText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '800',
  },
  traineeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  traineeName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusBadgeOnName: {
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeOnNameText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  traineeMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statusButtonsWrap: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusButtonText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '800',
  },
  noteInput: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  finishWarningBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    padding: 12,
  },
  finishWarningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    textAlign: 'center',
  },
  timerBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  modalActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  modalDangerBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  codeDigitsWrap: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  codeDigitBox: {
    width: 38,
    height: 46,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6ee7b7',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigitText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
  },
  codeHintText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  codeMetaText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
});

export default AttendanceSessionRecorderScreen;

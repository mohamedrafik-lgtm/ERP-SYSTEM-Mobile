import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { AttendanceSession } from '../types/studentAttendance';

interface AttendanceSessionsScreenProps {
  navigation: any;
  route: {
    params?: {
      programId?: number;
      classroomId?: number;
      contentId?: number;
      programName?: string;
      classroomName?: string;
      contentName?: string;
    };
  };
}

type SessionFilter = 'all' | 'upcoming' | 'past';
type SessionLockReason = 'cancelled' | 'future' | 'past' | 'past_allowed' | 'open';

const DAYS_AR: Record<string, string> = {
  SUNDAY: 'الاحد',
  MONDAY: 'الاثنين',
  TUESDAY: 'الثلاثاء',
  WEDNESDAY: 'الاربعاء',
  THURSDAY: 'الخميس',
  FRIDAY: 'الجمعة',
  SATURDAY: 'السبت',
};

const AttendanceSessionsScreen = ({ navigation, route }: AttendanceSessionsScreenProps) => {
  const { hasPermission } = usePermissions();
  const canRecordPast = hasPermission('dashboard.attendance', 'record_past');

  const classroomId = Number(route?.params?.classroomId || 0);
  const contentId = Number(route?.params?.contentId || 0);

  const fallbackClassroomName = route?.params?.classroomName || '';
  const fallbackContentName = route?.params?.contentName || 'المادة';

  const [contentInfo, setContentInfo] = useState<any>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<SessionFilter>('all');

  useEffect(() => {
    if (!contentId || !classroomId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [contentId, classroomId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [contentResponse, sessionsResponse] = await Promise.all([
        AuthService.getAttendanceContentById(contentId),
        AuthService.getAttendanceSessionsForContent(classroomId, contentId),
      ]);

      setContentInfo(contentResponse || null);

      const normalizedSessions = (Array.isArray(sessionsResponse) ? sessionsResponse : [])
        .map((session: any) => ({
          id: Number(session.id),
          date: session.date,
          isCancelled: Boolean(session.isCancelled),
          cancellationReason: session.cancellationReason,
          scheduleSlotId: Number(session.scheduleSlotId),
          scheduleSlot: {
            dayOfWeek: session?.scheduleSlot?.dayOfWeek,
            startTime: session?.scheduleSlot?.startTime,
            endTime: session?.scheduleSlot?.endTime,
            type: session?.scheduleSlot?.type,
            location: session?.scheduleSlot?.location,
            distributionRoom: session?.scheduleSlot?.distributionRoom || null,
          },
          _count: {
            attendance: Number(session?._count?.attendance || 0),
          },
        }))
        .sort((a: AttendanceSession, b: AttendanceSession) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

      setSessions(normalizedSessions);
    } catch (error: any) {
      setContentInfo(null);
      setSessions([]);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: error?.message || 'فشل تحميل المحاضرات',
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

  const getLockReason = (session: AttendanceSession): SessionLockReason => {
    if (session.isCancelled) {
      return 'cancelled';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() > today.getTime()) {
      return 'future';
    }

    if (sessionDate.getTime() < today.getTime()) {
      return canRecordPast ? 'past_allowed' : 'past';
    }

    return 'open';
  };

  const filteredSessions = useMemo(() => {
    const now = new Date();

    if (filter === 'upcoming') {
      return sessions.filter(session => !session.isCancelled && new Date(session.date) > now);
    }

    if (filter === 'past') {
      return sessions.filter(session => new Date(session.date) <= now);
    }

    return sessions;
  }, [filter, sessions]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: sessions.length,
      upcoming: sessions.filter(session => !session.isCancelled && new Date(session.date) > now).length,
      past: sessions.filter(session => new Date(session.date) <= now).length,
    };
  }, [sessions]);

  const openSession = (session: AttendanceSession) => {
    const reason = getLockReason(session);

    if (reason === 'cancelled') {
      Toast.show({
        type: 'error',
        text1: 'محاضرة ملغاة',
        text2: 'لا يمكن تسجيل الحضور لمحاضرة ملغاة',
        position: 'top',
      });
      return;
    }

    if (reason === 'future') {
      Toast.show({
        type: 'error',
        text1: 'غير متاح حالياً',
        text2: 'يمكن تسجيل الحضور في يوم المحاضرة فقط',
        position: 'top',
      });
      return;
    }

    if (reason === 'past') {
      Toast.show({
        type: 'error',
        text1: 'انتهى التسجيل',
        text2: 'لا تملك صلاحية تسجيل الحضور في تاريخ سابق',
        position: 'top',
      });
      return;
    }

    navigation.navigate('AttendanceSessionRecorder', {
      sessionId: Number(session.id),
      contentName: contentInfo?.name || fallbackContentName,
    });
  };

  const openPrintSession = async (sessionId: number) => {
    try {
      const baseUrl = await AuthService.getCurrentApiBaseUrl();
      const url = `${baseUrl}/print/session-attendance/${sessionId}`;
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        Alert.alert('تنبيه', 'لا يمكن فتح رابط الطباعة على هذا الجهاز');
        return;
      }

      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'تعذر فتح صفحة الطباعة');
    }
  };

  const contentName = contentInfo?.name || fallbackContentName;
  const instructorName = contentInfo?.instructor?.name || 'غير محدد';

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
          <Text numberOfLines={1} style={styles.headerSubtitle}>{fallbackClassroomName || 'المحاضرات'}</Text>
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
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Icon name="tag" size={15} color="#7c3aed" />
            <Text style={styles.infoValue}>{contentInfo?.code || '-'}</Text>
            <Text style={styles.infoLabel}>كود المادة</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <Icon name="person" size={15} color="#1d4ed8" />
            <Text style={styles.infoValue}>{instructorName}</Text>
            <Text style={styles.infoLabel}>المحاضر</Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <Icon name="event" size={15} color="#059669" />
            <Text style={styles.infoValue}>{sessions.length}</Text>
            <Text style={styles.infoLabel}>عدد المحاضرات</Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              الكل ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>
              القادمة ({counts.upcoming})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'past' && styles.filterChipActive]}
            onPress={() => setFilter('past')}
          >
            <Text style={[styles.filterChipText, filter === 'past' && styles.filterChipTextActive]}>
              السابقة ({counts.past})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>جاري تحميل المحاضرات...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="event-note" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>لا توجد محاضرات</Text>
            <Text style={styles.emptySubtitle}>لا يوجد بيانات لهذا الفلتر حالياً</Text>
          </View>
        ) : (
          <View style={styles.sessionsWrap}>
            {filteredSessions.map(session => {
              const lockReason = getLockReason(session);
              const isOpen = lockReason === 'open' || lockReason === 'past_allowed';
              const attendanceCount = Number(session?._count?.attendance || 0);
              const sessionDate = new Date(session.date);
              const isPast = sessionDate <= new Date();

              return (
                <TouchableOpacity
                  key={session.id}
                  activeOpacity={0.9}
                  style={[styles.sessionCard, !isOpen && styles.sessionCardLocked]}
                  onPress={() => openSession(session)}
                >
                  <View style={styles.badgesRow}>
                    {lockReason === 'cancelled' ? (
                      <View style={[styles.badge, styles.badgeDanger]}>
                        <Icon name="cancel" size={12} color="#b91c1c" />
                        <Text style={[styles.badgeText, styles.badgeTextDanger]}>محاضرة ملغاة</Text>
                      </View>
                    ) : null}

                    {lockReason === 'future' ? (
                      <View style={[styles.badge, styles.badgeWarning]}>
                        <Icon name="schedule" size={12} color="#b45309" />
                        <Text style={[styles.badgeText, styles.badgeTextWarning]}>لم يحن موعدها</Text>
                      </View>
                    ) : null}

                    {lockReason === 'past' ? (
                      <View style={[styles.badge, styles.badgeMuted]}>
                        <Icon name="lock" size={12} color="#475569" />
                        <Text style={[styles.badgeText, styles.badgeTextMuted]}>منتهية</Text>
                      </View>
                    ) : null}

                    {lockReason === 'past_allowed' ? (
                      <View style={[styles.badge, styles.badgeInfo]}>
                        <Icon name="edit" size={12} color="#1d4ed8" />
                        <Text style={[styles.badgeText, styles.badgeTextInfo]}>مسموح تسجيل سابق</Text>
                      </View>
                    ) : null}

                    {isOpen && !session.isCancelled ? (
                      <View style={[styles.badge, isPast ? styles.badgeMuted : styles.badgeOk]}>
                        <Text style={[styles.badgeText, isPast ? styles.badgeTextMuted : styles.badgeTextOk]}>
                          {isPast ? 'مرت' : 'قادمة'}
                        </Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.badge,
                        session.scheduleSlot.type === 'THEORY' ? styles.badgeTheory : styles.badgePractical,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          session.scheduleSlot.type === 'THEORY' ? styles.badgeTextTheory : styles.badgeTextPractical,
                        ]}
                      >
                        {session.scheduleSlot.type === 'THEORY' ? 'نظري' : 'عملي'}
                      </Text>
                    </View>

                    {session.scheduleSlot.distributionRoom?.roomName ? (
                      <View style={[styles.badge, styles.badgeGroup]}>
                        <Icon name="groups" size={12} color="#0369a1" />
                        <Text style={[styles.badgeText, styles.badgeTextGroup]}>
                          {session.scheduleSlot.distributionRoom.roomName}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.sessionMainRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.dateRow}>
                        <Icon name="event" size={15} color="#2563eb" />
                        <Text style={styles.dateText}>
                          {DAYS_AR[session.scheduleSlot.dayOfWeek] || session.scheduleSlot.dayOfWeek} - {' '}
                          {sessionDate.toLocaleDateString('ar-EG')}
                        </Text>
                      </View>

                      <View style={styles.dateRow}>
                        <Icon name="schedule" size={15} color="#2563eb" />
                        <Text style={styles.dateText}>
                          {session.scheduleSlot.startTime} - {session.scheduleSlot.endTime}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rightStatusWrap}>
                      {attendanceCount > 0 ? (
                        <>
                          <Icon name="check-circle" size={24} color="#16a34a" />
                          <Text style={styles.rightStatusNumber}>{attendanceCount}</Text>
                          <Text style={styles.rightStatusLabel}>سجل</Text>
                        </>
                      ) : (
                        <>
                          <Icon name="error-outline" size={24} color="#f59e0b" />
                          <Text style={styles.rightStatusLabel}>لم يسجل</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {attendanceCount > 0 ? (
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.printButton}
                        onPress={() => openPrintSession(session.id)}
                      >
                        <Icon name="print" size={14} color="#1d4ed8" />
                        <Text style={styles.printButtonText}>طباعة كشف الحضور</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
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
  infoCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  infoValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  infoLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  infoDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#e2e8f0',
  },
  filterCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 6,
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1d4ed8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
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
  sessionsWrap: {
    marginTop: 10,
    paddingBottom: 24,
  },
  sessionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    padding: 12,
  },
  sessionCardLocked: {
    opacity: 0.62,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
  },
  badgeTextDanger: {
    color: '#b91c1c',
  },
  badgeWarning: {
    borderColor: '#fde68a',
    backgroundColor: '#fef3c7',
  },
  badgeTextWarning: {
    color: '#b45309',
  },
  badgeMuted: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  badgeTextMuted: {
    color: '#475569',
  },
  badgeInfo: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  badgeTextInfo: {
    color: '#1d4ed8',
  },
  badgeOk: {
    borderColor: '#bbf7d0',
    backgroundColor: '#dcfce7',
  },
  badgeTextOk: {
    color: '#166534',
  },
  badgeTheory: {
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
  },
  badgeTextTheory: {
    color: '#6d28d9',
  },
  badgePractical: {
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  badgeTextPractical: {
    color: '#a16207',
  },
  badgeGroup: {
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
  },
  badgeTextGroup: {
    color: '#0369a1',
  },
  sessionMainRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  rightStatusWrap: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightStatusNumber: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  rightStatusLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  cardActionsRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  printButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  printButtonText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default AttendanceSessionsScreen;

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
import AuthService from '../services/AuthService';
import {
  GradeAppealItem,
  GradeAppealsStatsResponse,
  GradeAppealStatus,
  GradeAppealSubject,
  GradeAppealSubjectStatus,
} from '../types/gradeAppeals';

interface GradeAppealsRequestsScreenProps {
  navigation: any;
}

const DEFAULT_STATS: GradeAppealsStatsResponse = {
  total: 0,
  pending: 0,
  accepted: 0,
  rejected: 0,
};

const STATUS_FILTERS: Array<GradeAppealStatus | 'ALL'> = [
  'ALL',
  GradeAppealStatus.PENDING,
  GradeAppealStatus.ACCEPTED,
  GradeAppealStatus.REJECTED,
];

const GradeAppealsRequestsScreen = ({ navigation }: GradeAppealsRequestsScreenProps) => {
  const [appeals, setAppeals] = useState<GradeAppealItem[]>([]);
  const [stats, setStats] = useState<GradeAppealsStatsResponse>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<GradeAppealStatus | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<GradeAppealItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchAppeals();
  }, [selectedStatus, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const computedStats = useMemo(() => {
    return {
      total: appeals.length,
      pending: appeals.filter(item => item.status === GradeAppealStatus.PENDING).length,
      accepted: appeals.filter(item => item.status === GradeAppealStatus.ACCEPTED).length,
      rejected: appeals.filter(item => item.status === GradeAppealStatus.REJECTED).length,
    };
  }, [appeals]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const [appealsData, statsData] = await Promise.all([
        AuthService.getGradeAppeals(params),
        AuthService.getGradeAppealsStats().catch(() => null),
      ]);

      const normalizedAppeals = Array.isArray(appealsData)
        ? appealsData
        : Array.isArray((appealsData as any)?.data)
          ? (appealsData as any).data
          : [];

      setAppeals(normalizedAppeals);
      setStats((statsData as GradeAppealsStatsResponse) || DEFAULT_STATS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في تحميل التظلمات';
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: message,
        position: 'top',
      });
      setAppeals([]);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppeals();
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleOpenReviewModal = (appeal: GradeAppealItem, action: 'ACCEPTED' | 'REJECTED') => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setAdminResponse('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedAppeal || !reviewAction) return;

    try {
      setLoading(true);
      await AuthService.reviewGradeAppeal(selectedAppeal.id, {
        status: reviewAction,
        adminResponse: adminResponse.trim() || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: reviewAction === 'ACCEPTED' ? 'تم قبول التظلم' : 'تم رفض التظلم',
        position: 'top',
      });

      setShowReviewModal(false);
      setSelectedAppeal(null);
      setReviewAction(null);
      setAdminResponse('');
      await fetchAppeals();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في مراجعة التظلم';
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: message,
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (appeal: GradeAppealItem) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف تظلم ${appeal.trainee?.nameAr || ''}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.deleteGradeAppeal(appeal.id);
              Toast.show({
                type: 'success',
                text1: 'تم الحذف',
                text2: 'تم حذف التظلم بنجاح',
                position: 'top',
              });
              await fetchAppeals();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'فشل في حذف التظلم';
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: message,
                position: 'top',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const getAppealStatusLabel = (status: GradeAppealStatus | 'ALL') => {
    switch (status) {
      case 'ALL':
        return 'الكل';
      case GradeAppealStatus.PENDING:
        return 'قيد المراجعة';
      case GradeAppealStatus.ACCEPTED:
        return 'مقبول';
      case GradeAppealStatus.REJECTED:
        return 'مرفوض';
      default:
        return status;
    }
  };

  const getAppealStatusColor = (status: GradeAppealStatus) => {
    switch (status) {
      case GradeAppealStatus.PENDING:
        return '#f59e0b';
      case GradeAppealStatus.ACCEPTED:
        return '#059669';
      case GradeAppealStatus.REJECTED:
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getSubjectStatusLabel = (status: GradeAppealSubjectStatus) => {
    switch (status) {
      case GradeAppealSubjectStatus.PENDING:
        return 'قيد المراجعة';
      case GradeAppealSubjectStatus.ACCEPTED:
        return 'مقبول';
      case GradeAppealSubjectStatus.REJECTED:
        return 'مرفوض';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'غير متاح';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubjectsSummary = (subjects: GradeAppealSubject[]) => {
    const accepted = subjects.filter(s => s.status === GradeAppealSubjectStatus.ACCEPTED).length;
    const rejected = subjects.filter(s => s.status === GradeAppealSubjectStatus.REJECTED).length;
    const pending = subjects.filter(s => s.status === GradeAppealSubjectStatus.PENDING).length;

    return { accepted, rejected, pending, total: subjects.length };
  };

  const dashboardStats = stats.total > 0 ? stats : computedStats;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="GradeAppealsRequests" />
        <View style={styles.headerCenter}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>تظلمات الدرجات</Text>
            <Text style={styles.headerSubtitle}>إدارة طلبات مراجعة الدرجات</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.statsRow} horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{dashboardStats.total}</Text>
          <Text style={styles.statLabel}>الإجمالي</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{dashboardStats.pending}</Text>
          <Text style={styles.statLabel}>قيد المراجعة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{dashboardStats.accepted}</Text>
          <Text style={styles.statLabel}>مقبول</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>{dashboardStats.rejected}</Text>
          <Text style={styles.statLabel}>مرفوض</Text>
        </View>
      </ScrollView>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>الحالة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUS_FILTERS.map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, selectedStatus === status && styles.filterButtonActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.filterText, selectedStatus === status && styles.filterTextActive]}>
                {getAppealStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث بالاسم أو الرقم القومي أو الهاتف"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {!!searchInput && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Icon name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>بحث</Text>
        </TouchableOpacity>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل التظلمات...</Text>
          </View>
        ) : appeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>لا توجد تظلمات</Text>
            <Text style={styles.emptySubtitle}>لا توجد نتائج مطابقة للفلاتر الحالية</Text>
          </View>
        ) : (
          appeals.map(appeal => {
            const summary = getSubjectsSummary(appeal.subjects || []);
            return (
              <View key={appeal.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.traineeName}>{appeal.trainee?.nameAr || 'متدرب غير معروف'}</Text>
                    <Text style={styles.programName}>{appeal.trainee?.program?.nameAr || 'برنامج غير محدد'}</Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getAppealStatusColor(appeal.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getAppealStatusColor(appeal.status) }]}>
                        {getAppealStatusLabel(appeal.status)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(appeal)}>
                      <Icon name="delete" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailRows}>
                  {!!appeal.trainee?.nationalId && (
                    <View style={styles.detailRow}>
                      <Icon name="badge" size={14} color="#64748b" />
                      <Text style={styles.detailText}>{appeal.trainee.nationalId}</Text>
                    </View>
                  )}
                  {!!appeal.trainee?.phone && (
                    <View style={styles.detailRow}>
                      <Icon name="phone" size={14} color="#64748b" />
                      <Text style={styles.detailText}>{appeal.trainee.phone}</Text>
                    </View>
                  )}
                </View>

                {!!appeal.traineeNotes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>ملاحظات المتدرب</Text>
                    <Text style={styles.notesText}>{appeal.traineeNotes}</Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{summary.total}</Text>
                    <Text style={styles.summaryLabel}>إجمالي المواد</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{summary.pending}</Text>
                    <Text style={styles.summaryLabel}>معلقة</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.accepted}</Text>
                    <Text style={styles.summaryLabel}>مقبولة</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{summary.rejected}</Text>
                    <Text style={styles.summaryLabel}>مرفوضة</Text>
                  </View>
                </View>

                <View style={styles.subjectsContainer}>
                  {(appeal.subjects || []).map(subject => (
                    <View key={subject.id} style={styles.subjectRow}>
                      <View style={styles.subjectMainInfo}>
                        <Text style={styles.subjectName}>{subject.content?.name || 'مادة غير معروفة'}</Text>
                        <Text style={styles.subjectMeta}>
                          الدرجة الحالية: {subject.currentScore}/{subject.maxScore} ({Number(subject.percentage ?? 0).toFixed(1)}%)
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.subjectStatusBadge,
                          {
                            backgroundColor:
                              subject.status === GradeAppealSubjectStatus.ACCEPTED
                                ? '#dcfce7'
                                : subject.status === GradeAppealSubjectStatus.REJECTED
                                  ? '#fee2e2'
                                  : '#fef3c7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.subjectStatusText,
                            {
                              color:
                                subject.status === GradeAppealSubjectStatus.ACCEPTED
                                  ? '#059669'
                                  : subject.status === GradeAppealSubjectStatus.REJECTED
                                    ? '#dc2626'
                                    : '#d97706',
                            },
                          ]}
                        >
                          {getSubjectStatusLabel(subject.status)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.footer}>
                  <Text style={styles.dateText}>تاريخ الإنشاء: {formatDate(appeal.createdAt)}</Text>
                  {appeal.reviewedAt && (
                    <Text style={styles.dateText}>تاريخ المراجعة: {formatDate(appeal.reviewedAt)}</Text>
                  )}
                  {!!appeal.reviewer?.name && <Text style={styles.reviewText}>بواسطة: {appeal.reviewer.name}</Text>}
                  {!!appeal.adminResponse && <Text style={styles.reviewText}>رد الإدارة: {appeal.adminResponse}</Text>}

                  {appeal.status === GradeAppealStatus.PENDING && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleOpenReviewModal(appeal, 'ACCEPTED')}
                      >
                        <Icon name="check-circle" size={18} color="#ffffff" />
                        <Text style={styles.actionButtonText}>قبول</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleOpenReviewModal(appeal, 'REJECTED')}
                      >
                        <Icon name="cancel" size={18} color="#ffffff" />
                        <Text style={styles.actionButtonText}>رفض</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewAction === 'ACCEPTED' ? 'قبول التظلم' : 'رفض التظلم'}
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Icon name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>

            {selectedAppeal && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>المتدرب: {selectedAppeal.trainee?.nameAr || 'غير معروف'}</Text>
                <Text style={styles.modalLabel}>عدد المواد: {selectedAppeal.subjects?.length || 0}</Text>

                <Text style={styles.modalSectionTitle}>رد الإدارة (اختياري)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="اكتب رد الإدارة..."
                  value={adminResponse}
                  onChangeText={setAdminResponse}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  reviewAction === 'ACCEPTED' ? styles.approveButton : styles.rejectButton,
                ]}
                onPress={confirmReview}
              >
                <Text style={styles.modalConfirmText}>تأكيد</Text>
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
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1a237e',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748b',
  },
  placeholder: {
    width: 44,
  },
  statsRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    maxHeight: 96,
  },
  statCard: {
    minWidth: 100,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  filterSection: {
    marginTop: 8,
    paddingHorizontal: 14,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  filterButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1a237e',
  },
  filterText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  searchSection: {
    marginTop: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    color: '#0f172a',
    fontSize: 14,
  },
  searchButton: {
    borderRadius: 12,
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  programName: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    marginTop: 4,
    padding: 4,
  },
  detailRows: {
    marginBottom: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#64748b',
  },
  subjectsContainer: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  subjectMainInfo: {
    flex: 1,
    paddingRight: 8,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  subjectMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  subjectStatusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  subjectStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewText: {
    fontSize: 13,
    color: '#334155',
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  modalBody: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 13,
    color: '#334155',
  },
  modalSectionTitle: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    minHeight: 90,
    padding: 10,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  modalCancelText: {
    color: '#334155',
    fontWeight: '600',
  },
  modalConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default GradeAppealsRequestsScreen;

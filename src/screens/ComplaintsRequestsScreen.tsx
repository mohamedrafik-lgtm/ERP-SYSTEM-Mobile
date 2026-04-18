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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  ComplaintItem,
  ComplaintsStatsResponse,
  ComplaintStatus,
  ComplaintType,
  ReviewComplaintPayload,
} from '../types/complaints';

interface ComplaintsRequestsScreenProps {
  navigation: any;
}

const DEFAULT_STATS: ComplaintsStatsResponse = {
  total: 0,
  pending: 0,
  inProgress: 0,
  resolved: 0,
  closed: 0,
  complaints: 0,
  suggestions: 0,
};

const STATUS_FILTERS: Array<ComplaintStatus | 'ALL'> = [
  'ALL',
  ComplaintStatus.PENDING,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.CLOSED,
];

const TYPE_FILTERS: Array<ComplaintType | 'ALL'> = [
  'ALL',
  ComplaintType.COMPLAINT,
  ComplaintType.SUGGESTION,
];

const ComplaintsRequestsScreen = ({ navigation }: ComplaintsRequestsScreenProps) => {
  const COMPLAINTS_PAGE_SIZE = 20;

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [stats, setStats] = useState<ComplaintsStatsResponse>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<ComplaintType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewComplaintPayload['status']>('IN_PROGRESS');
  const [adminResponse, setAdminResponse] = useState('');

  const requestWithTimeout = async <T,>(request: Promise<T>, timeoutMs = 15000): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    try {
      return await new Promise<T>((resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error('انتهت مهلة الاتصال بالخادم'));
        }, timeoutMs);

        request
          .then(resolve)
          .catch(reject);
      });
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  };

  useEffect(() => {
    void fetchComplaints(1, false);
  }, [selectedStatus, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return complaints;
    }

    return complaints.filter(item => {
      const subject = item.subject?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const traineeName = item.trainee?.nameAr?.toLowerCase() || '';
      const nationalId = item.trainee?.nationalId?.toLowerCase() || '';
      const phone = item.trainee?.phone?.toLowerCase() || '';
      const program = item.trainee?.program?.nameAr?.toLowerCase() || '';

      return (
        subject.includes(query) ||
        description.includes(query) ||
        traineeName.includes(query) ||
        nationalId.includes(query) ||
        phone.includes(query) ||
        program.includes(query)
      );
    });
  }, [complaints, searchQuery]);

  const computedStats = useMemo(() => {
    const source = complaints;
    return {
      total: source.length,
      pending: source.filter(item => item.status === ComplaintStatus.PENDING).length,
      inProgress: source.filter(item => item.status === ComplaintStatus.IN_PROGRESS).length,
      resolved: source.filter(item => item.status === ComplaintStatus.RESOLVED).length,
      closed: source.filter(item => item.status === ComplaintStatus.CLOSED).length,
      complaints: source.filter(item => item.type === ComplaintType.COMPLAINT).length,
      suggestions: source.filter(item => item.type === ComplaintType.SUGGESTION).length,
    };
  }, [complaints]);

  const mergeUniqueComplaints = (oldList: ComplaintItem[], newList: ComplaintItem[]) => {
    const itemsMap = new Map<string, ComplaintItem>();

    oldList.forEach(item => itemsMap.set(item.id, item));
    newList.forEach(item => itemsMap.set(item.id, item));

    return Array.from(itemsMap.values());
  };

  const fetchComplaints = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params: any = {};

      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      if (selectedType !== 'ALL') {
        params.type = selectedType;
      }

      params.page = page;
      params.limit = COMPLAINTS_PAGE_SIZE;

      const complaintsData = await requestWithTimeout(
        AuthService.getComplaints(params),
        15000,
      );

      const normalizedComplaints = Array.isArray(complaintsData)
        ? complaintsData
        : Array.isArray((complaintsData as any)?.data)
          ? (complaintsData as any).data
          : [];

      if (append) {
        setComplaints(prev => mergeUniqueComplaints(prev, normalizedComplaints));
      } else {
        setComplaints(normalizedComplaints);
      }

      const pagination = (complaintsData as any)?.pagination;
      const apiTotalPages = Math.max(1, pagination?.totalPages || 1);
      const apiTotal = pagination?.total || normalizedComplaints.length;

      setCurrentPage(page);
      setTotalPages(apiTotalPages);
      setTotalItems(apiTotal);

      // لا تجعل الإحصائيات تمنع ظهور القائمة إذا تأخرت.
      requestWithTimeout(AuthService.getComplaintsStats(), 8000)
        .then(statsData => {
          setStats((statsData as ComplaintsStatsResponse) || DEFAULT_STATS);
        })
        .catch(() => {
          // تجاهل فشل الإحصائيات واعتمد على computedStats من القائمة.
        });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في تحميل الشكاوى والاقتراحات';
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: message,
        position: 'top',
      });
      setComplaints([]);
      setStats(DEFAULT_STATS);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints(1, false);
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || currentPage >= totalPages) {
      return;
    }

    await fetchComplaints(currentPage + 1, true);
  };

  const handleOpenReviewModal = (item: ComplaintItem) => {
    setSelectedComplaint(item);
    setAdminResponse(item.adminResponse || '');

    if (item.status === ComplaintStatus.PENDING) {
      setReviewStatus('IN_PROGRESS');
    } else if (item.status === ComplaintStatus.IN_PROGRESS) {
      setReviewStatus('RESOLVED');
    } else {
      setReviewStatus('CLOSED');
    }

    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedComplaint) return;

    try {
      setLoading(true);
      await AuthService.reviewComplaint(selectedComplaint.id, {
        status: reviewStatus,
        adminResponse: adminResponse.trim() || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم تحديث حالة الطلب بنجاح',
        position: 'top',
      });

      setShowReviewModal(false);
      setSelectedComplaint(null);
      setAdminResponse('');
      await fetchComplaints(1, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في مراجعة الطلب';
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

  const handleDelete = (item: ComplaintItem) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف الطلب: ${item.subject}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.deleteComplaint(item.id);
              Toast.show({
                type: 'success',
                text1: 'تم الحذف',
                text2: 'تم حذف الطلب بنجاح',
                position: 'top',
              });
              await fetchComplaints(1, false);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'فشل في حذف الطلب';
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

  const openAttachment = async (url?: string | null) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Toast.show({
          type: 'error',
          text1: 'تعذر فتح الرابط',
          text2: 'الرابط غير مدعوم على هذا الجهاز',
          position: 'top',
        });
        return;
      }
      await Linking.openURL(url);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل فتح المرفق',
        position: 'top',
      });
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

  const getTypeLabel = (type: ComplaintType | 'ALL') => {
    if (type === 'ALL') return 'الكل';
    return type === ComplaintType.COMPLAINT ? 'شكوى' : 'اقتراح';
  };

  const getTypeIcon = (type: ComplaintType) => {
    return type === ComplaintType.COMPLAINT ? 'report-problem' : 'lightbulb-outline';
  };

  const getTypeColor = (type: ComplaintType) => {
    return type === ComplaintType.COMPLAINT ? '#dc2626' : '#2563eb';
  };

  const getStatusLabel = (status: ComplaintStatus | 'ALL') => {
    switch (status) {
      case 'ALL':
        return 'الكل';
      case ComplaintStatus.PENDING:
        return 'قيد المراجعة';
      case ComplaintStatus.IN_PROGRESS:
        return 'جاري المعالجة';
      case ComplaintStatus.RESOLVED:
        return 'تم الحل';
      case ComplaintStatus.CLOSED:
        return 'مغلق';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.PENDING:
        return '#f59e0b';
      case ComplaintStatus.IN_PROGRESS:
        return '#2563eb';
      case ComplaintStatus.RESOLVED:
        return '#059669';
      case ComplaintStatus.CLOSED:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const dashboardStats = stats.total > 0 ? stats : computedStats;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="ComplaintsRequests" />
        <View style={styles.headerCenter}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>الشكاوى والاقتراحات</Text>
            <Text style={styles.headerSubtitle}>إدارة طلبات المتدربين</Text>
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
          <Text style={[styles.statValue, { color: '#2563eb' }]}>{dashboardStats.inProgress}</Text>
          <Text style={styles.statLabel}>جاري المعالجة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{dashboardStats.resolved}</Text>
          <Text style={styles.statLabel}>تم الحل</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#6b7280' }]}>{dashboardStats.closed}</Text>
          <Text style={styles.statLabel}>مغلق</Text>
        </View>
      </ScrollView>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>النوع</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TYPE_FILTERS.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, selectedType === type && styles.filterButtonActive]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
                {getTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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
                {getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Icon name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث بالاسم أو رقم الهوية أو العنوان..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {!!searchQuery && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
              <Icon name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultsInfoText}>
          المعروض: {filteredComplaints.length} من {complaints.length} طلب محمل
          {totalItems > 0 ? ` (الإجمالي: ${totalItems})` : ''}
        </Text>
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
            <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
          </View>
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={60} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>{searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات'}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'لا توجد نتائج مطابقة. يمكنك تحميل المزيد من الطلبات القديمة.'
                : 'لا توجد شكاوى أو اقتراحات مطابقة للفلاتر الحالية'}
            </Text>

            {currentPage < totalPages && (
              <TouchableOpacity
                style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#1a237e" />
                ) : (
                  <Icon name="expand-more" size={20} color="#1a237e" />
                )}
                <Text style={styles.loadMoreButtonText}>
                  {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد لتوسيع البحث'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filteredComplaints.map(item => (
              <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <Text style={styles.traineeName}>{item.trainee?.nameAr || 'متدرب غير معروف'}</Text>
                </View>

                <View style={styles.cardHeaderRight}>
                  <View style={[styles.badge, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
                    <Icon name={getTypeIcon(item.type)} size={13} color={getTypeColor(item.type)} />
                    <Text style={[styles.badgeText, { color: getTypeColor(item.type) }]}>{getTypeLabel(item.type)}</Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                  </View>

                  <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item)}>
                    <Icon name="delete" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.detailRows}>
                {!!item.trainee?.program?.nameAr && (
                  <View style={styles.detailRow}>
                    <Icon name="school" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.trainee.program.nameAr}</Text>
                  </View>
                )}
                {!!item.trainee?.nationalId && (
                  <View style={styles.detailRow}>
                    <Icon name="badge" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.trainee.nationalId}</Text>
                  </View>
                )}
                {!!item.trainee?.phone && (
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={14} color="#64748b" />
                    <Text style={styles.detailText}>{item.trainee.phone}</Text>
                  </View>
                )}
              </View>

              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionLabel}>الوصف</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>

              {!!item.attachmentUrl && (
                <TouchableOpacity style={styles.attachmentButton} onPress={() => openAttachment(item.attachmentUrl)}>
                  <Icon name="attach-file" size={16} color="#1a237e" />
                  <Text style={styles.attachmentText}>فتح المرفق</Text>
                </TouchableOpacity>
              )}

              <View style={styles.footer}>
                <Text style={styles.dateText}>تاريخ الإنشاء: {formatDate(item.createdAt)}</Text>

                {item.reviewedAt && (
                  <Text style={styles.dateText}>تاريخ المراجعة: {formatDate(item.reviewedAt)}</Text>
                )}

                {!!item.reviewer?.name && (
                  <Text style={styles.reviewText}>بواسطة: {item.reviewer.name}</Text>
                )}

                {!!item.adminResponse && (
                  <Text style={styles.reviewText}>رد الإدارة: {item.adminResponse}</Text>
                )}

                {(item.status === ComplaintStatus.PENDING || item.status === ComplaintStatus.IN_PROGRESS) && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.reviewButton} onPress={() => handleOpenReviewModal(item)}>
                      <Icon name="rate-review" size={18} color="#ffffff" />
                      <Text style={styles.reviewButtonText}>مراجعة</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              </View>
            ))}

            {currentPage < totalPages && (
              <TouchableOpacity
                style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#1a237e" />
                ) : (
                  <Icon name="expand-more" size={20} color="#1a237e" />
                )}
                <Text style={styles.loadMoreButtonText}>
                  {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد من الطلبات القديمة'}
                </Text>
              </TouchableOpacity>
            )}

            {currentPage >= totalPages && complaints.length > 0 && (
              <Text style={styles.endOfListText}>تم عرض كل الطلبات المتاحة</Text>
            )}
          </>
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
              <Text style={styles.modalTitle}>مراجعة الطلب</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Icon name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>الموضوع: {selectedComplaint.subject}</Text>
                <Text style={styles.modalLabel}>المتدرب: {selectedComplaint.trainee?.nameAr || 'غير معروف'}</Text>

                <Text style={styles.modalSectionTitle}>تحديد الحالة الجديدة</Text>
                <View style={styles.statusOptionsRow}>
                  {(['IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(statusOption => (
                    <TouchableOpacity
                      key={statusOption}
                      style={[
                        styles.statusOption,
                        reviewStatus === statusOption && styles.statusOptionActive,
                      ]}
                      onPress={() => setReviewStatus(statusOption)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          reviewStatus === statusOption && styles.statusOptionTextActive,
                        ]}
                      >
                        {getStatusLabel(statusOption)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

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
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmReview}>
                <Text style={styles.modalConfirmText}>حفظ</Text>
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
    minWidth: 95,
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
    marginTop: 8,
    paddingHorizontal: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 10,
    marginHorizontal: 8,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  resultsInfoText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
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
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a237e',
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 10,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a237e',
  },
  endOfListText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 12,
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
  subject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  traineeName: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
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
  descriptionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  attachmentButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  attachmentText: {
    marginLeft: 4,
    color: '#1a237e',
    fontWeight: '600',
    fontSize: 13,
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
    justifyContent: 'flex-end',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  reviewButtonText: {
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
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  statusOptionActive: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  statusOptionText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#ffffff',
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
    backgroundColor: '#1a237e',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default ComplaintsRequestsScreen;

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { DeferralRequest, DeferralRequestStatus } from '../types/deferralRequests';

interface PaymentDeferralRequestsScreenProps {
  navigation: any;
}

const PaymentDeferralRequestsScreen = ({ navigation }: PaymentDeferralRequestsScreenProps) => {
  const REQUESTS_PAGE_SIZE = 20;

  const [requests, setRequests] = useState<DeferralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<DeferralRequestStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<DeferralRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    void fetchRequests(1, false);
  }, [selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const mergeUniqueRequests = (oldRequests: DeferralRequest[], newRequests: DeferralRequest[]) => {
    const requestsMap = new Map<string, DeferralRequest>();

    oldRequests.forEach(request => requestsMap.set(request.id, request));
    newRequests.forEach(request => requestsMap.set(request.id, request));

    return Array.from(requestsMap.values());
  };

  const fetchRequests = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 Fetching deferral requests with params:', { status: selectedStatus });
      
      const params: any = {};
      
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      params.page = page;
      params.limit = REQUESTS_PAGE_SIZE;

      console.log('🔍 Calling AuthService.getDeferralRequests with:', params);
      const data = await AuthService.getDeferralRequests(params);
      console.log('🔍 Received data:', data);
      console.log('🔍 Data structure:', typeof data, Array.isArray(data));
      
      const normalizedRequests = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

      if (append) {
        setRequests(prev => mergeUniqueRequests(prev, normalizedRequests));
      } else {
        setRequests(normalizedRequests);
      }

      const apiTotalPages = Math.max(1, (data as any)?.pagination?.totalPages || 1);
      const apiTotalRequests = (data as any)?.pagination?.total || normalizedRequests.length;

      setCurrentPage(page);
      setTotalPages(apiTotalPages);
      setTotalRequests(apiTotalRequests);
    } catch (error) {
      console.error('❌ Error fetching deferral requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل طلبات التأجيل';
      
      if (!errorMessage.includes('401')) {
        Alert.alert('خطأ', errorMessage);
      }

      if (!append) {
        setRequests([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalRequests(0);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(1, false);
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || currentPage >= totalPages) {
      return;
    }

    await fetchRequests(currentPage + 1, true);
  };

  const handleReview = (request: DeferralRequest, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminResponse('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedRequest || !reviewAction) return;

    try {
      setLoading(true);
      await AuthService.reviewDeferralRequest(selectedRequest.id, {
        status: reviewAction,
        adminResponse: adminResponse || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: `تم ${reviewAction === 'APPROVED' ? 'قبول' : 'رفض'} الطلب بنجاح`,
        position: 'top',
        visibilityTime: 3000,
      });
      
      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewAction(null);
      setAdminResponse('');
      await fetchRequests(1, false);
    } catch (error) {
      console.error('Error reviewing request:', error);
      Alert.alert('خطأ', 'فشل في معالجة الطلب. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (request: DeferralRequest) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف طلب ${request.trainee.nameAr}؟\n\nلن يمكن التراجع عن هذا الإجراء.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.deleteDeferralRequest(request.id);
              Toast.show({
                type: 'success',
                text1: 'نجح',
                text2: 'تم حذف الطلب بنجاح',
                position: 'top',
                visibilityTime: 3000,
              });
              await fetchRequests(1, false);
            } catch (error) {
              console.error('Error deleting request:', error);
              Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'فشل في حذف الطلب. حاول مرة أخرى.',
                position: 'top',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: DeferralRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return 'قيد الانتظار';
      case 'APPROVED':
        return 'مقبول';
      case 'REJECTED':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const getStatusColor = (status: DeferralRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'APPROVED':
        return '#059669';
      case 'REJECTED':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return requests;
    }

    return requests.filter(request => {
      const traineeName = request.trainee?.nameAr?.toLowerCase() || '';
      const nationalId = request.trainee?.nationalId?.toLowerCase() || '';
      const phone = request.trainee?.phone?.toLowerCase() || '';
      const program = request.trainee?.program?.nameAr?.toLowerCase() || '';
      const feeName = request.fee?.name?.toLowerCase() || '';
      const reason = request.reason?.toLowerCase() || '';
      const adminReply = request.adminResponse?.toLowerCase() || '';

      return (
        traineeName.includes(query) ||
        nationalId.includes(query) ||
        phone.includes(query) ||
        program.includes(query) ||
        feeName.includes(query) ||
        reason.includes(query) ||
        adminReply.includes(query)
      );
    });
  }, [requests, searchQuery]);

  const renderRequestCard = (request: DeferralRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.traineeName}>{request.trainee.nameAr}</Text>
          <Text style={styles.programName}>{request.trainee.program.nameAr}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {getStatusLabel(request.status)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(request)}
          >
            <Icon name="delete" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{request.trainee.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="badge" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{request.trainee.nationalId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="receipt" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{request.fee.name} - {request.fee.amount.toLocaleString()} ج.م</Text>
        </View>
      </View>

      <View style={styles.requestReason}>
        <Text style={styles.reasonLabel}>سبب التأجيل:</Text>
        <Text style={styles.reasonText}>{request.reason}</Text>
      </View>

      <View style={styles.requestDates}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>أيام التأجيل المطلوبة</Text>
          <Text style={styles.dateValue}>{request.requestedExtensionDays} يوم</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>الموعد النهائي المطلوب</Text>
          <Text style={styles.dateValue}>{formatDate(request.requestedDeadline)}</Text>
        </View>
      </View>

      <View style={styles.requestFooter}>
        <Text style={styles.requestDate}>تاريخ الطلب: {formatDate(request.createdAt)}</Text>
        {request.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleReview(request, 'APPROVED')}
            >
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>قبول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReview(request, 'REJECTED')}
            >
              <Icon name="cancel" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>رفض</Text>
            </TouchableOpacity>
          </View>
        )}
        {request.status !== 'PENDING' && request.reviewedAt && (
          <View style={styles.reviewInfo}>
            <Text style={styles.reviewDate}>تمت المراجعة: {formatDate(request.reviewedAt)}</Text>
            {request.reviewer && (
              <Text style={styles.reviewerName}>بواسطة: {request.reviewer.name}</Text>
            )}
            {request.adminResponse && (
              <Text style={styles.adminResponseText}>الرد: {request.adminResponse}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaymentDeferralRequests" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>طلبات تأجيل السداد</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status === 'ALL' ? 'الكل' : getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <Icon name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="بحث بالاسم، الرقم القومي، الهاتف، الرسم..."
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultsInfoText}>
          المعروض: {filteredRequests.length} من {requests.length} طلب محمل
          {totalRequests > 0 ? ` (الإجمالي: ${totalRequests})` : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>{searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات'}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'لا توجد نتائج مطابقة. يمكنك تحميل المزيد من الطلبات القديمة.'
                : 'لم يتم العثور على طلبات تأجيل سداد'}
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
            {filteredRequests.map(renderRequestCard)}

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

            {currentPage >= totalPages && requests.length > 0 && (
              <Text style={styles.endOfListText}>تم عرض كل الطلبات المتاحة</Text>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewAction === 'APPROVED' ? 'قبول الطلب' : 'رفض الطلب'}
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Icon name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>الطالب: {selectedRequest.trainee.nameAr}</Text>
                <Text style={styles.modalLabel}>الرسم: {selectedRequest.fee.name}</Text>
                <Text style={styles.modalLabel}>المبلغ: {selectedRequest.fee.amount.toLocaleString()} ج.م</Text>
                
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>رد الإدارة (اختياري)</Text>
                  <TextInput
                    style={styles.responseInput}
                    placeholder="أدخل رد الإدارة..."
                    value={adminResponse}
                    onChangeText={setAdminResponse}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: reviewAction === 'APPROVED' ? '#059669' : '#dc2626' }
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
  },
  resultsInfoText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#1a237e',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traineeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  programName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  requestReason: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  requestDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
  },
  reviewDate: {
    fontSize: 13,
    color: '#1a237e',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  adminResponseText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadMoreButton: {
    marginTop: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#1a237e33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreButtonText: {
    marginLeft: 6,
    color: '#1a237e',
    fontWeight: '700',
    fontSize: 13,
  },
  endOfListText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  responseContainer: {
    marginTop: 16,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responseInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 80,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PaymentDeferralRequestsScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  TraineeRequest,
  RequestType,
  RequestStatus,
  ExamType,
} from '../types/traineeRequests';

interface FreeRequestsScreenProps {
  navigation: any;
}

const FreeRequestsScreen = ({ navigation }: FreeRequestsScreenProps) => {
  const [requests, setRequests] = useState<TraineeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<RequestType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<TraineeRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<TraineeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [selectedType, selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (selectedType !== 'ALL') {
        params.type = selectedType;
      }
      
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }

      const data = await AuthService.getTraineeRequests(params);
      
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data.data && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل الطلبات';
      
      if (!errorMessage.includes('401')) {
        Toast.show({
          type: 'error',
          text1: 'خطأ',
          text2: errorMessage,
          position: 'top',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
  };

  const handleReview = (request: TraineeRequest, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminResponse('');
    setShowReviewModal(true);
  };

  const confirmReview = async () => {
    if (!selectedRequest || !reviewAction) return;

    try {
      setLoading(true);
      await AuthService.reviewTraineeRequest(selectedRequest.id, {
        status: reviewAction,
        adminResponse: adminResponse || undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: `تم ${getStatusLabel(reviewAction)} الطلب بنجاح`,
        position: 'top',
        visibilityTime: 3000,
      });
      
      setShowReviewModal(false);
      setSelectedRequest(null);
      setReviewAction(null);
      setAdminResponse('');
      await fetchRequests();
    } catch (error) {
      console.error('Error reviewing request:', error);
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في معالجة الطلب',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (request: TraineeRequest) => {
    setRequestToDelete(request);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;

    try {
      setLoading(true);
      setShowDeleteModal(false);
      await AuthService.deleteTraineeRequest(requestToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'نجح',
        text2: 'تم حذف الطلب بنجاح',
        position: 'top',
      });
      setRequestToDelete(null);
      await fetchRequests();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'فشل في حذف الطلب',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: RequestType | string) => {
    if (type === RequestType.EXAM_POSTPONE) return 'تأجيل اختبار';
    if (type === RequestType.SICK_LEAVE) return 'إجازة مرضية';
    if (type === RequestType.ENROLLMENT_PROOF) return 'إثبات قيد';
    if (type === RequestType.CERTIFICATE) return 'إفادة';
    return String(type);
  };

  const getTypeIcon = (type: RequestType) => {
    if (type === RequestType.EXAM_POSTPONE) return 'event-busy';
    if (type === RequestType.SICK_LEAVE) return 'local-hospital';
    if (type === RequestType.ENROLLMENT_PROOF) return 'verified';
    if (type === RequestType.CERTIFICATE) return 'description';
    return 'assignment';
  };

  const getTypeColor = (type: RequestType) => {
    if (type === RequestType.EXAM_POSTPONE) return '#f59e0b';
    if (type === RequestType.SICK_LEAVE) return '#dc2626';
    if (type === RequestType.ENROLLMENT_PROOF) return '#059669';
    if (type === RequestType.CERTIFICATE) return '#3b82f6';
    return '#6b7280';
  };

  const getStatusLabel = (status: RequestStatus | string) => {
    if (status === RequestStatus.PENDING) return 'قيد الانتظار';
    if (status === RequestStatus.APPROVED) return 'مقبول';
    if (status === RequestStatus.REJECTED) return 'مرفوض';
    return String(status);
  };

  const getStatusColor = (status: RequestStatus) => {
    if (status === RequestStatus.PENDING) return '#f59e0b';
    if (status === RequestStatus.APPROVED) return '#059669';
    if (status === RequestStatus.REJECTED) return '#dc2626';
    return '#6b7280';
  };

  const getExamTypeLabel = (examType: ExamType | null) => {
    if (!examType) return '';
    if (examType === ExamType.MIDTERM) return 'ميد تيرم';
    if (examType === ExamType.FINAL) return 'نهائي';
    return examType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderRequestCard = (request: TraineeRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <View style={styles.traineeRow}>
            {request.trainee.photoUrl && (
              <Image source={{ uri: request.trainee.photoUrl }} style={styles.traineePhoto} />
            )}
            <View style={styles.traineeDetails}>
              <Text style={styles.traineeName}>{request.trainee.nameAr}</Text>
              <Text style={styles.programName}>{request.trainee.program.nameAr}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerBadges}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(request.type) + '20' }]}>
            <Icon name={getTypeIcon(request.type)} size={14} color={getTypeColor(request.type)} />
            <Text style={[styles.typeText, { color: getTypeColor(request.type) }]}>
              {getTypeLabel(request.type)}
            </Text>
          </View>
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
        {request.type === RequestType.EXAM_POSTPONE && request.examType && (
          <View style={styles.detailRow}>
            <Icon name="assignment" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              اختبار {getExamTypeLabel(request.examType)}
              {request.examDate && ` - ${formatDate(request.examDate)}`}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestReason}>
        <Text style={styles.reasonLabel}>سبب الطلب:</Text>
        <Text style={styles.reasonText}>{request.reason}</Text>
      </View>

      {request.attachmentUrl && (
        <View style={styles.attachmentContainer}>
          <Icon name="attach-file" size={16} color="#1a237e" />
          <Text style={styles.attachmentText}>يوجد مرفق</Text>
        </View>
      )}

      <View style={styles.requestFooter}>
        <Text style={styles.requestDate}>تاريخ الطلب: {formatDate(request.createdAt)}</Text>
        
        {request.status === RequestStatus.PENDING && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleReview(request, RequestStatus.APPROVED)}
            >
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>قبول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReview(request, RequestStatus.REJECTED)}
            >
              <Icon name="cancel" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>رفض</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status !== RequestStatus.PENDING && request.reviewedAt && (
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
        <CustomMenu navigation={navigation} activeRouteName="FreeRequests" />
        <View style={styles.headerCenter}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>الطلبات المجانية</Text>
            <Text style={styles.headerSubtitle}>إجازات وإثباتات وإفادات</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>نوع الطلب:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'ALL' && styles.filterButtonActive]}
            onPress={() => setSelectedType('ALL')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'ALL' && styles.filterButtonTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === RequestType.EXAM_POSTPONE && styles.filterButtonActive]}
            onPress={() => setSelectedType(RequestType.EXAM_POSTPONE)}
          >
            <Text style={[styles.filterButtonText, selectedType === RequestType.EXAM_POSTPONE && styles.filterButtonTextActive]}>
              تأجيل اختبار
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === RequestType.SICK_LEAVE && styles.filterButtonActive]}
            onPress={() => setSelectedType(RequestType.SICK_LEAVE)}
          >
            <Text style={[styles.filterButtonText, selectedType === RequestType.SICK_LEAVE && styles.filterButtonTextActive]}>
              إجازة مرضية
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === RequestType.ENROLLMENT_PROOF && styles.filterButtonActive]}
            onPress={() => setSelectedType(RequestType.ENROLLMENT_PROOF)}
          >
            <Text style={[styles.filterButtonText, selectedType === RequestType.ENROLLMENT_PROOF && styles.filterButtonTextActive]}>
              إثبات قيد
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === RequestType.CERTIFICATE && styles.filterButtonActive]}
            onPress={() => setSelectedType(RequestType.CERTIFICATE)}
          >
            <Text style={[styles.filterButtonText, selectedType === RequestType.CERTIFICATE && styles.filterButtonTextActive]}>
              إفادة
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>الحالة:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'ALL' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('ALL')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'ALL' && styles.filterButtonTextActive]}>
              الكل
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === RequestStatus.PENDING && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(RequestStatus.PENDING)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === RequestStatus.PENDING && styles.filterButtonTextActive]}>
              قيد الانتظار
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === RequestStatus.APPROVED && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(RequestStatus.APPROVED)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === RequestStatus.APPROVED && styles.filterButtonTextActive]}>
              مقبول
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === RequestStatus.REJECTED && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(RequestStatus.REJECTED)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === RequestStatus.REJECTED && styles.filterButtonTextActive]}>
              مرفوض
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على طلبات</Text>
          </View>
        ) : (
          requests.map(renderRequestCard)
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
                {reviewAction === RequestStatus.APPROVED ? 'قبول الطلب' : 'رفض الطلب'}
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Icon name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>الطالب: {selectedRequest.trainee.nameAr}</Text>
                <Text style={styles.modalLabel}>نوع الطلب: {getTypeLabel(selectedRequest.type)}</Text>
                
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
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { 
                  backgroundColor: reviewAction === RequestStatus.APPROVED ? '#059669' : '#dc2626' 
                }]}
                onPress={confirmReview}
              >
                <Text style={styles.modalConfirmText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteIcon}>
              <Icon name="warning" size={48} color="#dc2626" />
            </View>
            
            <Text style={styles.deleteModalTitle}>تأكيد الحذف</Text>
            
            {requestToDelete && (
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalText}>هل أنت متأكد من حذف طلب</Text>
                <Text style={styles.deleteModalName}>{requestToDelete.trainee.nameAr}</Text>
                <Text style={styles.deleteModalWarning}>لن يمكن التراجع عن هذا الإجراء</Text>
              </View>
            )}

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setRequestToDelete(null);
                }}
              >
                <Text style={styles.deleteCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDelete}>
                <Icon name="delete-forever" size={20} color="#fff" />
                <Text style={styles.deleteConfirmText}>حذف نهائياً</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 40 },
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: { padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e' },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  placeholder: { width: 44 },
  filterContainer: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  filterButtonActive: { backgroundColor: '#1a237e' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  filterButtonTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  requestCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  requestHeader: { marginBottom: 12 },
  requestInfo: { marginBottom: 8 },
  traineeRow: { flexDirection: 'row', alignItems: 'center' },
  traineePhoto: { width: 48, height: 48, borderRadius: 24, marginLeft: 12 },
  traineeDetails: { flex: 1 },
  traineeName: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  programName: { fontSize: 14, color: '#6b7280' },
  headerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  typeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  deleteButton: { padding: 6, borderRadius: 8, backgroundColor: '#fee2e2' },
  requestDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 8 },
  requestReason: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  reasonText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  attachmentContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 10, borderRadius: 8, marginBottom: 12 },
  attachmentText: { fontSize: 13, color: '#1a237e', fontWeight: '600', marginLeft: 8 },
  requestFooter: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  requestDate: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  approveButton: { backgroundColor: '#059669' },
  rejectButton: { backgroundColor: '#dc2626' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reviewInfo: { backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8 },
  reviewDate: { fontSize: 13, color: '#1a237e', marginBottom: 4 },
  reviewerName: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  adminResponseText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#6b7280', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a237e' },
  modalBody: { marginBottom: 20 },
  modalLabel: { fontSize: 15, color: '#374151', marginBottom: 8 },
  responseContainer: { marginTop: 16 },
  responseLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  responseInput: { backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1f2937', minHeight: 80, textAlign: 'right' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  modalConfirmButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  deleteModalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '85%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
  deleteIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  deleteModalTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  deleteModalBody: { alignItems: 'center', marginBottom: 24 },
  deleteModalText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  deleteModalName: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 12, textAlign: 'center' },
  deleteModalWarning: { fontSize: 14, color: '#dc2626', textAlign: 'center', fontWeight: '600' },
  deleteModalActions: { flexDirection: 'row', width: '100%', gap: 12 },
  deleteCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', backgroundColor: '#f9fafb' },
  deleteCancelText: { fontSize: 16, fontWeight: '700', color: '#6b7280' },
  deleteConfirmButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', gap: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  deleteConfirmText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default FreeRequestsScreen;
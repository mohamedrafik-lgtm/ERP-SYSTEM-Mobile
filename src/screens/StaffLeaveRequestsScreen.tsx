import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  StaffLeaveType, StaffLeaveTypeArabic, StaffLeaveTypeIcon,
  StaffLeaveStatus, StaffLeaveStatusArabic, StaffLeaveStatusColor,
  type StaffLeaveRequest,
} from '../types/staffAttendance';
import {usePermissions} from '../hooks/usePermissions';

const StaffLeaveRequestsScreen = ({navigation}: any) => {
  const {hasPermission} = usePermissions();
  const isAdminUser = hasPermission('staff-attendance.leaves', 'manage');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [filter, setFilter] = useState('all');
  const [myLeaves, setMyLeaves] = useState<StaffLeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<StaffLeaveRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: StaffLeaveType.PERSONAL,
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingLeave, setReviewingLeave] = useState<StaffLeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const statusFilter = filter !== 'all' ? filter : undefined;
      const [myData, allData] = await Promise.all([
        AuthService.getMyLeaveRequests(statusFilter).catch(() => []),
        isAdminUser ? AuthService.getStaffLeaveRequests({status: statusFilter}).catch(() => []) : Promise.resolve([]),
      ]);
      setMyLeaves(Array.isArray(myData) ? myData : []);
      setAllLeaves(Array.isArray(allData) ? allData : []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, isAdminUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleCreate = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setCreating(true);
    try {
      await AuthService.createLeaveRequest(formData);
      Toast.show({ type: 'success', text1: 'تم الإرسال', text2: 'تم إرسال طلب الإجازة بنجاح' });
      setShowCreateModal(false);
      setFormData({ startDate: '', endDate: '', reason: '', leaveType: StaffLeaveType.PERSONAL });
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل إرسال الطلب');
    } finally {
      setCreating(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingLeave) return;
    setReviewing(true);
    try {
      await AuthService.reviewLeaveRequest(reviewingLeave.id, status, reviewNotes || undefined);
      Toast.show({
        type: 'success',
        text1: status === 'APPROVED' ? 'تمت الموافقة' : 'تم الرفض',
        text2: status === 'APPROVED' ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب',
      });
      setShowReviewModal(false);
      setReviewingLeave(null);
      setReviewNotes('');
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في مراجعة الطلب');
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const currentLeaves = tab === 'my' ? myLeaves : allLeaves;

  const LEAVE_TYPE_OPTIONS: StaffLeaveType[] = Object.values(StaffLeaveType) as StaffLeaveType[];
  const STATUS_FILTERS = [
    {key: 'all', label: 'الكل'},
    {key: StaffLeaveStatus.PENDING, label: 'قيد المراجعة'},
    {key: StaffLeaveStatus.APPROVED, label: 'موافق'},
    {key: StaffLeaveStatus.REJECTED, label: 'مرفوض'},
  ];

  // Admin stats
  const adminStats = {
    total: allLeaves.length,
    pending: allLeaves.filter(l => l.status === StaffLeaveStatus.PENDING).length,
    approved: allLeaves.filter(l => l.status === StaffLeaveStatus.APPROVED).length,
    rejected: allLeaves.filter(l => l.status === StaffLeaveStatus.REJECTED).length,
  };

  const calcDays = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffLeaveRequests" />
        <Text style={styles.headerTitle}>طلبات الإجازة</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Icon name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'my' && styles.tabActive]} onPress={() => setTab('my')}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>طلباتي</Text>
        </TouchableOpacity>
        {isAdminUser && (
          <TouchableOpacity style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
            <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>كل الطلبات</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#1a237e" />
          </View>
        ) : (
          <>
            {/* Admin Stats */}
            {tab === 'all' && isAdminUser && (
              <View style={styles.adminStats}>
                <View style={[styles.adminStatBox, {backgroundColor: '#f5f3ff'}]}>
                  <Text style={[styles.adminStatNum, {color: '#7c3aed'}]}>{adminStats.total}</Text>
                  <Text style={styles.adminStatLabel}>الكل</Text>
                </View>
                <View style={[styles.adminStatBox, {backgroundColor: '#fef3c7'}]}>
                  <Text style={[styles.adminStatNum, {color: '#d97706'}]}>{adminStats.pending}</Text>
                  <Text style={styles.adminStatLabel}>معلق</Text>
                </View>
                <View style={[styles.adminStatBox, {backgroundColor: '#ecfdf5'}]}>
                  <Text style={[styles.adminStatNum, {color: '#059669'}]}>{adminStats.approved}</Text>
                  <Text style={styles.adminStatLabel}>موافق</Text>
                </View>
                <View style={[styles.adminStatBox, {backgroundColor: '#fef2f2'}]}>
                  <Text style={[styles.adminStatNum, {color: '#dc2626'}]}>{adminStats.rejected}</Text>
                  <Text style={styles.adminStatLabel}>مرفوض</Text>
                </View>
              </View>
            )}

            {currentLeaves.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="event-busy" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>لا توجد طلبات</Text>
              </View>
            ) : (
              currentLeaves.map(leave => (
                <TouchableOpacity
                  key={leave.id}
                  style={styles.leaveCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (tab === 'all' && leave.status === StaffLeaveStatus.PENDING) {
                      setReviewingLeave(leave);
                      setShowReviewModal(true);
                    }
                  }}>
                  <View style={styles.leaveHeader}>
                    {/* Leave type icon */}
                    <View style={styles.leaveIconBox}>
                      <Icon
                        name={StaffLeaveTypeIcon[leave.leaveType] || 'event-note'}
                        size={20}
                        color="#1a237e"
                      />
                    </View>
                    <View style={{flex: 1}}>
                      {tab === 'all' && leave.user && (
                        <Text style={styles.leaveName}>{leave.user.name}</Text>
                      )}
                      <Text style={styles.leaveTypeText}>{StaffLeaveTypeArabic[leave.leaveType]}</Text>
                    </View>
                    <View style={[styles.statusBadge, {backgroundColor: (StaffLeaveStatusColor[leave.status] || '#6b7280') + '18'}]}>
                      <Text style={[styles.statusBadgeText, {color: StaffLeaveStatusColor[leave.status] || '#6b7280'}]}>
                        {StaffLeaveStatusArabic[leave.status]}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.leaveDates}>
                    <View style={styles.dateItem}>
                      <Icon name="today" size={14} color="#059669" />
                      <Text style={styles.dateText}>من: {formatDate(leave.startDate)}</Text>
                    </View>
                    <View style={styles.dateItem}>
                      <Icon name="event" size={14} color="#dc2626" />
                      <Text style={styles.dateText}>إلى: {formatDate(leave.endDate)}</Text>
                    </View>
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysText}>
                        {calcDays(leave.startDate, leave.endDate)} يوم
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leaveReason} numberOfLines={2}>{leave.reason}</Text>
                  {leave.reviewNotes && (
                    <View style={styles.reviewNotesBox}>
                      <Text style={styles.reviewNotesLabel}>ملاحظات المراجع:</Text>
                      <Text style={styles.reviewNotesText}>{leave.reviewNotes}</Text>
                    </View>
                  )}
                  {tab === 'all' && leave.status === StaffLeaveStatus.PENDING && (
                    <View style={styles.reviewHint}>
                      <Icon name="touch-app" size={14} color="#1a237e" />
                      <Text style={styles.reviewHintText}>اضغط للمراجعة</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Create Leave Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>طلب إجازة جديد</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>نوع الإجازة</Text>
              <View style={styles.leaveTypeGrid}>
                {LEAVE_TYPE_OPTIONS.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.leaveTypeChip, formData.leaveType === type && styles.leaveTypeChipActive]}
                    onPress={() => setFormData(p => ({ ...p, leaveType: type }))}
                  >
                    <Text style={[styles.leaveTypeChipText, formData.leaveType === type && { color: '#fff' }]}>
                      {StaffLeaveTypeArabic[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>تاريخ البداية (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 2026-03-10"
                placeholderTextColor="#9ca3af"
                value={formData.startDate}
                onChangeText={v => setFormData(p => ({ ...p, startDate: v }))}
              />

              <Text style={styles.inputLabel}>تاريخ النهاية (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 2026-03-12"
                placeholderTextColor="#9ca3af"
                value={formData.endDate}
                onChangeText={v => setFormData(p => ({ ...p, endDate: v }))}
              />

              <Text style={styles.inputLabel}>السبب *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="اكتب سبب الإجازة..."
                placeholderTextColor="#9ca3af"
                value={formData.reason}
                onChangeText={v => setFormData(p => ({ ...p, reason: v }))}
                multiline
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, creating && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Icon name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال الطلب</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Review Leave Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>مراجعة الطلب</Text>
              <TouchableOpacity onPress={() => { setShowReviewModal(false); setReviewingLeave(null); }}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {reviewingLeave && (
              <View style={{ gap: 10 }}>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewInfoLabel}>الموظف: {reviewingLeave.user?.name}</Text>
                  <Text style={styles.reviewInfoLabel}>النوع: {StaffLeaveTypeArabic[reviewingLeave.leaveType]}</Text>
                  <Text style={styles.reviewInfoLabel}>من: {formatDate(reviewingLeave.startDate)}</Text>
                  <Text style={styles.reviewInfoLabel}>إلى: {formatDate(reviewingLeave.endDate)}</Text>
                  <Text style={styles.reviewInfoLabel}>السبب: {reviewingLeave.reason}</Text>
                </View>

                <Text style={styles.inputLabel}>ملاحظات (اختياري)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="ملاحظات المراجعة..."
                  placeholderTextColor="#9ca3af"
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                />

                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={[styles.reviewBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleReview('APPROVED')}
                    disabled={reviewing}
                  >
                    {reviewing ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <Icon name="check" size={18} color="#fff" />
                        <Text style={styles.reviewBtnText}>موافقة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reviewBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => handleReview('REJECTED')}
                    disabled={reviewing}
                  >
                    {reviewing ? <ActivityIndicator color="#fff" size="small" /> : (
                      <>
                        <Icon name="close" size={18} color="#fff" />
                        <Text style={styles.reviewBtnText}>رفض</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffLeaveRequestsScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  addBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a237e', alignItems: 'center', justifyContent: 'center'},
  tabBar: {flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  tab: {flex: 1, paddingVertical: 12, alignItems: 'center'},
  tabActive: {borderBottomWidth: 2, borderBottomColor: '#1a237e'},
  tabText: {fontSize: 14, fontWeight: '600', color: '#6b7280'},
  tabTextActive: {color: '#1a237e', fontWeight: '800'},
  filterScroll: {maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  filterContent: {paddingHorizontal: 16, paddingVertical: 8, gap: 8},
  filterChip: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff'},
  filterChipActive: {backgroundColor: '#1a237e', borderColor: '#1a237e'},
  filterChipText: {fontSize: 12, color: '#374151', fontWeight: '600'},
  filterChipTextActive: {color: '#fff'},
  content: {flex: 1, padding: 16},
  loadingBox: {alignItems: 'center', padding: 40},
  emptyBox: {alignItems: 'center', padding: 60, gap: 12},
  emptyText: {fontSize: 15, color: '#6b7280', fontWeight: '600'},

  // Admin stats
  adminStats: {flexDirection: 'row', gap: 8, marginBottom: 14},
  adminStatBox: {flex: 1, alignItems: 'center', padding: 10, borderRadius: 12},
  adminStatNum: {fontSize: 20, fontWeight: '900'},
  adminStatLabel: {fontSize: 10, color: '#6b7280', fontWeight: '600', marginTop: 2},

  leaveCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  leaveHeader: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8},
  leaveIconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f4ff',
    alignItems: 'center', justifyContent: 'center',
  },
  leaveName: {fontSize: 14, fontWeight: '700', color: '#111827'},
  leaveTypeText: {fontSize: 12, color: '#6b7280', fontWeight: '600'},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  statusBadgeText: {fontSize: 11, fontWeight: '700'},
  leaveDates: {flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center'},
  dateItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  dateText: {fontSize: 12, color: '#4b5563', fontWeight: '500'},
  daysBadge: {backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  daysText: {fontSize: 11, fontWeight: '700', color: '#3b82f6'},
  leaveReason: {fontSize: 13, color: '#374151', lineHeight: 20},
  reviewNotesBox: {marginTop: 8, backgroundColor: '#f9fafb', borderRadius: 8, padding: 10},
  reviewNotesLabel: {fontSize: 11, color: '#6b7280', fontWeight: '700', marginBottom: 2},
  reviewNotesText: {fontSize: 12, color: '#374151'},
  reviewHint: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'center'},
  reviewHintText: {fontSize: 12, color: '#1a237e', fontWeight: '600'},

  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  modalTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  inputLabel: {fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12},
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  leaveTypeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  leaveTypeChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb'},
  leaveTypeChipActive: {backgroundColor: '#1a237e', borderColor: '#1a237e'},
  leaveTypeChipText: {fontSize: 13, fontWeight: '600', color: '#374151'},
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, marginTop: 16,
  },
  submitBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},
  reviewInfo: {backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, gap: 4},
  reviewInfoLabel: {fontSize: 13, color: '#374151', fontWeight: '600'},
  reviewActions: {flexDirection: 'row', gap: 10, marginTop: 10},
  reviewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
  },
  reviewBtnText: {fontSize: 15, fontWeight: '700', color: '#fff'},
});

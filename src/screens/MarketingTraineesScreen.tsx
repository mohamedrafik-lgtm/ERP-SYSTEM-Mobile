import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import {
  MarketingEmployeeItem,
  MarketingEmployeesResponse,
  MarketingContactType,
  TraineeWithMarketingInfo,
  MarketingTraineesResponse,
} from '../types/marketing';
import SelectBox from '../components/SelectBox';

type ContactKind = 'first' | 'second';

interface ContactConfirmationState {
  traineeId: number;
  traineeName: string;
  contactType: ContactKind;
  employeeId: number | null;
  employeeName: string;
  commissionAmount: string;
  commissionDescription: string;
}

const MarketingTraineesScreen = ({ navigation }: any) => {
  const [employees, setEmployees] = useState<MarketingEmployeesResponse>([]);
  const [trainees, setTrainees] = useState<TraineeWithMarketingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [assigningTraineeId, setAssigningTraineeId] = useState<number | null>(null);
  const [contactConfirmation, setContactConfirmation] = useState<ContactConfirmationState | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  const getEmployeeNameById = (employeeId: number | null): string => {
    if (!employeeId) return 'إلغاء التخصيص';
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'موظف غير معروف';
  };

  const loadEmployees = useCallback(async () => {
    try {
      const response = await AuthService.getMarketingEmployees();
      setEmployees((response || []).filter(item => item?.isActive !== false));
    } catch (error) {
      console.error('Error fetching marketing employees:', error);
      setEmployees([]);
      Alert.alert('خطأ', 'فشل في تحميل قائمة موظفي التسويق');
    }
  }, []);

  const fetchData = useCallback(async (page: number = 1, search: string = '', selectedEmployee: string = 'all') => {
    try {
      setLoading(true);

      const response: MarketingTraineesResponse = await AuthService.getMarketingTrainees({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        employeeId: selectedEmployee !== 'all' && selectedEmployee !== 'unassigned'
          ? Number(selectedEmployee)
          : undefined,
        unassigned: selectedEmployee === 'unassigned',
      });

      const responseAsAny: any = response;
      const baseRows: TraineeWithMarketingInfo[] = Array.isArray(responseAsAny)
        ? responseAsAny
        : (responseAsAny?.data || []);

      const rowsWithContactPermissions = await Promise.all(
        baseRows.map(async trainee => {
          const [canModifyFirstContact, canModifySecondContact] = await Promise.all([
            AuthService.canModifyMarketingTraineeContact(trainee.id, 'FIRST_CONTACT'),
            AuthService.canModifyMarketingTraineeContact(trainee.id, 'SECOND_CONTACT'),
          ]);

          return {
            ...trainee,
            canModifyFirstContact,
            canModifySecondContact,
          };
        }),
      );

      const total = Array.isArray(responseAsAny)
        ? responseAsAny.length
        : Number(responseAsAny?.total || 0);

      const totalPages = Array.isArray(responseAsAny)
        ? Math.max(1, Math.ceil(responseAsAny.length / pagination.limit))
        : Number(responseAsAny?.totalPages || 1);

      const pageNumber = Array.isArray(responseAsAny)
        ? page
        : Number(responseAsAny?.page || page);

      setPagination({
        page: pageNumber,
        limit: pagination.limit,
        total,
        totalPages,
      });
      setTrainees(rowsWithContactPermissions);
    } catch (error) {
      console.error('Error fetching marketing trainees:', error);
      setTrainees([]);
      Alert.alert('خطأ', 'فشل في تحميل بيانات المتدربين');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    loadEmployees();
    fetchData(1, '', employeeFilter);
  }, [fetchData, loadEmployees]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData(1, searchText, employeeFilter);
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [fetchData, searchText, employeeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadEmployees(),
      fetchData(1, searchText, employeeFilter),
    ]);
    setRefreshing(false);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) {
      return;
    }

    fetchData(nextPage, searchText, employeeFilter);
  };

  const employeeFilterItems = [
    { value: 'all', label: 'جميع الموظفين' },
    { value: 'unassigned', label: 'لا يوجد تواصل أول' },
    ...employees.map((employee: MarketingEmployeeItem) => ({ value: String(employee.id), label: employee.name })),
  ];

  const employeeAssignItems = [
    { value: 'unassigned', label: 'غير محدد' },
    ...employees.map((employee: MarketingEmployeeItem) => ({ value: String(employee.id), label: employee.name })),
  ];

  const openContactConfirmation = (
    trainee: TraineeWithMarketingInfo,
    contactType: ContactKind,
    employeeId: number | null,
  ) => {
    if (
      contactType === 'first' &&
      trainee.firstContactEmployeeId != null &&
      employeeId !== null &&
      !trainee.canModifyFirstContact
    ) {
      Alert.alert('غير مسموح', 'لا يمكن تعديل التواصل الأول لأنه تم صرف العمولة مسبقاً');
      return;
    }

    if (
      contactType === 'second' &&
      trainee.secondContactEmployeeId != null &&
      employeeId !== null &&
      !trainee.canModifySecondContact
    ) {
      Alert.alert('غير مسموح', 'لا يمكن تعديل التواصل الثاني لأنه تم صرف العمولة مسبقاً');
      return;
    }

    const contactTypeText = contactType === 'first' ? 'التواصل الأول' : 'التواصل الثاني';
    setContactConfirmation({
      traineeId: trainee.id,
      traineeName: trainee.nameAr,
      contactType,
      employeeId,
      employeeName: getEmployeeNameById(employeeId),
      commissionAmount: employeeId ? '100' : '0',
      commissionDescription: employeeId ? `عمولة ${contactTypeText} للمتدرب ${trainee.nameAr}` : '',
    });
  };

  const handleApplyContactUpdate = async () => {
    if (!contactConfirmation) return;

    const amount = Number(contactConfirmation.commissionAmount || '0');
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('تنبيه', 'قيمة العمولة غير صحيحة');
      return;
    }

    const payload = contactConfirmation.contactType === 'first'
      ? { firstContactEmployeeId: contactConfirmation.employeeId }
      : { secondContactEmployeeId: contactConfirmation.employeeId };

    try {
      setAssigningTraineeId(contactConfirmation.traineeId);

      await AuthService.updateMarketingTraineeContact(contactConfirmation.traineeId, payload);

      if (contactConfirmation.employeeId && amount > 0) {
        try {
          await AuthService.createMarketingCommission({
            marketingEmployeeId: contactConfirmation.employeeId,
            traineeId: contactConfirmation.traineeId,
            type: (contactConfirmation.contactType === 'first'
              ? 'FIRST_CONTACT'
              : 'SECOND_CONTACT') as MarketingContactType,
            amount,
            description: contactConfirmation.commissionDescription,
          });
          Alert.alert('تم', 'تم تحديث التواصل وإنشاء العمولة بنجاح');
        } catch (commissionError: any) {
          const message = commissionError?.message || '';
          if (message.includes('توجد عمولة')) {
            Alert.alert('تم جزئياً', `تم تحديث التواصل بنجاح، لكن ${message}`);
          } else {
            Alert.alert('تم جزئياً', 'تم تحديث التواصل بنجاح، لكن فشل إنشاء العمولة');
          }
        }
      } else if (contactConfirmation.employeeId && amount === 0) {
        Alert.alert('تم', 'تم تحديث التواصل بنجاح، ولم تُنشأ عمولة لأن القيمة صفر');
      } else {
        Alert.alert('تم', 'تم تحديث التواصل بنجاح');
      }

      setContactConfirmation(null);
      await fetchData(pagination.page, searchText, employeeFilter);
    } catch (error: any) {
      console.error('Error updating trainee contact:', error);
      Alert.alert('خطأ', error?.message || 'فشل تحديث التواصل');
    } finally {
      setAssigningTraineeId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="MarketingTrainees" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Icon name="people" size={24} color="#1a237e" />
            <Text style={styles.headerTitle}>التقديمات</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#1a237e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="البحث بالاسم أو الهاتف أو الرقم القومي..."
                textAlign="right"
              />
              <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            </View>
          </View>

          {/* Employee Filter */}
          <View style={styles.filterContainer}>
            <SelectBox
              label="فلترة بالتواصل الأول"
              items={employeeFilterItems}
              selectedValue={employeeFilter}
              onValueChange={(value) => setEmployeeFilter(String(value))}
              placeholder="جميع الموظفين"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{pagination.total}</Text>
            <Text style={styles.statLabel}>إجمالي المتدربين</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="list" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{trainees.length}</Text>
            <Text style={styles.statLabel}>الصفحة الحالية</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="pages" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{pagination.totalPages}</Text>
            <Text style={styles.statLabel}>عدد الصفحات</Text>
          </View>
        </View>

        {/* Trainees List */}
        <View style={styles.traineesSection}>
          {loading && pagination.page === 1 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل التقديمات...</Text>
            </View>
          ) : trainees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptyDescription}>
                {searchText || employeeFilter !== 'all'
                  ? 'لم يتم العثور على نتائج مطابقة للفلاتر الحالية'
                  : 'لا توجد طلبات تسويق متاحة حالياً'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.traineesList}>
              {trainees.map((trainee) => (
                <View
                  key={trainee.id}
                  style={styles.traineeCard}
                >
                  <View style={styles.traineeHeader}>
                    <View style={styles.traineeHeaderInfo}>
                      <Text style={styles.traineeName}>{trainee.nameAr}</Text>
                      <Text style={styles.traineeMeta}>{trainee.phone} • {trainee.nationalId}</Text>
                    </View>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeLabel}>المدفوع</Text>
                      <Text style={styles.paidBadgeValue}>{formatAmount(Number(trainee.totalPaidAmount || 0))}</Text>
                    </View>
                  </View>

                  <View style={styles.programTagWrap}>
                    <Text style={styles.programTag}>{trainee.program?.nameAr || 'بدون برنامج'}</Text>
                  </View>

                  <View style={styles.contactSection}>
                    <View style={styles.contactTitleRow}>
                      <Text style={styles.contactTitle}>التواصل الأول</Text>
                      {trainee.firstContactEmployeeId != null && !trainee.canModifyFirstContact ? (
                        <View style={styles.lockBadge}>
                          <Icon name="lock" size={13} color="#dc2626" />
                          <Text style={styles.lockBadgeText}>تم صرف العمولة</Text>
                        </View>
                      ) : null}
                    </View>
                    <SelectBox
                      label=""
                      items={employeeAssignItems}
                      selectedValue={trainee.firstContactEmployeeId != null ? String(trainee.firstContactEmployeeId) : 'unassigned'}
                      onValueChange={(value) => {
                        const valueText = String(value);
                        const employeeId = valueText === 'unassigned' ? null : Number(valueText);
                        if (employeeId !== null && Number.isNaN(employeeId)) return;
                        openContactConfirmation(trainee, 'first', employeeId);
                      }}
                      placeholder="اختر الموظف"
                      disabled={
                        assigningTraineeId === trainee.id ||
                        (trainee.firstContactEmployeeId != null && !trainee.canModifyFirstContact)
                      }
                    />
                  </View>

                  <View style={styles.contactSection}>
                    <View style={styles.contactTitleRow}>
                      <Text style={styles.contactTitle}>التواصل الثاني</Text>
                      {trainee.secondContactEmployeeId != null && !trainee.canModifySecondContact ? (
                        <View style={styles.lockBadge}>
                          <Icon name="lock" size={13} color="#dc2626" />
                          <Text style={styles.lockBadgeText}>تم صرف العمولة</Text>
                        </View>
                      ) : null}
                    </View>
                    <SelectBox
                      label=""
                      items={employeeAssignItems}
                      selectedValue={trainee.secondContactEmployeeId != null ? String(trainee.secondContactEmployeeId) : 'unassigned'}
                      onValueChange={(value) => {
                        const valueText = String(value);
                        const employeeId = valueText === 'unassigned' ? null : Number(valueText);
                        if (employeeId !== null && Number.isNaN(employeeId)) return;
                        openContactConfirmation(trainee, 'second', employeeId);
                      }}
                      placeholder="اختر الموظف"
                      disabled={
                        assigningTraineeId === trainee.id ||
                        (trainee.secondContactEmployeeId != null && !trainee.canModifySecondContact)
                      }
                    />
                  </View>

                  {assigningTraineeId === trainee.id ? (
                    <View style={styles.updatingRow}>
                      <ActivityIndicator size="small" color="#1a237e" />
                      <Text style={styles.updatingText}>جاري حفظ التحديث...</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Pagination Info */}
          {pagination.totalPages > 1 && (
            <View style={styles.paginationInfo}>
              <TouchableOpacity
                style={[styles.pageButton, (loading || pagination.page <= 1) && styles.pageButtonDisabled]}
                onPress={() => handlePageChange(pagination.page - 1)}
                disabled={loading || pagination.page <= 1}
              >
                <Icon name="chevron-left" size={20} color={loading || pagination.page <= 1 ? '#94a3b8' : '#1a237e'} />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                صفحة {pagination.page} من {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageButton, (loading || pagination.page >= pagination.totalPages) && styles.pageButtonDisabled]}
                onPress={() => handlePageChange(pagination.page + 1)}
                disabled={loading || pagination.page >= pagination.totalPages}
              >
                <Icon name="chevron-right" size={20} color={loading || pagination.page >= pagination.totalPages ? '#94a3b8' : '#1a237e'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!contactConfirmation}
        transparent
        animationType="slide"
        onRequestClose={() => setContactConfirmation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                تأكيد {contactConfirmation?.contactType === 'first' ? 'التواصل الأول' : 'التواصل الثاني'}
              </Text>
              <TouchableOpacity onPress={() => setContactConfirmation(null)}>
                <Icon name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {contactConfirmation ? (
              <>
                <View style={styles.warningBox}>
                  <Icon name="warning" size={18} color="#dc2626" />
                  <Text style={styles.warningText}>
                    هذا الإجراء نهائي وقد لا تتمكن من التعديل لاحقاً بعد صرف العمولة.
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>المتدرب:</Text>
                  <Text style={styles.modalInfoValue}>{contactConfirmation.traineeName}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>الموظف:</Text>
                  <Text style={styles.modalInfoValue}>{contactConfirmation.employeeName}</Text>
                </View>

                {contactConfirmation.employeeId ? (
                  <>
                    <Text style={styles.modalLabel}>قيمة العمولة (ج.م)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="decimal-pad"
                      value={contactConfirmation.commissionAmount}
                      onChangeText={(value) =>
                        setContactConfirmation({
                          ...contactConfirmation,
                          commissionAmount: value,
                        })
                      }
                      placeholder="0"
                    />

                    <Text style={styles.modalLabel}>وصف العمولة</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={contactConfirmation.commissionDescription}
                      onChangeText={(value) =>
                        setContactConfirmation({
                          ...contactConfirmation,
                          commissionDescription: value,
                        })
                      }
                      placeholder="اكتب وصف العمولة"
                    />
                  </>
                ) : (
                  <Text style={styles.unassignHint}>سيتم إلغاء التخصيص الحالي لهذا التواصل.</Text>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setContactConfirmation(null)}
                    disabled={assigningTraineeId === contactConfirmation.traineeId}
                  >
                    <Text style={styles.cancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleApplyContactUpdate}
                    disabled={assigningTraineeId === contactConfirmation.traineeId}
                  >
                    {assigningTraineeId === contactConfirmation.traineeId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>تأكيد</Text>
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
    backgroundColor: '#f4f6fa',
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filtersSection: {
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
  },
  searchIcon: {
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  traineesSection: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  traineesList: {
    flex: 1,
  },
  traineeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  traineeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  traineeHeaderInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  traineeMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    minWidth: 100,
    alignItems: 'center',
  },
  paidBadgeLabel: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '700',
  },
  paidBadgeValue: {
    marginTop: 2,
    fontSize: 11,
    color: '#065f46',
    fontWeight: '800',
  },
  programTagWrap: {
    marginBottom: 10,
  },
  programTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  contactSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  contactTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  updatingRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updatingText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  paginationInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  paginationText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '700',
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  pageButtonDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#991b1b',
    fontWeight: '600',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  modalInfoValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '800',
  },
  modalLabel: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  unassignHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 8,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2563eb',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
});

export default MarketingTraineesScreen;

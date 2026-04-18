import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useFocusEffect } from '@react-navigation/native';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import usePermissions from '../hooks/usePermissions';
import AuthService from '../services/AuthService';
import { FeeType, ITraineeFee, TraineeFeeReportType } from '../types/student';

interface Program {
  id: number;
  nameAr: string;
}

interface TraineeLite {
  id: number;
  nameAr: string;
  nationalId?: string;
  phone?: string;
}

interface FeesScreenProps {
  navigation: any;
}

type StatusFilter = 'ALL' | 'APPLIED' | 'NOT_APPLIED';

const FeesScreen = ({ navigation }: FeesScreenProps) => {
  const [fees, setFees] = useState<ITraineeFee[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingFeeId, setProcessingFeeId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FeeType | 'ALL'>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedFee, setSelectedFee] = useState<ITraineeFee | null>(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [traineesLoading, setTraineesLoading] = useState(false);
  const [trainees, setTrainees] = useState<TraineeLite[]>([]);
  const [selectedTrainees, setSelectedTrainees] = useState<number[]>([]);
  const [traineeSearch, setTraineeSearch] = useState('');
  const [applyDescription, setApplyDescription] = useState('');

  const [reportFee, setReportFee] = useState<ITraineeFee | null>(null);

  const { hasPermission, hasScreenAction } = usePermissions();
  const canManageFees =
    hasScreenAction('Fees', 'manage') || hasPermission('dashboard.financial', 'manage');
  const canViewReports =
    hasScreenAction('Fees', 'reports') || hasPermission('dashboard.financial.reports', 'view');

  const fetchFees = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [feesData, programsData] = await Promise.all([
        AuthService.getAllTraineeFees(),
        AuthService.getAllPrograms(),
      ]);

      setFees(Array.isArray(feesData) ? feesData : []);
      setPrograms(Array.isArray(programsData) ? programsData : []);
    } catch (error) {
      console.error('Error fetching fees:', error);
      Alert.alert('خطأ', 'فشل في جلب الرسوم. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFees();
    }, []),
  );

  const availableYears = useMemo(
    () => Array.from(new Set(fees.map(fee => fee.academicYear))).sort(),
    [fees],
  );

  const filteredFees = useMemo(() => {
    return fees.filter(fee => {
      const lowered = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !lowered ||
        fee.name.toLowerCase().includes(lowered) ||
        fee.program?.nameAr?.toLowerCase().includes(lowered);

      const matchesType = filterType === 'ALL' || fee.type === filterType;
      const matchesProgram = filterProgram === 'ALL' || String(fee.programId) === filterProgram;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'APPLIED' && fee.isApplied) ||
        (filterStatus === 'NOT_APPLIED' && !fee.isApplied);
      const matchesYear = filterYear === 'ALL' || fee.academicYear === filterYear;

      return matchesSearch && matchesType && matchesProgram && matchesStatus && matchesYear;
    });
  }, [fees, searchQuery, filterType, filterProgram, filterStatus, filterYear]);

  const summary = useMemo(() => {
    return {
      totalFees: fees.length,
      appliedFees: fees.filter(fee => fee.isApplied).length,
      totalAmount: fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0),
    };
  }, [fees]);

  const filteredTrainees = useMemo(() => {
    const q = traineeSearch.trim().toLowerCase();
    if (!q) return trainees;
    return trainees.filter(trainee => {
      return (
        trainee.nameAr?.toLowerCase().includes(q) ||
        trainee.nationalId?.includes(q) ||
        trainee.phone?.includes(q)
      );
    });
  }, [trainees, traineeSearch]);

  const normalizeTrainees = (raw: any): TraineeLite[] => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.data?.data)) return raw.data.data;
    return [];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFees(false);
  };

  const getFeeTypeLabel = (type: FeeType) => {
    switch (type) {
      case 'TUITION':
        return 'رسوم دراسية';
      case 'SERVICES':
        return 'رسوم خدمات';
      case 'TRAINING':
        return 'رسوم تدريبية';
      case 'ADDITIONAL':
        return 'رسوم إضافية';
      default:
        return 'غير محدد';
    }
  };

  const getFeeTypeColor = (type: FeeType) => {
    switch (type) {
      case 'TUITION':
        return '#1a237e';
      case 'SERVICES':
        return '#059669';
      case 'TRAINING':
        return '#dc2626';
      case 'ADDITIONAL':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  const openApplyModal = async (fee: ITraineeFee) => {
    if (fee.isApplied && !fee.allowMultipleApply) {
      Alert.alert('تنبيه', 'هذه الرسوم مطبقة بالفعل ولا تسمح بإعادة التطبيق');
      return;
    }

    try {
      setSelectedFee(fee);
      setApplyModalVisible(true);
      setTraineeSearch('');
      setApplyDescription('');
      setSelectedTrainees([]);
      setTraineesLoading(true);

      const traineesData = await AuthService.getTraineesByProgram(fee.programId);
      setTrainees(normalizeTrainees(traineesData));
    } catch (error) {
      console.error('Error fetching trainees for apply:', error);
      Alert.alert('خطأ', 'تعذر تحميل المتدربين لهذا البرنامج');
    } finally {
      setTraineesLoading(false);
    }
  };

  const toggleSelectAllTrainees = () => {
    if (selectedTrainees.length === trainees.length) {
      setSelectedTrainees([]);
      return;
    }
    setSelectedTrainees(trainees.map(trainee => trainee.id));
  };

  const toggleTrainee = (traineeId: number) => {
    setSelectedTrainees(prev =>
      prev.includes(traineeId) ? prev.filter(id => id !== traineeId) : [...prev, traineeId],
    );
  };

  const handleApplyFee = async () => {
    if (!selectedFee) return;

    if (selectedTrainees.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار متدرب واحد على الأقل');
      return;
    }

    try {
      setProcessingFeeId(selectedFee.id);
      await AuthService.applyTraineeFee(selectedFee.id, {
        traineeIds: selectedTrainees,
        description: applyDescription.trim() || undefined,
      });

      Alert.alert('نجح', 'تم تطبيق الرسوم بنجاح');
      setApplyModalVisible(false);
      setSelectedFee(null);
      setSelectedTrainees([]);
      setTrainees([]);
      await fetchFees(false);
    } catch (error) {
      console.error('Error applying fee:', error);
      Alert.alert('خطأ', 'فشل في تطبيق الرسوم. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
    } finally {
      setProcessingFeeId(null);
    }
  };

  const handleDeleteFee = (fee: ITraineeFee) => {
    if (fee.isApplied) {
      Alert.alert('تنبيه', 'لا يمكن حذف الرسوم المطبقة');
      return;
    }

    Alert.alert('تأكيد الحذف', `هل تريد حذف الرسوم "${fee.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            setProcessingFeeId(fee.id);
            await AuthService.deleteTraineeFee(fee.id);
            Alert.alert('نجح', 'تم حذف الرسوم بنجاح');
            await fetchFees(false);
          } catch (error) {
            console.error('Error deleting fee:', error);
            Alert.alert('خطأ', 'فشل في حذف الرسوم');
          } finally {
            setProcessingFeeId(null);
          }
        },
      },
    ]);
  };

  const openReport = (reportType: TraineeFeeReportType) => {
    if (!reportFee) return;

    navigation.navigate('TraineeFeeReport', {
      feeId: reportFee.id,
      feeName: reportFee.name,
      reportType,
    });
    setReportFee(null);
  };

  const renderFeeCard = (fee: ITraineeFee) => {
    const statusColor = fee.isApplied ? '#059669' : '#dc2626';

    return (
      <View key={fee.id} style={styles.feeCard}>
        <View style={styles.feeHeader}>
          <View style={styles.feeTitleContainer}>
            <Text style={styles.feeName}>{fee.name}</Text>
            <Text style={styles.feeCode}>#{fee.id}</Text>
            <View style={[styles.feeTypeBadge, { backgroundColor: getFeeTypeColor(fee.type) }]}>
              <Text style={styles.feeTypeText}>{getFeeTypeLabel(fee.type)}</Text>
            </View>
          </View>
          <Text style={styles.feeAmount}>{Number(fee.amount || 0).toLocaleString('ar-EG')} {fee.safe?.currency || 'EGP'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="school" size={15} color="#64748b" />
          <Text style={styles.infoText}>{fee.program?.nameAr || 'غير محدد'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="account-balance" size={15} color="#64748b" />
          <Text style={styles.infoText}>{fee.safe?.name || 'غير محدد'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="calendar-today" size={15} color="#64748b" />
          <Text style={styles.infoText}>{fee.academicYear}</Text>
        </View>
        {fee.type !== 'TUITION' ? (
          <View style={styles.infoRow}>
            <Icon name="payments" size={15} color="#64748b" />
            <Text style={styles.infoText}>
              {fee.allowPartialPayment ? 'السداد الجزئي مسموح' : 'سداد كامل فقط'}
            </Text>
          </View>
        ) : null}
        {fee.refundDeadlineEnabled && fee.refundDeadlineAt ? (
          <View style={styles.infoRow}>
            <Icon name="event-busy" size={15} color="#64748b" />
            <Text style={styles.infoText}>آخر موعد للاسترداد: {fee.refundDeadlineAt.split('T')[0]}</Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{fee.isApplied ? 'مطبقة' : 'غير مطبقة'}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(fee.createdAt).toLocaleDateString('ar-EG')}</Text>
        </View>

        <View style={styles.actionsRow}>
          {canViewReports ? (
            <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={() => setReportFee(fee)}>
              <Icon name="bar-chart" size={15} color="#fff" />
              <Text style={styles.actionText}>تقرير</Text>
            </TouchableOpacity>
          ) : null}

          {canManageFees ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton, fee.isApplied && styles.buttonDisabled]}
              onPress={() => {
                if (fee.isApplied) {
                  Alert.alert('تنبيه', 'لا يمكن تعديل الرسوم المطبقة');
                  return;
                }
                navigation.navigate('AddFeeScreen', { isEdit: true, feeId: fee.id, fee });
              }}
            >
              <Icon name="edit" size={15} color="#fff" />
              <Text style={styles.actionText}>تعديل</Text>
            </TouchableOpacity>
          ) : null}

          {canManageFees ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.applyButton,
                fee.isApplied && !fee.allowMultipleApply && styles.buttonDisabled,
              ]}
              onPress={() => openApplyModal(fee)}
            >
              <Icon name="group-add" size={15} color="#fff" />
              <Text style={styles.actionText}>{fee.isApplied && fee.allowMultipleApply ? 'إعادة تطبيق' : 'تطبيق'}</Text>
            </TouchableOpacity>
          ) : null}

          {canManageFees ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton, fee.isApplied && styles.buttonDisabled]}
              onPress={() => handleDeleteFee(fee)}
            >
              <Icon name="delete" size={15} color="#fff" />
              <Text style={styles.actionText}>حذف</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {processingFeeId === fee.id ? (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color="#1a237e" />
            <Text style={styles.processingText}>جاري تنفيذ العملية...</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل الرسوم...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Fees" />

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>رسوم المتدربين</Text>
          <Text style={styles.headerSubtitle}>إدارة الرسوم المالية</Text>
        </View>

        {canManageFees ? (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddFeeScreen')}>
            <Icon name="add" size={20} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#dbeafe' }]}> 
          <Text style={styles.summaryValue}>{summary.totalFees}</Text>
          <Text style={styles.summaryLabel}>إجمالي الرسوم</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}> 
          <Text style={styles.summaryValue}>{summary.appliedFees}</Text>
          <Text style={styles.summaryLabel}>رسوم مطبقة</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ede9fe' }]}> 
          <Text style={styles.summaryValue}>{summary.totalAmount.toLocaleString('ar-EG')}</Text>
          <Text style={styles.summaryLabel}>إجمالي المبالغ</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="بحث بالاسم أو البرنامج"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(prev => !prev)}>
          <Icon name={showFilters ? 'expand-less' : 'filter-list'} size={18} color="#1a237e" />
          <Text style={styles.filterButtonText}>الفلاتر</Text>
        </TouchableOpacity>
      </View>

      {showFilters ? (
        <View style={styles.filtersPanel}>
          <SelectBox
            label="نوع الرسوم"
            selectedValue={filterType}
            onValueChange={setFilterType}
            items={[
              { value: 'ALL', label: 'الكل' },
              { value: 'TUITION', label: 'رسوم دراسية' },
              { value: 'SERVICES', label: 'خدمات' },
              { value: 'TRAINING', label: 'تدريب' },
              { value: 'ADDITIONAL', label: 'رسوم إضافية' },
            ]}
            placeholder="اختر النوع"
          />

          <SelectBox
            label="البرنامج"
            selectedValue={filterProgram}
            onValueChange={setFilterProgram}
            items={[
              { value: 'ALL', label: 'الكل' },
              ...programs.map(program => ({ value: String(program.id), label: program.nameAr })),
            ]}
            placeholder="اختر البرنامج"
          />

          <SelectBox
            label="الحالة"
            selectedValue={filterStatus}
            onValueChange={setFilterStatus}
            items={[
              { value: 'ALL', label: 'الكل' },
              { value: 'APPLIED', label: 'مطبقة' },
              { value: 'NOT_APPLIED', label: 'غير مطبقة' },
            ]}
            placeholder="اختر الحالة"
          />

          <SelectBox
            label="العام الدراسي"
            selectedValue={filterYear}
            onValueChange={setFilterYear}
            items={[
              { value: 'ALL', label: 'الكل' },
              ...availableYears.map(year => ({ value: year, label: year })),
            ]}
            placeholder="اختر العام"
          />
        </View>
      ) : null}

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {filteredFees.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={72} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد رسوم مطابقة</Text>
            <Text style={styles.emptySubtitle}>
              {fees.length === 0 ? 'لم يتم إنشاء أي رسوم بعد' : 'قم بتعديل الفلاتر أو البحث'}
            </Text>
          </View>
        ) : (
          <View style={styles.cardsWrapper}>{filteredFees.map(renderFeeCard)}</View>
        )}
      </ScrollView>

      <Modal visible={applyModalVisible} transparent animationType="slide" onRequestClose={() => setApplyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تطبيق الرسوم على المتدربين</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Icon name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedFee ? (
              <Text style={styles.modalSubtitle}>
                رسوم "{selectedFee.name}" - برنامج "{selectedFee.program?.nameAr || 'غير محدد'}"
              </Text>
            ) : null}

            <View style={styles.modalSearchBox}>
              <Icon name="search" size={18} color="#64748b" />
              <TextInput
                value={traineeSearch}
                onChangeText={setTraineeSearch}
                placeholder="ابحث في المتدربين"
                placeholderTextColor="#94a3b8"
                style={styles.modalSearchInput}
              />
            </View>

            <View style={styles.selectAllRow}>
              <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAllTrainees}>
                <Icon
                  name={selectedTrainees.length === trainees.length && trainees.length > 0 ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color="#1a237e"
                />
                <Text style={styles.selectAllText}>تحديد الكل</Text>
              </TouchableOpacity>
              <Text style={styles.countText}>{filteredTrainees.length} من {trainees.length}</Text>
            </View>

            {traineesLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.modalLoadingText}>جاري تحميل المتدربين...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredTrainees}
                keyExtractor={item => String(item.id)}
                style={styles.traineesList}
                renderItem={({ item }) => {
                  const checked = selectedTrainees.includes(item.id);
                  return (
                    <TouchableOpacity style={styles.traineeRow} onPress={() => toggleTrainee(item.id)}>
                      <Icon
                        name={checked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={checked ? '#059669' : '#9ca3af'}
                      />
                      <View style={styles.traineeTextWrap}>
                        <Text style={styles.traineeName}>{item.nameAr}</Text>
                        <Text style={styles.traineeMeta}>{item.nationalId || '-'} • {item.phone || '-'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyTraineesBox}>
                    <Text style={styles.emptyTraineesText}>لا توجد نتائج</Text>
                  </View>
                }
              />
            )}

            <TextInput
              value={applyDescription}
              onChangeText={setApplyDescription}
              placeholder="ملاحظات (اختياري)"
              placeholderTextColor="#9ca3af"
              style={styles.notesInput}
              textAlign="right"
            />

            <TouchableOpacity
              style={[
                styles.applyConfirmButton,
                (selectedTrainees.length === 0 || processingFeeId === selectedFee?.id) && styles.buttonDisabled,
              ]}
              onPress={handleApplyFee}
              disabled={selectedTrainees.length === 0 || processingFeeId === selectedFee?.id}
            >
              {processingFeeId === selectedFee?.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="done-all" size={18} color="#fff" />
                  <Text style={styles.applyConfirmText}>تطبيق الرسوم</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(reportFee)} transparent animationType="fade" onRequestClose={() => setReportFee(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportCard}>
            <Text style={styles.modalTitle}>اختر نوع التقرير</Text>

            <TouchableOpacity style={styles.reportOption} onPress={() => openReport('paid')}>
              <Icon name="check-circle" size={18} color="#16a34a" />
              <Text style={styles.reportOptionText}>المسددين للرسم</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => openReport('unpaid')}>
              <Icon name="error" size={18} color="#dc2626" />
              <Text style={styles.reportOptionText}>الغير مسددين للرسم</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => openReport('paid-all-previous')}>
              <Icon name="task-alt" size={18} color="#2563eb" />
              <Text style={styles.reportOptionText}>المسددين للرسم وكل الرسوم السابقة</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.reportOption} onPress={() => openReport('unpaid-any-previous')}>
              <Icon name="warning" size={18} color="#f59e0b" />
              <Text style={styles.reportOptionText}>الغير مسددين للرسم الحالي وأي رسم سابق</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeReportButton} onPress={() => setReportFee(null)}>
              <Text style={styles.closeReportText}>إلغاء</Text>
            </TouchableOpacity>
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
    marginHorizontal: 10,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
  },
  summaryRow: {
    marginHorizontal: 10,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
  },
  searchRow: {
    marginHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    color: '#1a237e',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersPanel: {
    marginHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  listContainer: {
    flex: 1,
  },
  cardsWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  feeTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  feeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  feeCode: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
  },
  feeTypeBadge: {
    marginTop: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  feeTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    color: '#475569',
    fontSize: 13,
  },
  footerRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportButton: {
    backgroundColor: '#2563eb',
  },
  editButton: {
    backgroundColor: '#d97706',
  },
  applyButton: {
    backgroundColor: '#059669',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  processingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  processingText: {
    color: '#475569',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
    maxHeight: '85%',
  },
  reportCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    marginTop: 7,
    marginBottom: 10,
    color: '#475569',
    fontSize: 12,
  },
  modalSearchBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSearchInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#0f172a',
  },
  selectAllRow: {
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    color: '#1a237e',
    fontWeight: '600',
  },
  countText: {
    color: '#64748b',
    fontSize: 12,
  },
  modalLoadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalLoadingText: {
    marginTop: 8,
    color: '#64748b',
  },
  traineesList: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    maxHeight: 260,
    marginBottom: 10,
  },
  traineeRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traineeTextWrap: {
    flex: 1,
  },
  traineeName: {
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
  },
  traineeMeta: {
    marginTop: 1,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
  },
  emptyTraineesBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyTraineesText: {
    color: '#64748b',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0f172a',
    marginBottom: 10,
  },
  applyConfirmButton: {
    backgroundColor: '#1a237e',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  applyConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
  reportOption: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  reportOptionText: {
    flex: 1,
    textAlign: 'right',
    color: '#1f2937',
    fontWeight: '500',
  },
  closeReportButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeReportText: {
    color: '#6b7280',
    fontWeight: '600',
  },
});

export default FeesScreen;

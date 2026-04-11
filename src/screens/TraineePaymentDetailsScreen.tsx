import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import {
  AutoPaymentRequest,
  ISafe,
  PaymentStatus,
  TraineePaymentByTraineeResponse,
} from '../types/student';

interface TraineePaymentDetailsScreenProps {
  route: {
    params: {
      traineeId: number;
      traineeName?: string;
    };
  };
  navigation: any;
}

const getStatusLabel = (status: PaymentStatus) => {
  switch (status) {
    case 'PAID':
      return 'مدفوع';
    case 'PARTIALLY_PAID':
      return 'مدفوع جزئيا';
    case 'PENDING':
      return 'غير مدفوع';
    case 'CANCELLED':
      return 'ملغي';
    default:
      return 'غير محدد';
  }
};

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'PAID':
      return {text: '#166534', background: '#dcfce7'};
    case 'PARTIALLY_PAID':
      return {text: '#92400e', background: '#fef3c7'};
    case 'PENDING':
      return {text: '#991b1b', background: '#fee2e2'};
    case 'CANCELLED':
      return {text: '#374151', background: '#f3f4f6'};
    default:
      return {text: '#374151', background: '#f3f4f6'};
  }
};

const getFeeTypeLabel = (type: string) => {
  switch (type) {
    case 'TUITION':
      return 'رسوم دراسية';
    case 'SERVICES':
      return 'رسوم خدمات';
    case 'TRAINING':
      return 'رسوم تدريب';
    case 'ADDITIONAL':
      return 'رسوم إضافية';
    default:
      return type || 'غير محدد';
  }
};

const getEnrollmentTypeLabel = (type: string) => {
  switch (type) {
    case 'REGULAR':
      return 'انتظام';
    case 'DISTANCE':
      return 'انتساب';
    case 'ONLINE':
      return 'أونلاين';
    default:
      return type || 'غير محدد';
  }
};

const formatMoney = (value: number) => `${Math.round(value || 0).toLocaleString('ar-EG')} ج.م`;

const TraineePaymentDetailsScreen = ({route, navigation}: TraineePaymentDetailsScreenProps) => {
  const {traineeId, traineeName} = route.params;

  const [payments, setPayments] = useState<TraineePaymentByTraineeResponse[]>([]);
  const [safes, setSafes] = useState<ISafe[]>([]);
  const [trainee, setTrainee] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [showSmartPaymentModal, setShowSmartPaymentModal] = useState(false);
  const [showSpecificPaymentModal, setShowSpecificPaymentModal] = useState(false);

  const [smartAmount, setSmartAmount] = useState('');
  const [smartSafeId, setSmartSafeId] = useState('');
  const [smartNotes, setSmartNotes] = useState('');

  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [specificAmount, setSpecificAmount] = useState('');
  const [specificSafeId, setSpecificSafeId] = useState('');
  const [specificNotes, setSpecificNotes] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsData, safesData, traineeData] = await Promise.all([
        AuthService.getTraineePaymentsByTrainee(traineeId),
        AuthService.getAllSafes(),
        AuthService.getTraineeById(traineeId).catch(() => null),
      ]);

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setSafes(Array.isArray(safesData) ? safesData : []);

      if (traineeData) {
        setTrainee(traineeData);
      }
    } catch (error) {
      console.error('Error fetching trainee payment details:', error);
      Alert.alert('خطا', 'فشل في تحميل تفاصيل مدفوعات المتدرب');
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [traineeId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const sortedPayments = useMemo(() => {
    return [...payments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [payments]);

  const financialSummary = useMemo(() => {
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const paidAmount = payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentPercentage,
    };
  }, [payments]);

  const incomeSafes = useMemo(
    () => safes.filter(safe => safe.isActive && safe.category === 'INCOME'),
    [safes],
  );

  const additionalFees = useMemo(
    () =>
      sortedPayments.filter(
        payment => payment.status !== 'PAID' && payment.fee?.type !== 'TUITION',
      ),
    [sortedPayments],
  );

  const openSmartPayment = () => {
    setSmartAmount(financialSummary.remainingAmount > 0 ? String(financialSummary.remainingAmount) : '');
    setSmartSafeId('');
    setSmartNotes('');
    setShowSmartPaymentModal(true);
  };

  const openSpecificPayment = () => {
    const firstFee = additionalFees[0];
    setSelectedPaymentId(firstFee?.id ?? null);
    if (firstFee) {
      const remaining = Math.max(0, (firstFee.amount || 0) - (firstFee.paidAmount || 0));
      setSpecificAmount(String(remaining));
    } else {
      setSpecificAmount('');
    }
    setSpecificSafeId('');
    setSpecificNotes('');
    setShowSpecificPaymentModal(true);
  };

  const submitSmartPayment = async () => {
    const amount = parseFloat(smartAmount);

    if (!smartSafeId) {
      Alert.alert('خطا', 'يرجى اختيار خزينة الدخل');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('خطا', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amount > financialSummary.remainingAmount) {
      Alert.alert('خطا', 'المبلغ يتجاوز إجمالي المديونية المتبقية');
      return;
    }

    try {
      setProcessingPayment(true);

      const payload: AutoPaymentRequest = {
        traineeId,
        amount,
        safeId: smartSafeId,
        notes: smartNotes.trim() || undefined,
      };

      await AuthService.processAutoPayment(payload);

      Alert.alert('نجاح', 'تم تنفيذ الدفع الذكي بنجاح');
      setShowSmartPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Smart payment error:', error);
      Alert.alert('خطا', error?.message || 'فشل في تنفيذ الدفع الذكي');
    } finally {
      setProcessingPayment(false);
    }
  };

  const submitSpecificPayment = async () => {
    const amount = parseFloat(specificAmount);

    if (!selectedPaymentId) {
      Alert.alert('خطا', 'يرجى اختيار الرسم المراد سداده');
      return;
    }

    if (!specificSafeId) {
      Alert.alert('خطا', 'يرجى اختيار خزينة الدخل');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('خطا', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    const selectedPayment = additionalFees.find(payment => payment.id === selectedPaymentId);
    if (!selectedPayment) {
      Alert.alert('خطا', 'الرسم المحدد غير متاح');
      return;
    }

    const remaining = Math.max(0, (selectedPayment.amount || 0) - (selectedPayment.paidAmount || 0));
    if (amount > remaining) {
      Alert.alert('خطا', 'المبلغ يتجاوز المتبقي من الرسم المحدد');
      return;
    }

    try {
      setProcessingPayment(true);

      await AuthService.createTraineePayment({
        feeId: selectedPayment.fee.id,
        traineeId,
        amount,
        safeId: specificSafeId,
        notes: specificNotes.trim() || undefined,
      });

      Alert.alert('نجاح', 'تم تسجيل الدفعة بنجاح');
      setShowSpecificPaymentModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Specific payment error:', error);
      Alert.alert('خطا', error?.message || 'فشل في تسجيل الدفعة');
    } finally {
      setProcessingPayment(false);
    }
  };

  const showPrintUnavailable = () => {
    Alert.alert('تنبيه', 'طباعة إيصال المدفوعات متاحة حاليا في نسخة الويب فقط');
  };

  const traineeDisplayName = trainee?.nameAr || traineeName || `متدرب #${traineeId}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل المدفوعات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>مدفوعات المتدرب</Text>
            <Text style={styles.headerSubtitle}>{traineeDisplayName}</Text>
          </View>

          <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
            <Icon name="refresh" size={22} color="#1a237e" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          <View style={styles.traineeCard}>
            <Text style={styles.sectionTitle}>بيانات المتدرب</Text>
            <Text style={styles.traineeName}>{traineeDisplayName}</Text>
            <Text style={styles.traineeMeta}>الرقم القومي: {trainee?.nationalId || 'غير متوفر'}</Text>
            <Text style={styles.traineeMeta}>الهاتف: {trainee?.phone || 'غير متوفر'}</Text>
            <Text style={styles.traineeMeta}>البرنامج: {trainee?.program?.nameAr || 'غير محدد'}</Text>
            <Text style={styles.traineeMeta}>
              نوع التسجيل: {getEnrollmentTypeLabel(trainee?.enrollmentType)}
            </Text>
            <Text style={styles.traineeMeta}>السنة الأكاديمية: {trainee?.academicYear || 'غير محدد'}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>الملخص المالي</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>إجمالي الرسوم</Text>
              <Text style={styles.summaryValue}>{formatMoney(financialSummary.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المبلغ المدفوع</Text>
              <Text style={[styles.summaryValue, {color: '#166534'}]}>
                {formatMoney(financialSummary.paidAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المبلغ المتبقي</Text>
              <Text style={[styles.summaryValue, {color: '#b91c1c'}]}>
                {formatMoney(financialSummary.remainingAmount)}
              </Text>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${Math.max(0, Math.min(100, financialSummary.paymentPercentage))}%`},
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                نسبة السداد: {financialSummary.paymentPercentage.toFixed(1)}%
              </Text>
            </View>
          </View>

          {financialSummary.remainingAmount > 0 ? (
            <View style={styles.quickActionsCard}>
              <Text style={styles.sectionTitle}>إجراءات سريعة</Text>

              <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#16a34a'}]} onPress={openSmartPayment}>
                <Icon name="calculate" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>دفع رسوم أساسية (ذكي)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2563eb'}]} onPress={openSpecificPayment}>
                <Icon name="payments" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>دفع رسوم إضافية</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#475569'}]} onPress={showPrintUnavailable}>
                <Icon name="print" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>طباعة</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.feesCard}>
            <Text style={styles.sectionTitle}>تفاصيل الرسوم ({sortedPayments.length})</Text>

            {sortedPayments.length === 0 ? (
              <View style={styles.emptyFeesContainer}>
                <Icon name="check-circle" size={48} color="#10b981" />
                <Text style={styles.emptyFeesTitle}>لا توجد رسوم مطلوبة</Text>
                <Text style={styles.emptyFeesSubtitle}>هذا المتدرب ليس عليه أي رسوم حاليا</Text>
              </View>
            ) : (
              sortedPayments.map((payment, index) => {
                const statusColors = getStatusColor(payment.status);
                const remaining = Math.max(0, (payment.amount || 0) - (payment.paidAmount || 0));
                const percent = payment.amount > 0 ? (payment.paidAmount / payment.amount) * 100 : 0;

                return (
                  <View key={payment.id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View style={styles.paymentHeaderLeft}>
                        <Text style={styles.feeName}>{payment.fee?.name || 'رسوم غير محددة'}</Text>
                        <Text style={styles.feeSubText}>#{index + 1} أولوية السداد</Text>
                      </View>
                      <View style={[styles.statusBadge, {backgroundColor: statusColors.background}]}> 
                        <Text style={[styles.statusText, {color: statusColors.text}]}> 
                          {getStatusLabel(payment.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.feeMeta}>نوع الرسم: {getFeeTypeLabel(payment.fee?.type)}</Text>
                    <Text style={styles.feeMeta}>
                      تاريخ الإنشاء: {new Date(payment.createdAt).toLocaleDateString('ar-EG')}
                    </Text>

                    <View style={styles.paymentAmountsWrap}>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountItemLabel}>الإجمالي</Text>
                        <Text style={styles.amountItemValue}>{formatMoney(payment.amount)}</Text>
                      </View>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountItemLabel}>المدفوع</Text>
                        <Text style={[styles.amountItemValue, {color: '#166534'}]}>
                          {formatMoney(payment.paidAmount)}
                        </Text>
                      </View>
                      <View style={styles.amountItem}>
                        <Text style={styles.amountItemLabel}>المتبقي</Text>
                        <Text style={[styles.amountItemValue, {color: '#b91c1c'}]}>
                          {formatMoney(remaining)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.progressWrap}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {width: `${Math.max(0, Math.min(100, percent))}%`},
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>نسبة السداد: {percent.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>كيف يعمل الدفع الذكي؟</Text>
            <Text style={styles.hintText}>
              أدخل أي مبلغ، وسيتم توزيعه تلقائيا على الرسوم من الأقدم إلى الأحدث بنفس منطق صفحة الويب.
            </Text>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showSmartPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSmartPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>الدفع الذكي</Text>
              <TouchableOpacity onPress={() => setShowSmartPaymentModal(false)}>
                <Icon name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalInfoText}>
                إجمالي المتبقي: {formatMoney(financialSummary.remainingAmount)}
              </Text>

              <Text style={styles.fieldLabel}>المبلغ المراد دفعه *</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="numeric"
                value={smartAmount}
                onChangeText={setSmartAmount}
                placeholder="ادخل المبلغ"
              />

              <Text style={styles.fieldLabel}>خزينة الدخل *</Text>
              {incomeSafes.length === 0 ? (
                <Text style={styles.emptySafesText}>لا توجد خزائن دخل متاحة حاليا</Text>
              ) : (
                incomeSafes.map(safe => (
                  <TouchableOpacity
                    key={safe.id}
                    style={[
                      styles.safeOption,
                      smartSafeId === safe.id && styles.safeOptionActive,
                    ]}
                    onPress={() => setSmartSafeId(safe.id)}>
                    <View>
                      <Text style={styles.safeName}>{safe.name}</Text>
                      <Text style={styles.safeBalance}>الرصيد: {formatMoney(safe.balance)}</Text>
                    </View>
                    {smartSafeId === safe.id ? (
                      <Icon name="check-circle" size={20} color="#059669" />
                    ) : null}
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                multiline
                numberOfLines={3}
                value={smartNotes}
                onChangeText={setSmartNotes}
                placeholder="ملاحظات اختيارية"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowSmartPaymentModal(false)}>
                <Text style={styles.cancelModalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton, processingPayment && styles.disabledButton]}
                onPress={submitSmartPayment}
                disabled={processingPayment}>
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>تأكيد الدفع</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSpecificPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSpecificPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>دفع رسوم إضافية</Text>
              <TouchableOpacity onPress={() => setShowSpecificPaymentModal(false)}>
                <Icon name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>اختر الرسم *</Text>
              {additionalFees.length === 0 ? (
                <Text style={styles.emptySafesText}>لا توجد رسوم إضافية متاحة حاليا</Text>
              ) : (
                additionalFees.map(payment => {
                  const remaining = Math.max(0, payment.amount - payment.paidAmount);
                  const isSelected = selectedPaymentId === payment.id;

                  return (
                    <TouchableOpacity
                      key={payment.id}
                      style={[styles.feeOption, isSelected && styles.feeOptionActive]}
                      onPress={() => {
                        setSelectedPaymentId(payment.id);
                        setSpecificAmount(String(remaining));
                      }}>
                      <View style={{flex: 1}}>
                        <Text style={styles.feeOptionTitle}>{payment.fee?.name}</Text>
                        <Text style={styles.feeOptionMeta}>المتبقي: {formatMoney(remaining)}</Text>
                      </View>
                      {isSelected ? <Icon name="check-circle" size={20} color="#2563eb" /> : null}
                    </TouchableOpacity>
                  );
                })
              )}

              <Text style={styles.fieldLabel}>المبلغ المراد دفعه *</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="numeric"
                value={specificAmount}
                onChangeText={setSpecificAmount}
                placeholder="ادخل المبلغ"
              />

              <Text style={styles.fieldLabel}>خزينة الدخل *</Text>
              {incomeSafes.length === 0 ? (
                <Text style={styles.emptySafesText}>لا توجد خزائن دخل متاحة حاليا</Text>
              ) : (
                incomeSafes.map(safe => (
                  <TouchableOpacity
                    key={safe.id}
                    style={[
                      styles.safeOption,
                      specificSafeId === safe.id && styles.safeOptionActive,
                    ]}
                    onPress={() => setSpecificSafeId(safe.id)}>
                    <View>
                      <Text style={styles.safeName}>{safe.name}</Text>
                      <Text style={styles.safeBalance}>الرصيد: {formatMoney(safe.balance)}</Text>
                    </View>
                    {specificSafeId === safe.id ? (
                      <Icon name="check-circle" size={20} color="#059669" />
                    ) : null}
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                multiline
                numberOfLines={3}
                value={specificNotes}
                onChangeText={setSpecificNotes}
                placeholder="ملاحظات اختيارية"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowSpecificPaymentModal(false)}>
                <Text style={styles.cancelModalButtonText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton, processingPayment && styles.disabledButton]}
                onPress={submitSpecificPayment}
                disabled={processingPayment}>
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>تأكيد الدفع</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 36,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  traineeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  traineeMeta: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  progressWrap: {
    marginTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 999,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  feesCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  emptyFeesContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyFeesTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptyFeesSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: '#64748b',
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  feeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  feeSubText: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feeMeta: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  paymentAmountsWrap: {
    marginTop: 6,
    marginBottom: 6,
    gap: 4,
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountItemLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  amountItemValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  hintCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '86%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalInfoText: {
    fontSize: 12,
    color: '#1e3a8a',
    marginBottom: 10,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 2,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptySafesText: {
    fontSize: 12,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  safeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  safeOptionActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  safeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  safeBalance: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  feeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  feeOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  feeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  feeOptionMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  cancelModalButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelModalButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  confirmModalButton: {
    backgroundColor: '#16a34a',
  },
  confirmModalButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default TraineePaymentDetailsScreen;

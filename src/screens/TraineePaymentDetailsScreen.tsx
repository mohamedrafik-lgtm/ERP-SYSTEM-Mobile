import React, { useState, useEffect } from 'react';
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
import { TraineePaymentByTraineeResponse, PaymentStatus, AutoPaymentRequest, SafeResponse } from '../types/student';

interface TraineePaymentDetailsScreenProps {
  route: {
    params: {
      traineeId: number;
      traineeName: string;
      paymentId: number;
    };
  };
  navigation: any;
}

const TraineePaymentDetailsScreen = ({ route, navigation }: TraineePaymentDetailsScreenProps) => {
  const { traineeId, traineeName, paymentId } = route.params;
  const [payments, setPayments] = useState<TraineePaymentByTraineeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<TraineePaymentByTraineeResponse | null>(null);
  const [safes, setSafes] = useState<SafeResponse[]>([]);
  const [selectedSafeId, setSelectedSafeId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchTraineePayments();
    fetchSafes();
  }, [traineeId]);

  const fetchTraineePayments = async () => {
    try {
      setLoading(true);
      console.log('Fetching payments for trainee ID:', traineeId);
      
      const data = await AuthService.getTraineePaymentsByTrainee(traineeId);
      
      console.log('Fetched trainee payments:', data);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching trainee payments:', error);
      Alert.alert('خطأ', 'فشل في تحميل مدفوعات المتدرب');
      
      // Fallback to empty array on error
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSafes = async () => {
    try {
      const data = await AuthService.getAllSafes();
      setSafes(data);
    } catch (error) {
      console.error('Error fetching safes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTraineePayments();
    setRefreshing(false);
  };

  const handlePaymentPress = (payment: TraineePaymentByTraineeResponse) => {
    setSelectedPayment(payment);
    // عرض المبلغ المتبقي بدلاً من المبلغ الكامل
    const remainingAmount = payment.amount - payment.paidAmount;
    setPaymentAmount(remainingAmount.toString());
    setSelectedSafeId('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedPayment || !selectedSafeId || !paymentAmount) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    // التحقق من أن المبلغ لا يتجاوز المبلغ المتبقي
    const remainingAmount = selectedPayment.amount - selectedPayment.paidAmount;
    if (amount > remainingAmount) {
      Alert.alert('خطأ', `المبلغ المدخل (${amount.toLocaleString()} ج.م) يتجاوز المبلغ المتبقي (${remainingAmount.toLocaleString()} ج.م)`);
      return;
    }

    try {
      setProcessingPayment(true);
      
      const paymentData: AutoPaymentRequest = {
        traineeId: traineeId,
        amount: amount,
        safeId: selectedSafeId,
        notes: paymentNotes || undefined,
      };

      console.log('Processing payment:', paymentData);
      
      await AuthService.processAutoPayment(paymentData);
      
      Alert.alert('نجح', 'تم تسجيل الدفع بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            setShowPaymentModal(false);
            fetchTraineePayments(); // تحديث البيانات
          },
        },
      ]);
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الدفع');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'PARTIALLY_PAID':
        return '#3b82f6';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return 'مدفوع';
      case 'PENDING':
        return 'معلق';
      case 'PARTIALLY_PAID':
        return 'مدفوع جزئياً';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return 'غير محدد';
    }
  };

  const renderPaymentCard = (payment: TraineePaymentByTraineeResponse) => (
    <View key={payment.id} style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>دفعة #{payment.id}</Text>
          <Text style={styles.paymentDate}>
            {new Date(payment.createdAt).toLocaleDateString('ar-EG')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
            {getStatusLabel(payment.status)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المبلغ المطلوب:</Text>
          <Text style={styles.amountValue}>{payment.amount.toLocaleString()} ج.م</Text>
        </View>
        
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المبلغ المدفوع:</Text>
          <Text style={[styles.amountValue, { color: getStatusColor(payment.status) }]}>
            {payment.paidAmount.toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>المتبقي:</Text>
          <Text style={[styles.amountValue, { color: payment.amount - payment.paidAmount > 0 ? '#ef4444' : '#10b981' }]}>
            {(payment.amount - payment.paidAmount).toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.feeInfoContainer}>
          <Text style={styles.feeInfoLabel}>تفاصيل الرسوم:</Text>
          <Text style={styles.feeInfoText}>الاسم: {payment.fee.name}</Text>
          <Text style={styles.feeInfoText}>النوع: {payment.fee.type}</Text>
          <Text style={styles.feeInfoText}>العام الدراسي: {payment.fee.academicYear}</Text>
        </View>

        <View style={styles.safeInfoContainer}>
          <Text style={styles.safeInfoLabel}>الخزينة:</Text>
          <Text style={styles.safeInfoText}>{payment.safe.name}</Text>
          <Text style={styles.safeInfoText}>الرصيد: {payment.safe.balance.toLocaleString()} {payment.safe.currency}</Text>
        </View>

        {payment.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>ملاحظات:</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        {payment.paidAt && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>تاريخ الدفع:</Text>
            <Text style={styles.dateText}>
              {new Date(payment.paidAt).toLocaleDateString('ar-EG')}
            </Text>
          </View>
        )}

        {payment.transactions && payment.transactions.length > 0 && (
          <View style={styles.transactionsContainer}>
            <Text style={styles.transactionsLabel}>المعاملات المالية:</Text>
            {payment.transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionAmount}>
                    {transaction.amount.toLocaleString()} ج.م
                  </Text>
                  <Text style={styles.transactionType}>
                    {transaction.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                  </Text>
                </View>
                {transaction.description && (
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                )}
                {transaction.reference && (
                  <Text style={styles.transactionReference}>
                    المرجع: {transaction.reference}
                  </Text>
                )}
                <Text style={styles.transactionDate}>
                  {new Date(transaction.createdAt).toLocaleDateString('ar-EG')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="edit" size={16} color="#1a237e" />
          <Text style={styles.actionButtonText}>تعديل</Text>
        </TouchableOpacity>

        {(payment.status === 'PENDING' || payment.status === 'PARTIALLY_PAID') && (
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={() => handlePaymentPress(payment)}
          >
            <Icon name="payment" size={16} color="#059669" />
            <Text style={styles.paymentButtonText}>
              {payment.status === 'PARTIALLY_PAID' ? 'دفع المتبقي' : 'دفع'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton}>
          <Icon name="delete" size={16} color="#dc2626" />
          <Text style={styles.deleteButtonText}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل مدفوعات المتدرب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>مدفوعات المتدرب</Text>
            <Text style={styles.headerSubtitle}>{traineeName}</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Icon name="add" size={24} color="#1a237e" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {payments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>لا توجد مدفوعات</Text>
              <Text style={styles.emptySubtitle}>
                لم يتم إضافة أي مدفوعات لهذا المتدرب بعد
              </Text>
            </View>
          ) : (
            payments.map(renderPaymentCard)
          )}
        </ScrollView>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل الدفع</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPayment && (
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentInfoTitle}>معلومات الدفعة</Text>
                  <Text style={styles.paymentInfoText}>المبلغ المطلوب: {selectedPayment.amount.toLocaleString()} ج.م</Text>
                  <Text style={styles.paymentInfoText}>المبلغ المدفوع: {selectedPayment.paidAmount.toLocaleString()} ج.م</Text>
                  <Text style={styles.paymentInfoText}>المتبقي: {(selectedPayment.amount - selectedPayment.paidAmount).toLocaleString()} ج.م</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المبلغ المدفوع *</Text>
                <TextInput
                  style={styles.textInput}
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder={`أدخل المبلغ (الحد الأقصى: ${selectedPayment ? (selectedPayment.amount - selectedPayment.paidAmount).toLocaleString() : '0'} ج.م)`}
                  keyboardType="numeric"
                />
                {selectedPayment && (
                  <Text style={styles.helperText}>
                    المبلغ المتبقي: {(selectedPayment.amount - selectedPayment.paidAmount).toLocaleString()} ج.م
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الخزينة المستلمة *</Text>
                <ScrollView style={styles.safesList} nestedScrollEnabled>
                  {safes.map((safe) => (
                    <TouchableOpacity
                      key={safe.id}
                      style={[
                        styles.safeItem,
                        selectedSafeId === safe.id && styles.selectedSafeItem
                      ]}
                      onPress={() => setSelectedSafeId(safe.id)}
                    >
                      <View style={styles.safeInfo}>
                        <Text style={styles.safeName}>{safe.name}</Text>
                        <Text style={styles.safeBalance}>
                          الرصيد: {safe.balance.toLocaleString()} {safe.currency}
                        </Text>
                      </View>
                      {selectedSafeId === safe.id && (
                        <Icon name="check" size={20} color="#059669" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ملاحظات (اختياري)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  placeholder="أدخل ملاحظات إضافية"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, processingPayment && styles.disabledButton]}
                onPress={processPayment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="payment" size={16} color="#fff" />
                    <Text style={styles.confirmButtonText}>تسجيل الدفع</Text>
                  </>
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
    paddingTop: 60,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  feeInfoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  feeInfoLabel: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 6,
  },
  feeInfoText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  safeInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  safeInfoLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 6,
  },
  safeInfoText: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 2,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  dateContainer: {
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#374151',
  },
  transactionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  transactionsLabel: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    marginBottom: 8,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  transactionType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a237e',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
  paymentButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  paymentInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  safesList: {
    maxHeight: 150,
  },
  safeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedSafeItem: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  safeInfo: {
    flex: 1,
  },
  safeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  safeBalance: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#059669',
    marginLeft: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});

export default TraineePaymentDetailsScreen;

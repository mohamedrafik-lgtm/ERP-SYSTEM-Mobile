import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { ITraineeFee, TraineeFeeReportType } from '../types/student';

interface TraineeFeeReportScreenProps {
  navigation: any;
  route: {
    params?: {
      feeId?: number;
      feeName?: string;
      reportType?: TraineeFeeReportType;
    };
  };
}

type FeePaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

const TraineeFeeReportScreen = ({ navigation, route }: TraineeFeeReportScreenProps) => {
  const feeId = route?.params?.feeId;
  const reportType = route?.params?.reportType;

  const [fee, setFee] = useState<ITraineeFee | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getReportTitle = useCallback(() => {
    switch (reportType) {
      case 'paid':
        return 'المسددين للرسم';
      case 'unpaid':
        return 'الغير مسددين للرسم';
      case 'paid-all-previous':
        return 'المسددين للرسم وكل الرسوم السابقة';
      case 'unpaid-any-previous':
        return 'الغير مسددين للرسم الحالي وأي رسم سابق';
      default:
        return 'جميع المتدربين';
    }
  }, [reportType]);

  const getPaymentStatusText = (status: FeePaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'قيد الانتظار';
      case 'PAID':
        return 'مدفوع';
      case 'PARTIALLY_PAID':
        return 'مدفوع جزئياً';
      case 'CANCELLED':
        return 'ملغي';
      default:
        return status;
    }
  };

  const fetchData = useCallback(async () => {
    if (!feeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const feeData = await AuthService.getTraineeFeeReport(feeId, reportType);
      setFee(feeData);
    } catch (error) {
      console.error('Error fetching trainee fee report:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feeId, reportType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => {
    const payments: any[] = fee?.traineePayments || [];

    if (!fee || payments.length === 0) {
      return {
        totalStudents: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalRemaining: 0,
        paidPercentage: 0,
        statusCounts: {
          PENDING: 0,
          PARTIALLY_PAID: 0,
          PAID: 0,
          CANCELLED: 0,
        },
      };
    }

    if (reportType === 'unpaid-any-previous') {
      const totalStudents = payments.length;
      const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
      const totalRemaining = payments.reduce(
        (sum, payment) => sum + Number(payment.remainingAmount || 0),
        0,
      );

      return {
        totalStudents,
        totalAmount,
        totalPaid,
        totalRemaining,
        paidPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
        statusCounts: {
          PENDING: 0,
          PARTIALLY_PAID: totalStudents,
          PAID: 0,
          CANCELLED: 0,
        },
      };
    }

    if (reportType === 'paid-all-previous') {
      const totalStudents = payments.length;
      const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);

      return {
        totalStudents,
        totalAmount,
        totalPaid,
        totalRemaining: 0,
        paidPercentage: 100,
        statusCounts: {
          PENDING: 0,
          PARTIALLY_PAID: 0,
          PAID: totalStudents,
          CANCELLED: 0,
        },
      };
    }

    const totalStudents = payments.length;
    const totalAmount = Number(fee.amount || 0) * totalStudents;
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;

    const statusCounts = {
      PENDING: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      CANCELLED: 0,
    };

    payments.forEach(payment => {
      const status = payment.status as FeePaymentStatus;
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }
    });

    return {
      totalStudents,
      totalAmount,
      totalPaid,
      totalRemaining,
      paidPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      statusCounts,
    };
  }, [fee, reportType]);

  const renderPaymentCard = (payment: any, index: number) => {
    if (reportType === 'paid-all-previous') {
      const paidFees = payment.paidFees || [];
      return (
        <View key={`${payment.id || index}-paid-all`} style={styles.paymentCard}>
          <Text style={styles.traineeName}>{payment.trainee?.nameAr || 'غير محدد'}</Text>
          <Text style={styles.traineeMeta}>{payment.trainee?.nationalId || '-'}</Text>
          <Text style={styles.labelText}>الرسوم المسددة: {paidFees.length}</Text>
          <Text style={styles.amountText}>إجمالي المدفوع: {Number(payment.paidAmount || 0).toLocaleString('ar-EG')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}> 
            <Text style={[styles.statusLabel, { color: '#166534' }]}>مسدد بالكامل</Text>
          </View>
        </View>
      );
    }

    if (reportType === 'unpaid-any-previous') {
      const unpaidFees = payment.unpaidFees || [];
      return (
        <View key={`${payment.id || index}-unpaid-any`} style={styles.paymentCard}>
          <Text style={styles.traineeName}>{payment.trainee?.nameAr || 'غير محدد'}</Text>
          <Text style={styles.traineeMeta}>{payment.trainee?.nationalId || '-'}</Text>
          <Text style={styles.labelText}>الرسوم غير المسددة: {unpaidFees.length}</Text>
          <Text style={styles.amountText}>إجمالي المتبقي: {Number(payment.remainingAmount || 0).toLocaleString('ar-EG')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#fff7ed' }]}> 
            <Text style={[styles.statusLabel, { color: '#c2410c' }]}>رسوم معلقة</Text>
          </View>
        </View>
      );
    }

    const paymentAmount = Number(fee?.amount || 0);
    const paidAmount = Number(payment.paidAmount || 0);
    const remainingAmount = paymentAmount - paidAmount;

    return (
      <View key={`${payment.id || index}-default`} style={styles.paymentCard}>
        <Text style={styles.traineeName}>{payment.trainee?.nameAr || 'غير محدد'}</Text>
        <Text style={styles.traineeMeta}>{payment.trainee?.nationalId || '-'}</Text>

        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>إجمالي المبلغ:</Text>
          <Text style={styles.rowValue}>{paymentAmount.toLocaleString('ar-EG')}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>المدفوع:</Text>
          <Text style={[styles.rowValue, { color: '#166534' }]}>{paidAmount.toLocaleString('ar-EG')}</Text>
        </View>
        <View style={styles.rowLine}>
          <Text style={styles.rowLabel}>المتبقي:</Text>
          <Text style={[styles.rowValue, { color: '#dc2626' }]}>{remainingAmount.toLocaleString('ar-EG')}</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.paidDateText}>
            {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('ar-EG') : '-'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}> 
            <Text style={[styles.statusLabel, { color: '#334155' }]}>
              {getPaymentStatusText(payment.status as FeePaymentStatus)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>تقرير الرسوم</Text>
          <Text style={styles.subtitle}>{getReportTitle()}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل التقرير...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              colors={['#1a237e']}
              tintColor="#1a237e"
            />
          }
        >
          <View style={styles.feeInfoCard}>
            <Text style={styles.sectionTitle}>معلومات الرسوم</Text>
            <Text style={styles.infoLine}>الاسم: {fee?.name || '-'}</Text>
            <Text style={styles.infoLine}>المبلغ: {Number(fee?.amount || 0).toLocaleString('ar-EG')}</Text>
            <Text style={styles.infoLine}>العام الدراسي: {fee?.academicYear || '-'}</Text>
            <Text style={styles.infoLine}>البرنامج: {fee?.program?.nameAr || '-'}</Text>
            <Text style={styles.infoLine}>الخزينة: {fee?.safe?.name || '-'}</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: '#e2e8f0' }]}> 
              <Text style={styles.summaryValue}>{summary.totalStudents}</Text>
              <Text style={styles.summaryLabel}>عدد المتدربين</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#dbeafe' }]}> 
              <Text style={styles.summaryValue}>{summary.totalAmount.toLocaleString('ar-EG')}</Text>
              <Text style={styles.summaryLabel}>إجمالي المبالغ</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}> 
              <Text style={styles.summaryValue}>{summary.totalPaid.toLocaleString('ar-EG')}</Text>
              <Text style={styles.summaryLabel}>إجمالي المدفوع</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#fee2e2' }]}> 
              <Text style={styles.summaryValue}>{summary.totalRemaining.toLocaleString('ar-EG')}</Text>
              <Text style={styles.summaryLabel}>إجمالي المتبقي</Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>نسبة التحصيل</Text>
              <Text style={styles.progressPercent}>{summary.paidPercentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(summary.paidPercentage, 100)}%` }]} />
            </View>
          </View>

          <View style={styles.statusGrid}>
            <View style={styles.statusSummaryCard}>
              <Text style={styles.statusSummaryNumber}>{summary.statusCounts.PENDING}</Text>
              <Text style={styles.statusSummaryLabel}>قيد الانتظار</Text>
            </View>
            <View style={styles.statusSummaryCard}>
              <Text style={styles.statusSummaryNumber}>{summary.statusCounts.PARTIALLY_PAID}</Text>
              <Text style={styles.statusSummaryLabel}>مدفوع جزئياً</Text>
            </View>
            <View style={styles.statusSummaryCard}>
              <Text style={styles.statusSummaryNumber}>{summary.statusCounts.PAID}</Text>
              <Text style={styles.statusSummaryLabel}>مدفوع بالكامل</Text>
            </View>
            <View style={styles.statusSummaryCard}>
              <Text style={styles.statusSummaryNumber}>{summary.statusCounts.CANCELLED}</Text>
              <Text style={styles.statusSummaryLabel}>ملغي</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>تفاصيل المتدربين</Text>
            <Text style={styles.sectionHint}>{getReportTitle()}</Text>
          </View>

          {!fee?.traineePayments || fee.traineePayments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="description" size={44} color="#cbd5e1" />
              <Text style={styles.emptyText}>لا توجد بيانات للعرض</Text>
            </View>
          ) : (
            <View style={styles.paymentsWrap}>
              {fee.traineePayments.map((payment: any, index: number) => renderPaymentCard(payment, index))}
            </View>
          )}
        </ScrollView>
      )}
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
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  content: {
    flex: 1,
  },
  feeInfoCard: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  infoLine: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  summaryGrid: {
    marginHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    width: '48.5%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 3,
    color: '#334155',
  },
  progressWrap: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  statusGrid: {
    marginHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusSummaryCard: {
    width: '48.5%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusSummaryNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusSummaryLabel: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 11,
  },
  sectionHeader: {
    marginHorizontal: 10,
    marginBottom: 6,
  },
  sectionHint: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyBox: {
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#64748b',
  },
  paymentsWrap: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  paymentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
  },
  traineeName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  traineeMeta: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
  },
  labelText: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
  },
  amountText: {
    marginTop: 2,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  rowLine: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#475569',
    fontSize: 12,
  },
  rowValue: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidDateText: {
    color: '#64748b',
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default TraineeFeeReportScreen;

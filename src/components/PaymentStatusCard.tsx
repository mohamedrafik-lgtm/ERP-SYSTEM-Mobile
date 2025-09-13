import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PaymentStatus } from '../types/student';

interface PaymentStatusCardProps {
  status: PaymentStatus;
  amount: number;
  paidAmount: number;
  onPaymentPress?: () => void;
  showPaymentButton?: boolean;
}

const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  status,
  amount,
  paidAmount,
  onPaymentPress,
  showPaymentButton = true,
}) => {
  const remainingAmount = amount - paidAmount;
  const isFullyPaid = remainingAmount <= 0;
  const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;

  const getStatusConfig = () => {
    switch (status) {
      case 'PAID':
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: 'check-circle',
          label: 'مدفوع بالكامل',
          textColor: '#065f46',
        };
      case 'PARTIALLY_PAID':
        return {
          color: '#3b82f6',
          bgColor: '#dbeafe',
          icon: 'schedule',
          label: 'مدفوع جزئياً',
          textColor: '#1e40af',
        };
      case 'PENDING':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: 'pending',
          label: 'في انتظار الدفع',
          textColor: '#92400e',
        };
      case 'CANCELLED':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: 'cancel',
          label: 'ملغي',
          textColor: '#991b1b',
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: 'help',
          label: 'غير محدد',
          textColor: '#374151',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: statusConfig.bgColor }]}>
      <View style={styles.header}>
        <View style={styles.statusInfo}>
          <Icon 
            name={statusConfig.icon} 
            size={24} 
            color={statusConfig.color} 
          />
          <Text style={[styles.statusLabel, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
        
        {showPaymentButton && (status === 'PENDING' || status === 'PARTIALLY_PAID') && (
          <TouchableOpacity 
            style={[styles.paymentButton, { backgroundColor: statusConfig.color }]}
            onPress={onPaymentPress}
          >
            <Icon name="payment" size={16} color="#fff" />
            <Text style={styles.paymentButtonText}>
              {status === 'PARTIALLY_PAID' ? 'دفع المتبقي' : 'دفع'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.amountsContainer}>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: statusConfig.textColor }]}>
            المبلغ المطلوب:
          </Text>
          <Text style={[styles.amountValue, { color: statusConfig.textColor }]}>
            {amount.toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: statusConfig.textColor }]}>
            المبلغ المدفوع:
          </Text>
          <Text style={[styles.amountValue, { color: statusConfig.textColor }]}>
            {paidAmount.toLocaleString()} ج.م
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: statusConfig.textColor }]}>
            المتبقي:
          </Text>
          <Text style={[
            styles.amountValue, 
            { 
              color: remainingAmount > 0 ? '#ef4444' : '#10b981',
              fontWeight: 'bold'
            }
          ]}>
            {remainingAmount.toLocaleString()} ج.م
          </Text>
        </View>
      </View>

      {isPartiallyPaid && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(paidAmount / amount) * 100}%`,
                  backgroundColor: statusConfig.color
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: statusConfig.textColor }]}>
            {Math.round((paidAmount / amount) * 100)}% مكتمل
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  amountsContainer: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PaymentStatusCard;

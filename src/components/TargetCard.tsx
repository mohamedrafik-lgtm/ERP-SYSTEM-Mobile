import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MarketingTargetWithAchieved } from '../types/marketing';

interface TargetCardProps {
  target: MarketingTargetWithAchieved;
  achievementRate: number;
  onEdit: (targetData: any) => void;
  onDelete: () => void;
}

const TargetCard: React.FC<TargetCardProps> = ({
  target,
  achievementRate,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return '#10b981'; // أخضر
    if (rate >= 50) return '#f59e0b'; // برتقالي
    return '#ef4444'; // أحمر
  };

  const getProgressBarWidth = (rate: number) => {
    return Math.min(rate, 100);
  };

  const handleEdit = () => {
    setShowActions(false);
    onEdit({
      targetAmount: target.targetAmount,
      notes: target.notes,
    });
  };

  const handleDelete = () => {
    setShowActions(false);
    onDelete();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.employeeInfo}>
          <View style={styles.avatar}>
            <Icon name="person" size={20} color="#1a237e" />
          </View>
          <View style={styles.employeeDetails}>
            <Text style={styles.employeeName}>{target.employee.name}</Text>
            <Text style={styles.employeePhone}>{target.employee.phone}</Text>
            {target.employee.email && (
              <Text style={styles.employeeEmail}>{target.employee.email}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowActions(!showActions)}
        >
          <Icon name="more-vert" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Actions Menu */}
      {showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Icon name="edit" size={16} color="#1a237e" />
            <Text style={styles.actionText}>تعديل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Icon name="delete" size={16} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>حذف</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Target Info */}
      <View style={styles.targetInfo}>
        <View style={styles.targetRow}>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>الهدف (متدربين)</Text>
            <Text style={styles.targetValue}>{target.targetAmount}</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>المحقق</Text>
            <Text style={styles.targetValue}>{target.achievedAmount}</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>المتبقي</Text>
            <Text style={[styles.targetValue, { color: target.targetAmount - target.achievedAmount > 0 ? '#ef4444' : '#10b981' }]}>
              {Math.max(0, target.targetAmount - target.achievedAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${getProgressBarWidth(achievementRate)}%`,
                backgroundColor: getProgressColor(achievementRate),
              },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: getProgressColor(achievementRate) }]}>
            {achievementRate}%
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Icon name="close" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes */}
      {target.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>ملاحظات:</Text>
          <Text style={styles.notesText}>{target.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            تم التحديد: {new Date(target.setAt).toLocaleDateString('ar-EG')}
          </Text>
          <Text style={styles.footerText}>
            آخر تحديث: {new Date(target.updatedAt).toLocaleDateString('ar-EG')}
          </Text>
        </View>
        {target.setById && (
          <Text style={styles.setByText}>
            بواسطة: {target.setById}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  employeePhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  employeeEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
  },
  actionsMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
    minWidth: 120,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#1a237e',
    marginLeft: 8,
    fontWeight: '500',
  },
  targetInfo: {
    marginBottom: 16,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetItem: {
    alignItems: 'center',
    flex: 1,
  },
  targetLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  targetValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
  notesSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1a237e',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  setByText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default TargetCard;

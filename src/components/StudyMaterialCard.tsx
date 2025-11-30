import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterial } from '../types/studyMaterials';

/**
 * Study Material Card Component
 * Pure component - UI only, no business logic
 * Following Single Responsibility Principle
 */
interface StudyMaterialCardProps {
  material: StudyMaterial;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  onViewRecipients?: () => void;
  onViewNonRecipients?: () => void;
  showActions?: boolean;
}

const StudyMaterialCard: React.FC<StudyMaterialCardProps> = ({
  material,
  onEdit,
  onDelete,
  onToggleActive,
  onViewRecipients,
  onViewNonRecipients,
  showActions = true,
}) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{material.name}</Text>
          {material.nameEn && (
            <Text style={styles.nameEn}>{material.nameEn}</Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: material.isActive ? '#dcfce7' : '#fee2e2' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: material.isActive ? '#059669' : '#dc2626' }
          ]}>
            {material.isActive ? 'نشط' : 'غير نشط'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {material.description && (
        <Text style={styles.description} numberOfLines={2}>
          {material.description}
        </Text>
      )}

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Icon name="school" size={16} color="#6b7280" />
          <Text style={styles.infoText}>{material.program.nameAr}</Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="inventory" size={16} color="#6b7280" />
          <Text style={styles.infoText}>الكمية: {material.quantity}</Text>
        </View>
      </View>

      {/* Delivery Info */}
      <View style={styles.deliveryInfo}>
        <View style={styles.infoItem}>
          <Icon name="local-shipping" size={16} color="#3b82f6" />
          <Text style={styles.infoText}>
            إجمالي التسليمات: {material._count.deliveries}
          </Text>
        </View>

        {material.linkedFee && (
          <View style={styles.infoItem}>
            <Icon name="attach-money" size={16} color="#10b981" />
            <Text style={styles.infoText}>
              {material.linkedFee.name}: {material.linkedFee.amount} جنيه
            </Text>
          </View>
        )}
      </View>

      {/* Responsible Users */}
      {material.responsibleUsers.length > 0 && (
        <View style={styles.responsibleSection}>
          <Text style={styles.responsibleTitle}>المسؤولون عن التسليم:</Text>
          <View style={styles.responsibleList}>
            {material.responsibleUsers.map((responsible, index) => (
              <View key={index} style={styles.responsibleUser}>
                <Icon name="person" size={14} color="#7c3aed" />
                <Text style={styles.responsibleName}>{responsible.user.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={onEdit}
            >
              <Icon name="edit" size={18} color="#fff" />
              <Text style={styles.actionText}>تعديل</Text>
            </TouchableOpacity>
          )}

          {onToggleActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.toggleButton]}
              onPress={onToggleActive}
            >
              <Icon 
                name={material.isActive ? 'visibility-off' : 'visibility'} 
                size={18} 
                color="#fff" 
              />
            </TouchableOpacity>
          )}

          {onViewRecipients && (
            <TouchableOpacity
              style={[styles.actionButton, styles.recipientsButton]}
              onPress={onViewRecipients}
            >
              <Icon name="done-all" size={18} color="#fff" />
              <Text style={styles.actionText}>المستلمين</Text>
            </TouchableOpacity>
          )}

          {onViewNonRecipients && (
            <TouchableOpacity
              style={[styles.actionButton, styles.nonRecipientsButton]}
              onPress={onViewNonRecipients}
            >
              <Icon name="person-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>غير مستلمين</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Icon name="delete" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  nameEn: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  deliveryInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibleSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  responsibleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  responsibleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibleUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  responsibleName: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  toggleButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
  },
  recipientsButton: {
    backgroundColor: '#10b981',
  },
  nonRecipientsButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
  },
});

export default StudyMaterialCard;
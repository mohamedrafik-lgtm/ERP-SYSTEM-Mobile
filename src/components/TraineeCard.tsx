import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TraineeWithMarketingInfo } from '../types/marketing';
import { Gender, TraineeStatus } from '../types/enums';

interface TraineeCardProps {
  trainee: TraineeWithMarketingInfo;
  onPress?: () => void;
}

const TraineeCard: React.FC<TraineeCardProps> = ({
  trainee,
  onPress,
}) => {
  const getGenderIcon = (gender: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return 'male';
      case Gender.FEMALE:
        return 'female';
      default:
        return 'person';
    }
  };

  const getGenderColor = (gender: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return '#3b82f6';
      case Gender.FEMALE:
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: TraineeStatus) => {
    switch (status) {
      case TraineeStatus.ACTIVE:
        return '#10b981';
      case TraineeStatus.INACTIVE:
        return '#ef4444';
      case TraineeStatus.SUSPENDED:
        return '#f59e0b';
      case TraineeStatus.GRADUATED:
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: TraineeStatus) => {
    switch (status) {
      case TraineeStatus.ACTIVE:
        return 'نشط';
      case TraineeStatus.INACTIVE:
        return 'غير نشط';
      case TraineeStatus.SUSPENDED:
        return 'معلق';
      case TraineeStatus.GRADUATED:
        return 'متخرج';
      default:
        return 'غير محدد';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.traineeInfo}>
          <View style={styles.avatar}>
            <Icon 
              name={getGenderIcon(trainee.gender)} 
              size={24} 
              color={getGenderColor(trainee.gender)} 
            />
          </View>
          <View style={styles.traineeDetails}>
            <Text style={styles.traineeName}>{trainee.nameAr}</Text>
            <Text style={styles.traineeNameEn}>{trainee.nameEn}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(trainee.traineeStatus) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(trainee.traineeStatus) }]}>
                {getStatusText(trainee.traineeStatus)}
              </Text>
            </View>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#9ca3af" />
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Icon name="phone" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{trainee.phone}</Text>
        </View>
        {trainee.email && (
          <View style={styles.contactRow}>
            <Icon name="email" size={16} color="#6b7280" />
            <Text style={styles.contactText}>{trainee.email}</Text>
          </View>
        )}
        <View style={styles.contactRow}>
          <Icon name="badge" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{trainee.nationalId}</Text>
        </View>
      </View>

      {/* Program Info */}
      <View style={styles.programSection}>
        <View style={styles.sectionHeader}>
          <Icon name="school" size={18} color="#1a237e" />
          <Text style={styles.sectionTitle}>البرنامج التدريبي</Text>
        </View>
        <Text style={styles.programName}>{trainee.program.nameAr}</Text>
      </View>

      {/* Marketing Info */}
      <View style={styles.marketingSection}>
        <View style={styles.sectionHeader}>
          <Icon name="campaign" size={18} color="#1a237e" />
          <Text style={styles.sectionTitle}>تفاصيل التسويق</Text>
        </View>
        
        {/* Marketing Employee */}
        {trainee.marketingEmployee && (
          <View style={styles.marketingRow}>
            <View style={styles.marketingLabel}>
              <Icon name="person" size={14} color="#6b7280" />
              <Text style={styles.marketingLabelText}>موظف التسويق:</Text>
            </View>
            <Text style={styles.marketingValue}>{trainee.marketingEmployee.name}</Text>
          </View>
        )}

        {/* First Contact Employee */}
        {trainee.firstContactEmployee && (
          <View style={styles.marketingRow}>
            <View style={styles.marketingLabel}>
              <Icon name="call" size={14} color="#6b7280" />
              <Text style={styles.marketingLabelText}>التواصل الأول:</Text>
            </View>
            <Text style={styles.marketingValue}>{trainee.firstContactEmployee.name}</Text>
          </View>
        )}

        {/* Second Contact Employee */}
        {trainee.secondContactEmployee && (
          <View style={styles.marketingRow}>
            <View style={styles.marketingLabel}>
              <Icon name="call-made" size={14} color="#6b7280" />
              <Text style={styles.marketingLabelText}>التواصل الثاني:</Text>
            </View>
            <Text style={styles.marketingValue}>{trainee.secondContactEmployee.name}</Text>
          </View>
        )}

        {/* No marketing info */}
        {!trainee.marketingEmployee && !trainee.firstContactEmployee && !trainee.secondContactEmployee && (
          <View style={styles.noMarketingInfo}>
            <Icon name="info" size={16} color="#9ca3af" />
            <Text style={styles.noMarketingText}>لا توجد تفاصيل تسويق متاحة</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          تاريخ التسجيل: {new Date(trainee.createdAt).toLocaleDateString('ar-EG')}
        </Text>
        <Text style={styles.footerText}>
          آخر تحديث: {new Date(trainee.updatedAt).toLocaleDateString('ar-EG')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  traineeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  traineeDetails: {
    flex: 1,
  },
  traineeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  traineeNameEn: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  programSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  programName: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  marketingSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  marketingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marketingLabelText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  marketingValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  noMarketingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  noMarketingText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default TraineeCard;

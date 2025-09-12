import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TraineeBasicInfo } from '../types/marketing';
import { Gender, TraineeStatus } from '../types/enums';

interface TraineeBasicCardProps {
  trainee: TraineeBasicInfo;
  onPress?: () => void;
}

const TraineeBasicCard: React.FC<TraineeBasicCardProps> = ({
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
              size={20} 
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
        <Icon name="chevron-right" size={20} color="#9ca3af" />
      </View>

      {/* Contact Info */}
      <View style={styles.contactSection}>
        <View style={styles.contactRow}>
          <Icon name="phone" size={14} color="#6b7280" />
          <Text style={styles.contactText}>{trainee.phone}</Text>
        </View>
        {trainee.email && (
          <View style={styles.contactRow}>
            <Icon name="email" size={14} color="#6b7280" />
            <Text style={styles.contactText}>{trainee.email}</Text>
          </View>
        )}
        <View style={styles.contactRow}>
          <Icon name="badge" size={14} color="#6b7280" />
          <Text style={styles.contactText}>{trainee.nationalId}</Text>
        </View>
      </View>

      {/* Program Info */}
      <View style={styles.programSection}>
        <View style={styles.sectionHeader}>
          <Icon name="school" size={16} color="#1a237e" />
          <Text style={styles.sectionTitle}>البرنامج التدريبي</Text>
        </View>
        <Text style={styles.programName}>{trainee.program.nameAr}</Text>
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
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traineeInfo: {
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
    marginRight: 10,
  },
  traineeDetails: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  traineeNameEn: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
    flex: 1,
  },
  programSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 6,
  },
  programName: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 10,
    color: '#9ca3af',
  },
});

export default TraineeBasicCard;

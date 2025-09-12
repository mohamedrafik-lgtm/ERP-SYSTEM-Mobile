import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EmployeePerformance } from '../types/marketing';

interface EmployeePerformanceCardProps {
  employee: EmployeePerformance;
  rank?: number;
  onPress?: () => void;
}

const EmployeePerformanceCard: React.FC<EmployeePerformanceCardProps> = ({
  employee,
  rank,
  onPress,
}) => {
  const getAchievementColor = (rate: number) => {
    if (rate >= 100) return '#10b981';
    if (rate >= 80) return '#f59e0b';
    if (rate >= 60) return '#f97316';
    return '#ef4444';
  };

  const getAchievementIcon = (rate: number) => {
    if (rate >= 100) return 'check-circle';
    if (rate >= 80) return 'warning';
    if (rate >= 60) return 'info';
    return 'error';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header with rank */}
      <View style={styles.header}>
        <View style={styles.employeeInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{employee.name?.slice(0, 1)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{employee.name}</Text>
            {rank && (
              <View style={styles.rankContainer}>
                <Icon name="emoji-events" size={16} color="#f59e0b" />
                <Text style={styles.rankText}>#{rank}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.achievementContainer}>
          <Icon 
            name={getAchievementIcon(employee.achievementRate)} 
            size={20} 
            color={getAchievementColor(employee.achievementRate)} 
          />
          <Text style={[styles.achievementRate, { color: getAchievementColor(employee.achievementRate) }]}>
            {employee.achievementRate}%
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>الهدف الشهري</Text>
          <Text style={styles.statValue}>{employee.monthlyTarget}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>المُعيّنين (الشهر)</Text>
          <Text style={styles.statValue}>{employee.monthlyAssigned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>إجمالي المُعيّنين</Text>
          <Text style={styles.statValue}>{employee.totalAssigned}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>التواصل الأول</Text>
          <Text style={styles.statValue}>{employee.monthlyFirstContact}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(employee.achievementRate, 100)}%`,
                backgroundColor: getAchievementColor(employee.achievementRate)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {employee.achievementRate >= 100 ? 'تم تحقيق الهدف!' : 'لم يتم تحقيق الهدف بعد'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '700',
    marginLeft: 4,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  achievementRate: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    width: '50%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default EmployeePerformanceCard;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ProgramStats } from '../types/marketing';

interface ProgramStatsCardProps {
  programs: ProgramStats[];
  totalTrainees: number;
}

const ProgramStatsCard: React.FC<ProgramStatsCardProps> = ({
  programs,
  totalTrainees,
}) => {
  const getProgramIcon = (programName: string) => {
    const name = programName.toLowerCase();
    if (name.includes('برمجة') || name.includes('تطوير')) return 'code';
    if (name.includes('تصميم') || name.includes('جرافيك')) return 'palette';
    if (name.includes('شبكات') || name.includes('أمن')) return 'security';
    if (name.includes('قاعدة') || name.includes('بيانات')) return 'storage';
    if (name.includes('ذكاء') || name.includes('تعلم')) return 'psychology';
    return 'school';
  };

  const getProgramColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  const getPercentage = (count: number) => {
    return totalTrainees > 0 ? Math.round((count / totalTrainees) * 100) : 0;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="school" size={24} color="#1a237e" />
        <Text style={styles.title}>إحصائيات البرامج</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.programsContainer}>
          {programs.map((program, index) => (
            <View key={program.programId} style={styles.programItem}>
              <View style={[styles.programIcon, { backgroundColor: getProgramColor(index) + '20' }]}>
                <Icon 
                  name={getProgramIcon(program.programName)} 
                  size={20} 
                  color={getProgramColor(index)} 
                />
              </View>
              <Text style={styles.programName} numberOfLines={2}>
                {program.programName}
              </Text>
              <Text style={styles.programCount}>{program.count}</Text>
              <Text style={styles.programPercentage}>
                {getPercentage(program.count)}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي البرامج</Text>
          <Text style={styles.summaryValue}>{programs.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي المتدربين</Text>
          <Text style={styles.summaryValue}>{totalTrainees}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>متوسط لكل برنامج</Text>
          <Text style={styles.summaryValue}>
            {programs.length > 0 ? Math.round(totalTrainees / programs.length) : 0}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a237e',
    marginLeft: 16,
    letterSpacing: 0.3,
  },
  scrollContainer: {
    marginBottom: 20,
  },
  programsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  programItem: {
    alignItems: 'center',
    marginLeft: 20,
    minWidth: 90,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  programIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  programName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 90,
    lineHeight: 16,
  },
  programCount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  programPercentage: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
});

export default ProgramStatsCard;

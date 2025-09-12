import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  backgroundColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  backgroundColor = '#fff',
  subtitle,
  trend,
}) => {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: backgroundColor === '#fff' ? iconColor + '20' : 'rgba(255, 255, 255, 0.2)' }]}>
          <Icon name={icon} size={18} color={backgroundColor === '#fff' ? iconColor : '#ffffff'} />
        </View>
        <View style={styles.textContainer}>
          <Text 
            style={[styles.title, { color: backgroundColor === '#fff' ? '#374151' : '#ffffff' }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              style={[styles.subtitle, { color: backgroundColor === '#fff' ? '#6b7280' : 'rgba(255, 255, 255, 0.8)' }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: backgroundColor === '#fff' ? '#111827' : '#ffffff' }]}>{value}</Text>
        {trend && (
          <View style={[styles.trendContainer, { backgroundColor: backgroundColor === '#fff' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}>
            <Icon 
              name={trend.isPositive ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={trend.isPositive ? '#10b981' : '#ef4444'} 
            />
            <Text style={[
              styles.trendText, 
              { color: trend.isPositive ? '#10b981' : '#ef4444' }
            ]}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 100,
    maxHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 1,
    letterSpacing: 0.05,
    lineHeight: 13,
    textAlign: 'right',
    flexWrap: 'nowrap',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 12,
    textAlign: 'right',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.2,
    lineHeight: 26,
    textAlign: 'right',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
    letterSpacing: 0.2,
  },
});

export default StatsCard;

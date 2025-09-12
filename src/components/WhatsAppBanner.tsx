import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface WhatsAppBannerProps {
  title: string;
  subtitle: string;
  features: string[];
  status: 'connected' | 'disconnected' | 'pending';
  statusText: string;
}

const WhatsAppBanner: React.FC<WhatsAppBannerProps> = ({
  title,
  subtitle,
  features,
  status,
  statusText,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.statusTag}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusTagText, { color: getStatusColor() }]}>
              {statusText}
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.featureTags}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureTagText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.illustration}>
          <Icon name="smart-toy" size={80} color="#8b5cf6" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  featureTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureTagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  illustration: {
    marginLeft: 16,
  },
});

export default WhatsAppBanner;

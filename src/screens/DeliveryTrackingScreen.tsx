import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';

const DeliveryTrackingScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="DeliveryTracking" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title}>تتبع التسليم</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Icon name="local-shipping" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>تتبع التسليم</Text>
          <Text style={styles.emptySubtitle}>
            متابعة حالة تسليم الأدوات الدراسية والكارنيهات للطلاب
          </Text>
          <Text style={styles.note}>
            (سيتم إضافة المحتوى قريباً)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default DeliveryTrackingScreen;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';

interface PaperExamsScreenProps {
  navigation: any;
}

const PaperExamsScreen: React.FC<PaperExamsScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaperExams" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>الاختبارات الورقية</Text>
          <Text style={styles.subtitle}>الخدمة متاحة في القائمة ولكنها متوقفة مؤقتا</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.maintenanceCard}>
          <View style={styles.iconWrap}>
            <Icon name="build-circle" size={42} color="#d97706" />
          </View>
          <Text style={styles.maintenanceTitle}>قيد الصيانة حاليا</Text>
          <Text style={styles.maintenanceText}>
            نعمل حاليا على تحسين صفحة الاختبارات الورقية. يرجى المحاولة مرة أخرى لاحقا.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaperExamsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  maintenanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  maintenanceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  maintenanceText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
  },
});

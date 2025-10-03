import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import Toast from 'react-native-toast-message';
import { DistributionType } from '../types/distribution';

const AddDistributionScreen = ({ navigation }: any) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
  const [distributionType, setDistributionType] = useState<DistributionType | undefined>(undefined);
  const [numberOfRooms, setNumberOfRooms] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setIsLoadingPrograms(true);
        const data = await AuthService.getAllPrograms();
        setPrograms(Array.isArray(data) ? data : []);
      } catch (error) {
        Toast.show({ type: 'error', text1: 'فشل تحميل البرامج', position: 'bottom' });
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!selectedProgramId) {
        Toast.show({ type: 'error', text1: 'اختر البرنامج التدريبي', position: 'bottom' });
        return;
      }
      if (!distributionType) {
        Toast.show({ type: 'error', text1: 'اختر نوع التوزيع', position: 'bottom' });
        return;
      }
      const rooms = parseInt(numberOfRooms, 10);
      if (isNaN(rooms) || rooms < 1) {
        Toast.show({ type: 'error', text1: 'عدد القاعات يجب أن يكون 1 أو أكثر', position: 'bottom' });
        return;
      }

      setIsSubmitting(true);
      await AuthService.createTraineeDistribution({
        programId: selectedProgramId,
        type: distributionType,
        numberOfRooms: rooms,
      });
      Toast.show({ type: 'success', text1: 'تم إنشاء التوزيع بنجاح', position: 'bottom' });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'فشل إنشاء التوزيع', text2: error?.message, position: 'bottom' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AddDistribution" />
        <View style={styles.headerContent}>
          <Text style={styles.title}>توزيع جديد</Text>
          <Text style={styles.subtitle}>إنشاء توزيع جديد للمتدربين على القاعات</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>بيانات التوزيع</Text>
          <SelectBox<number>
            label="البرنامج التدريبي"
            selectedValue={selectedProgramId}
            onValueChange={setSelectedProgramId}
            items={(programs || []).map((p: any) => ({ value: p.id as number, label: p.nameAr as string }))}
            placeholder={isLoadingPrograms ? 'جاري تحميل البرامج...' : 'اختر البرنامج'}
            loading={isLoadingPrograms}
          />

          <SelectBox<DistributionType>
            label="نوع التوزيع"
            selectedValue={distributionType}
            onValueChange={setDistributionType}
            items={[
              { value: DistributionType.THEORY, label: 'نظري' },
              { value: DistributionType.PRACTICAL, label: 'عملي' },
            ]}
            placeholder="اختر النوع"
          />

          <Text style={styles.inputLabel}>عدد القاعات</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={numberOfRooms}
              onChangeText={setNumberOfRooms}
              keyboardType="number-pad"
              placeholder="مثال: 3"
              style={styles.textInput}
            />
          </View>

          <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.disabled]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>إنشاء التوزيع</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default AddDistributionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  subtitle: { marginTop: 4, color: '#6b7280' },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, padding: 20 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a237e', marginBottom: 12 },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: '500' },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textInput: { height: 44, fontSize: 16, color: '#333' },
  submitBtn: { backgroundColor: '#1a237e', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.7 },
});



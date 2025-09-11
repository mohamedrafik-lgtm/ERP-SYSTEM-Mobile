import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { UpdateMarketingEmployeeRequest } from '../types/marketing';
import Toast from 'react-native-toast-message';

const EditMarketerScreen = ({ navigation, route }: any) => {
  const { employee } = route.params || {};
  const [form, setForm] = useState<UpdateMarketingEmployeeRequest>({
    name: employee?.name || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    isActive: employee?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  const setField = (key: keyof UpdateMarketingEmployeeRequest, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await AuthService.updateMarketingEmployee(employee.id, {
        name: form.name,
        phone: form.phone,
        email: form.email ?? null,
        isActive: form.isActive,
      });
      Toast.show({ type: 'success', text1: 'تم تحديث المسوّق' });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'فشل التحديث', text2: e?.message || 'حدث خطأ' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="EditMarketer" />
        <Text style={styles.headerTitle}>تعديل مسوّق</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>بيانات المسوّق</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setField('name', t)} placeholder="الاسم" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setField('phone', t)} placeholder="01XXXXXXXXX" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={form.email || ''} onChangeText={(t) => setField('email', t)} placeholder="name@example.com" />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>نشط</Text>
            <Switch value={!!form.isActive} onValueChange={(v) => setField('isActive', v)} />
          </View>

          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>تحديث</Text>}
          </TouchableOpacity>
        </View>
        <Toast />
      </ScrollView>
    </View>
  );
};

export default EditMarketerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a237e', marginBottom: 6 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  submitBtn: { marginTop: 8, height: 48, backgroundColor: '#1a237e', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});



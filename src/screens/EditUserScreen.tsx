import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import type { UpdateUserRequest } from '../types/users';
import type { RolesResponse } from '../types/permissions';
import Toast from 'react-native-toast-message';

const EditUserScreen = ({ navigation, route }: any) => {
  const { user } = route.params || {};
  const [form, setForm] = useState<UpdateUserRequest>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    roleId: user?.userRoles?.[0]?.role?.id || undefined,
    isActive: user?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState<RolesResponse>([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const data = await AuthService.getRoles();
        setRoles(data);
      } catch (e) {
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  const setField = (key: keyof UpdateUserRequest, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    if (!user?.id) return;
    try {
      setSubmitting(true);
      let payload: UpdateUserRequest = { ...form };
      if (payload.roleId) {
        const isId = roles.some(r => r.id === payload.roleId);
        if (!isId) {
          const match = roles.find(r => r.displayName === payload.roleId || r.name === payload.roleId);
          payload.roleId = match ? match.id : undefined;
        }
      }
      // If email/phone/name unchanged strings equal original, let backend ignore or send only changed fields
      // We already clean undefined/empty server-side; ensure we do not send unchanged empty strings
      if (payload.name !== undefined && payload.name === user?.name) delete (payload as any).name;
      if (payload.email !== undefined && payload.email === user?.email) delete (payload as any).email;
      if (payload.phone !== undefined && payload.phone === user?.phone) delete (payload as any).phone;
      await AuthService.updateUser(user.id, payload);
      Toast.show({ type: 'success', text1: 'تم تحديث المستخدم' });
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
        <CustomMenu navigation={navigation} activeRouteName="EditUser" />
        <Text style={styles.headerTitle}>تعديل مستخدم</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>بيانات المستخدم</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(t) => setField('name', t)} placeholder="الاسم" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput style={styles.input} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(t) => setField('email', t)} placeholder="name@example.com" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={form.phone} onChangeText={(t) => setField('phone', t)} placeholder="01XXXXXXXXX" />
          </View>

          <SelectBox
            label="الدور / الصلاحية"
            selectedValue={form.roleId as string | undefined}
            onValueChange={(v) => setField('roleId', v as string)}
            items={roles.map(r => ({ value: r.id, label: r.displayName }))}
            placeholder={rolesLoading ? 'جاري التحميل...' : 'اختر دور المستخدم'}
            loading={rolesLoading}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>نشط</Text>
            <Switch value={!!form.isActive} onValueChange={(v) => setField('isActive', v)} />
          </View>

          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>تحديث</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditUserScreen;

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



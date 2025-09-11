import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import CustomMenu from '../components/CustomMenu';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import type { RolesResponse } from '../types/permissions';
import type { CreateUserRequest } from '../types/users';
import Toast from 'react-native-toast-message';

const AddUserScreen = ({ navigation }: any) => {
  const [form, setForm] = useState<CreateUserRequest>({ name: '', email: '', phone: '', password: '', roleId: undefined });
  const [submitting, setSubmitting] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState<RolesResponse>([]);

  React.useEffect(() => {
    const loadRoles = async () => {
      try {
        setRolesLoading(true);
        const data = await AuthService.getRoles();
        setRoles(data);
      } catch (e) {
        // ignore, toast on submit if needed
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  const setField = (key: keyof CreateUserRequest, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'الاسم مطلوب';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'البريد الإلكتروني غير صالح';
    if (!form.phone.trim() || !/^[0-9+\-\s()]{10,15}$/.test(form.phone)) return 'رقم الهاتف غير صالح';
    if (!form.password || form.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    return null;
  };

  const onSubmit = async () => {
    const error = validate();
    if (error) {
      Toast.show({ type: 'error', text1: 'تحقق من البيانات', text2: error });
      return;
    }
    try {
      setSubmitting(true);
      await AuthService.createUser(form);
      Toast.show({ type: 'success', text1: 'تم إضافة المستخدم', text2: form.name });
      setForm({ name: '', email: '', phone: '', password: '', roleId: undefined });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'فشل الإضافة', text2: e?.message || 'حدث خطأ' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AddUser" />
        <Text style={styles.headerTitle}>إضافة مستخدم</Text>
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <TextInput style={styles.input} secureTextEntry value={form.password} onChangeText={(t) => setField('password', t)} placeholder="******" />
          </View>

          <SelectBox
            label="الدور / الصلاحية"
            selectedValue={form.roleId}
            onValueChange={(v) => setField('roleId', v as string)}
            items={roles.map(r => ({ value: r.id, label: r.displayName }))}
            placeholder={rolesLoading ? 'جاري التحميل...' : 'اختر دور المستخدم (اختياري)'}
            loading={rolesLoading}
          />

          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={onSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>إضافة</Text>}
          </TouchableOpacity>
        </View>
        <Toast />
      </ScrollView>
    </View>
  );
};

export default AddUserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  submitBtn: {
    marginTop: 8,
    height: 48,
    backgroundColor: '#1a237e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});



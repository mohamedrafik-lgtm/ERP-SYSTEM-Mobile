import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';

const COMMON_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'manage',
  'approve',
  'reject',
];

const COMMON_RESOURCES = [
  'dashboard.users',
  'dashboard.trainees',
  'dashboard.programs',
  'dashboard.training-contents',
  'dashboard.questions',
  'dashboard.attendance',
  'dashboard.financial',
  'dashboard.reports',
  'dashboard.settings',
  'dashboard.audit-logs',
  'dashboard.permissions',
];

const PERMISSION_CATEGORIES = [
  'إدارة المستخدمين',
  'إدارة المتدربين',
  'إدارة البرامج',
  'المحتوى التدريبي',
  'بنك الأسئلة',
  'الحضور والغياب',
  'النظام المالي',
  'التقارير',
  'إدارة النظام',
  'أخرى',
];

const AddPermissionScreen = ({ navigation, route }: any) => {
  const permission = route?.params?.permission;
  const isEditing = !!permission;

  const [form, setForm] = useState({
    resource: permission?.resource || '',
    action: permission?.action || '',
    displayName: permission?.displayName || '',
    description: permission?.description || '',
    category: permission?.category || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewKey = useMemo(
    () => `${(form.resource || 'resource').trim()}.${(form.action || 'action').trim()}`,
    [form.resource, form.action],
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.resource.trim()) nextErrors.resource = 'المورد مطلوب';
    if (!form.action.trim()) {
      nextErrors.action = 'الفعل مطلوب';
    } else if (!/^[a-z_]+$/.test(form.action.trim())) {
      nextErrors.action = 'الفعل يجب أن يحتوي أحرف إنجليزية صغيرة و _ فقط';
    }
    if (!form.displayName.trim()) nextErrors.displayName = 'الاسم المعروض مطلوب';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      if (isEditing) {
        await AuthService.updatePermission(permission.id, {
          displayName: form.displayName.trim(),
          description: form.description.trim() || undefined,
          category: form.category.trim() || undefined,
        });
        Toast.show({ type: 'success', text1: 'تم تحديث الصلاحية بنجاح' });
      } else {
        await AuthService.createPermission({
          resource: form.resource.trim(),
          action: form.action.trim(),
          displayName: form.displayName.trim(),
          description: form.description.trim() || undefined,
          category: form.category.trim() || undefined,
        });
        Toast.show({ type: 'success', text1: 'تم إنشاء الصلاحية بنجاح' });
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'فشل حفظ الصلاحية');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="AddPermission" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'تعديل صلاحية' : 'إضافة صلاحية'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButtonHeader, saving && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="save" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>بيانات الصلاحية</Text>

          <Text style={styles.label}>المورد *</Text>
          <TextInput
            style={[styles.input, errors.resource ? styles.inputError : null, isEditing ? styles.inputDisabled : null]}
            value={form.resource}
            onChangeText={(v) => setForm((prev) => ({ ...prev, resource: v }))}
            placeholder="مثال: dashboard.users"
            placeholderTextColor="#9ca3af"
            editable={!isEditing}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!isEditing && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
              {COMMON_RESOURCES.map((resource) => (
                <TouchableOpacity key={resource} style={styles.chip} onPress={() => setForm((prev) => ({ ...prev, resource }))}>
                  <Text style={styles.chipText}>{resource}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {errors.resource ? <Text style={styles.errorText}>{errors.resource}</Text> : null}

          <Text style={styles.label}>الفعل *</Text>
          <TextInput
            style={[styles.input, errors.action ? styles.inputError : null, isEditing ? styles.inputDisabled : null]}
            value={form.action}
            onChangeText={(v) => setForm((prev) => ({ ...prev, action: v }))}
            placeholder="مثال: view"
            placeholderTextColor="#9ca3af"
            editable={!isEditing}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!isEditing && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsWrap}>
              {COMMON_ACTIONS.map((action) => (
                <TouchableOpacity key={action} style={styles.chip} onPress={() => setForm((prev) => ({ ...prev, action }))}>
                  <Text style={styles.chipText}>{action}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {errors.action ? <Text style={styles.errorText}>{errors.action}</Text> : null}
          {isEditing ? <Text style={styles.hint}>لا يمكن تغيير المورد والفعل بعد إنشاء الصلاحية</Text> : null}

          <Text style={styles.label}>الاسم المعروض *</Text>
          <TextInput
            style={[styles.input, errors.displayName ? styles.inputError : null]}
            value={form.displayName}
            onChangeText={(v) => setForm((prev) => ({ ...prev, displayName: v }))}
            placeholder="مثال: عرض المستخدمين"
            placeholderTextColor="#9ca3af"
          />
          {errors.displayName ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}

          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
            placeholder="وصف مختصر للصلاحية"
            placeholderTextColor="#9ca3af"
            multiline
          />

          <Text style={styles.label}>التصنيف</Text>
          <TextInput
            style={styles.input}
            value={form.category}
            onChangeText={(v) => setForm((prev) => ({ ...prev, category: v }))}
            placeholder="مثال: إدارة المستخدمين"
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.categoryWrap}>
            {PERMISSION_CATEGORIES.map((category) => (
              <TouchableOpacity key={category} style={styles.categoryChip} onPress={() => setForm((prev) => ({ ...prev, category }))}>
                <Text style={styles.categoryChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>معاينة</Text>
            <Text style={styles.previewKey}>{previewKey}</Text>
            <Text style={styles.previewName}>{form.displayName || 'الاسم المعروض'}</Text>
            {form.category ? <Text style={styles.previewCategory}>التصنيف: {form.category}</Text> : null}
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name={isEditing ? 'save' : 'add'} size={18} color="#fff" />
              <Text style={styles.saveButtonText}>{isEditing ? 'حفظ التعديلات' : 'إنشاء الصلاحية'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

export default AddPermissionScreen;

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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a237e',
  },
  saveButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  chipsWrap: {
    paddingTop: 8,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  chipText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '600',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  previewBox: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 12,
  },
  previewLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 4,
  },
  previewKey: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  previewName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginTop: 4,
  },
  previewCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});



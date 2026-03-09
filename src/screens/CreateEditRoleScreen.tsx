import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { RoleWithRelations, CreateRoleRequest, UpdateRoleRequest } from '../types/permissions';

const ROLE_COLORS = [
  '#1a237e', '#e53e3e', '#d69e2e', '#3182ce', '#38a169',
  '#6366f1', '#805ad5', '#dd6b20', '#ec4899', '#14b8a6',
  '#6B7280', '#9CA3AF',
];

const ROLE_ICONS = [
  'admin-panel-settings', 'shield', 'security', 'manage-accounts',
  'supervisor-account', 'people', 'person', 'engineering',
  'school', 'work', 'account-balance', 'verified-user',
  'stars', 'military-tech', 'badge', 'support-agent',
];

const CreateEditRoleScreen = ({ navigation, route }: any) => {
  const editRole: RoleWithRelations | undefined = route.params?.role;
  const isEditing = !!editRole;

  const [name, setName] = useState(editRole?.name || '');
  const [displayName, setDisplayName] = useState(editRole?.displayName || '');
  const [description, setDescription] = useState(editRole?.description || '');
  const [color, setColor] = useState(editRole?.color || '#1a237e');
  const [icon, setIcon] = useState(editRole?.icon || 'admin-panel-settings');
  const [priority, setPriority] = useState(String(editRole?.priority ?? 100));
  const [isActive, setIsActive] = useState(editRole?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const validateName = (val: string) => {
    if (!val.trim()) {
      setNameError('اسم الدور مطلوب');
      return false;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(val)) {
      setNameError('يجب أن يكون بالإنجليزية الصغيرة (a-z, 0-9, _) ويبدأ بحرف');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!isEditing && !validateName(name)) return;
    if (!displayName.trim()) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'الاسم المعروض مطلوب' });
      return;
    }

    const priorityNum = parseInt(priority, 10);
    if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 1000) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'الأولوية يجب أن تكون بين 0 و 1000' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const updateData: UpdateRoleRequest = {
          displayName: displayName.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          priority: priorityNum,
          isActive,
        };
        await AuthService.updateRole(editRole!.id, updateData);
        Toast.show({ type: 'success', text1: 'نجح', text2: 'تم تحديث الدور بنجاح' });
      } else {
        const createData: CreateRoleRequest = {
          name: name.trim(),
          displayName: displayName.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          priority: priorityNum,
          isActive,
        };
        await AuthService.createRole(createData);
        Toast.show({ type: 'success', text1: 'نجح', text2: 'تم إنشاء الدور بنجاح' });
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في حفظ الدور');
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
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'تعديل الدور' : 'إنشاء دور جديد'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Name (only for creation) */}
        {!isEditing && (
          <View style={styles.card}>
            <Text style={styles.label}>اسم الدور (كود إنجليزي) *</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={name}
              onChangeText={(val) => { setName(val); validateName(val); }}
              placeholder="مثال: teacher_assistant"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : (
              <Text style={styles.hint}>أحرف إنجليزية صغيرة، أرقام، و underscore فقط</Text>
            )}
          </View>
        )}

        {/* Display Name */}
        <View style={styles.card}>
          <Text style={styles.label}>الاسم المعروض (بالعربية) *</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="مثال: معلم مساعد"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.label}>الوصف</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="وصف مختصر للدور..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Priority */}
        <View style={styles.card}>
          <Text style={styles.label}>الأولوية (0-1000)</Text>
          <TextInput
            style={styles.input}
            value={priority}
            onChangeText={setPriority}
            placeholder="100"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
          <Text style={styles.hint}>كلما زاد الرقم زادت الأولوية (super_admin = 1000)</Text>
        </View>

        {/* Active Toggle */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>الحالة</Text>
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, isActive ? styles.activeLabel : styles.inactiveLabel]}>
                {isActive ? 'مُفعّل' : 'غير مُفعّل'}
              </Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={isActive ? '#1a237e' : '#9ca3af'}
              />
            </View>
          </View>
        </View>

        {/* Color Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>اللون</Text>
          <View style={styles.colorGrid}>
            {ROLE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleSelected]}
                onPress={() => setColor(c)}
              >
                {color === c && <Icon name="check" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>الأيقونة</Text>
          <View style={styles.iconGrid}>
            {ROLE_ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconCircle, icon === ic && { backgroundColor: color, borderColor: color }]}
                onPress={() => setIcon(ic)}
              >
                <Icon name={ic} size={22} color={icon === ic ? '#fff' : '#6b7280'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.card}>
          <Text style={styles.label}>معاينة</Text>
          <View style={styles.previewRow}>
            <View style={[styles.previewAvatar, { backgroundColor: color }]}>
              <Icon name={icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{displayName || 'الاسم المعروض'}</Text>
              <Text style={styles.previewCode}>#{name || 'role_name'}</Text>
            </View>
            {isActive ? (
              <View style={styles.activeChip}><Text style={styles.activeChipText}>مُفعّل</Text></View>
            ) : (
              <View style={styles.inactiveChip}><Text style={styles.inactiveChipText}>غير مُفعّل</Text></View>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name={isEditing ? 'save' : 'add'} size={20} color="#fff" />
              <Text style={styles.saveButtonText}>{isEditing ? 'حفظ التعديلات' : 'إنشاء الدور'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default CreateEditRoleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: {
    padding: 8, marginRight: 12, borderRadius: 8,
    backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  inputError: { borderColor: '#dc2626' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  activeLabel: { color: '#059669' },
  inactiveLabel: { color: '#dc2626' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorCircle: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorCircleSelected: { borderColor: '#111827', borderWidth: 3 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb',
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  previewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  previewCode: { fontSize: 12, color: '#6b7280' },
  activeChip: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  activeChipText: { fontSize: 12, color: '#059669', fontWeight: '700' },
  inactiveChip: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  inactiveChipText: { fontSize: 12, color: '#dc2626', fontWeight: '700' },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

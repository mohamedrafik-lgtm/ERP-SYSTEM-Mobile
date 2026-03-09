import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Switch, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import type { StaffAttendanceSettings, StaffHoliday, StaffAttendanceEnrollment } from '../types/staffAttendance';

const DAYS_OF_WEEK = [
  { key: 'SUNDAY', label: 'الأحد' },
  { key: 'MONDAY', label: 'الإثنين' },
  { key: 'TUESDAY', label: 'الثلاثاء' },
  { key: 'WEDNESDAY', label: 'الأربعاء' },
  { key: 'THURSDAY', label: 'الخميس' },
  { key: 'FRIDAY', label: 'الجمعة' },
  { key: 'SATURDAY', label: 'السبت' },
];

const StaffAttendanceSettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'settings' | 'holidays' | 'enrollments'>('settings');
  const [settings, setSettings] = useState<StaffAttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<StaffHoliday[]>([]);
  const [enrollments, setEnrollments] = useState<StaffAttendanceEnrollment[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', endDate: '', isRecurring: false });
  const [creatingHoliday, setCreatingHoliday] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [settingsData, holidaysData, enrollData] = await Promise.all([
        AuthService.getStaffAttendanceSettings().catch(() => null),
        AuthService.getStaffHolidays().catch(() => []),
        AuthService.getStaffEnrollments(true).catch(() => []),
      ]);
      setSettings(settingsData);
      setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      setEnrollments(Array.isArray(enrollData) ? enrollData : []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await AuthService.updateStaffAttendanceSettings(settings);
      Toast.show({ type: 'success', text1: 'تم الحفظ', text2: 'تم تحديث الإعدادات بنجاح' });
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const toggleOffDay = (day: string) => {
    if (!settings) return;
    const current = settings.weeklyOffDays || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setSettings({ ...settings, weeklyOffDays: updated });
  };

  const handleCreateHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم وتاريخ العطلة');
      return;
    }
    setCreatingHoliday(true);
    try {
      await AuthService.createStaffHoliday({
        name: holidayForm.name,
        date: holidayForm.date,
        endDate: holidayForm.endDate || undefined,
        isRecurring: holidayForm.isRecurring,
      });
      Toast.show({ type: 'success', text1: 'تم الإضافة', text2: 'تمت إضافة العطلة بنجاح' });
      setShowHolidayModal(false);
      setHolidayForm({ name: '', date: '', endDate: '', isRecurring: false });
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل في إضافة العطلة');
    } finally {
      setCreatingHoliday(false);
    }
  };

  const handleDeleteHoliday = (holiday: StaffHoliday) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف عطلة "${holiday.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive', onPress: async () => {
          try {
            await AuthService.deleteStaffHoliday(holiday.id);
            Toast.show({ type: 'success', text1: 'تم الحذف' });
            loadData();
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل الحذف');
          }
        },
      },
    ]);
  };

  const handleUnenroll = (enrollment: StaffAttendanceEnrollment) => {
    Alert.alert('تأكيد الإزالة', `هل تريد إزالة "${enrollment.user.name}" من نظام الحضور؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إزالة', style: 'destructive', onPress: async () => {
          try {
            await AuthService.unenrollStaff(enrollment.userId);
            Toast.show({ type: 'success', text1: 'تم الإزالة' });
            loadData();
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل الإزالة');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceSettings" />
          <Text style={styles.headerTitle}>إعدادات الحضور</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceSettings" />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إعدادات الحضور</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'settings', label: 'الإعدادات', icon: 'settings' },
          { key: 'holidays', label: 'العطلات', icon: 'event' },
          { key: 'enrollments', label: 'الموظفين', icon: 'people' },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key as any)}>
            <Icon name={t.icon} size={16} color={tab === t.key ? '#1a237e' : '#6b7280'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* === SETTINGS TAB === */}
        {tab === 'settings' && settings && (
          <View style={{ gap: 12 }}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>مواعيد العمل</Text>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>وقت البداية</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.workStartTime}
                    onChangeText={v => setSettings({ ...settings, workStartTime: v })}
                    placeholder="09:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>وقت النهاية</Text>
                  <TextInput
                    style={styles.input}
                    value={settings.workEndTime}
                    onChangeText={v => setSettings({ ...settings, workEndTime: v })}
                    placeholder="17:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ساعات العمل/يوم</Text>
                  <TextInput
                    style={styles.input}
                    value={String(settings.workHoursPerDay)}
                    onChangeText={v => setSettings({ ...settings, workHoursPerDay: parseFloat(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>حد التأخير (دقيقة)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(settings.lateThresholdMinutes)}
                    onChangeText={v => setSettings({ ...settings, lateThresholdMinutes: parseInt(v, 10) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>أيام العطلة الأسبوعية</Text>
              <View style={styles.daysGrid}>
                {DAYS_OF_WEEK.map(day => {
                  const isOff = settings.weeklyOffDays?.includes(day.key);
                  return (
                    <TouchableOpacity
                      key={day.key}
                      style={[styles.dayChip, isOff && styles.dayChipActive]}
                      onPress={() => toggleOffDay(day.key)}
                    >
                      <Text style={[styles.dayChipText, isOff && { color: '#fff' }]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>إعدادات الموقع</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>مطلوب تسجيل الحضور بالموقع</Text>
                <Switch
                  value={settings.requireCheckInLocation}
                  onValueChange={v => setSettings({ ...settings, requireCheckInLocation: v })}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={settings.requireCheckInLocation ? '#1a237e' : '#9ca3af'}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>مطلوب تسجيل الانصراف بالموقع</Text>
                <Switch
                  value={settings.requireCheckOutLocation}
                  onValueChange={v => setSettings({ ...settings, requireCheckOutLocation: v })}
                  trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                  thumbColor={settings.requireCheckOutLocation ? '#1a237e' : '#9ca3af'}
                />
              </View>
              {(settings.requireCheckInLocation || settings.requireCheckOutLocation) && (
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>نطاق المسافة (متر)</Text>
                    <TextInput
                      style={styles.input}
                      value={String(settings.locationRadius)}
                      onChangeText={v => setSettings({ ...settings, locationRadius: parseInt(v, 10) || 200 })}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveSettings}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>حفظ الإعدادات</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* === HOLIDAYS TAB === */}
        {tab === 'holidays' && (
          <View style={{ gap: 12 }}>
            <TouchableOpacity style={styles.addCard} onPress={() => setShowHolidayModal(true)}>
              <Icon name="add-circle" size={20} color="#1a237e" />
              <Text style={styles.addCardText}>إضافة عطلة جديدة</Text>
            </TouchableOpacity>

            {holidays.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="event" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>لا توجد عطلات مسجلة</Text>
              </View>
            ) : holidays.map(holiday => (
              <View key={holiday.id} style={styles.card}>
                <View style={styles.holidayRow}>
                  <View style={styles.holidayIcon}>
                    <Icon name="celebration" size={20} color="#7c3aed" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.holidayName}>{holiday.name}</Text>
                    <Text style={styles.holidayDate}>
                      {formatDate(holiday.date)}{holiday.endDate ? ` → ${formatDate(holiday.endDate)}` : ''}
                    </Text>
                    {holiday.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Icon name="repeat" size={12} color="#7c3aed" />
                        <Text style={{ fontSize: 11, color: '#7c3aed', fontWeight: '600' }}>متكررة سنوياً</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteHoliday(holiday)}>
                    <Icon name="delete" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* === ENROLLMENTS TAB === */}
        {tab === 'enrollments' && (
          <View style={{ gap: 10 }}>
            <View style={styles.enrollHeader}>
              <Text style={styles.enrollCount}>
                <Icon name="people" size={16} color="#1a237e" /> {enrollments.length} موظف مسجل
              </Text>
            </View>

            {enrollments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon name="person-off" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>لا يوجد موظفين مسجلين</Text>
              </View>
            ) : enrollments.map(enr => (
              <View key={enr.userId} style={styles.card}>
                <View style={styles.enrollRow}>
                  <View style={styles.enrollAvatar}>
                    <Text style={styles.enrollAvatarText}>{enr.user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enrollName}>{enr.user.name}</Text>
                    <Text style={styles.enrollEmail}>{enr.user.email}</Text>
                    {enr.customWorkStartTime && (
                      <Text style={styles.enrollCustom}>
                        ⏰ {enr.customWorkStartTime} - {enr.customWorkEndTime}
                      </Text>
                    )}
                  </View>
                  <View style={styles.enrollActions}>
                    <View style={[styles.activeBadge, { backgroundColor: enr.isActive ? '#ecfdf5' : '#f3f4f6' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: enr.isActive ? '#059669' : '#6b7280' }}>
                        {enr.isActive ? 'نشط' : 'غير نشط'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleUnenroll(enr)}>
                      <Icon name="person-remove" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Holiday Modal */}
      <Modal visible={showHolidayModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة عطلة</Text>
              <TouchableOpacity onPress={() => setShowHolidayModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>اسم العطلة *</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: عيد الفطر"
              placeholderTextColor="#9ca3af"
              value={holidayForm.name}
              onChangeText={v => setHolidayForm(p => ({ ...p, name: v }))}
            />

            <Text style={styles.inputLabel}>تاريخ البداية * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 2026-04-01"
              placeholderTextColor="#9ca3af"
              value={holidayForm.date}
              onChangeText={v => setHolidayForm(p => ({ ...p, date: v }))}
            />

            <Text style={styles.inputLabel}>تاريخ النهاية (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="اختياري"
              placeholderTextColor="#9ca3af"
              value={holidayForm.endDate}
              onChangeText={v => setHolidayForm(p => ({ ...p, endDate: v }))}
            />

            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <Text style={styles.switchLabel}>متكررة سنوياً</Text>
              <Switch
                value={holidayForm.isRecurring}
                onValueChange={v => setHolidayForm(p => ({ ...p, isRecurring: v }))}
                trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                thumbColor={holidayForm.isRecurring ? '#1a237e' : '#9ca3af'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, creatingHoliday && { opacity: 0.6 }, { marginTop: 16 }]}
              onPress={handleCreateHoliday}
              disabled={creatingHoliday}
            >
              {creatingHoliday ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Icon name="add" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>إضافة العطلة</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StaffAttendanceSettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 8, marginRight: 12, borderRadius: 8, backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#1a237e' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1a237e' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#1a237e', fontWeight: '800' },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a237e', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  dayChipActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Holidays
  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed',
  },
  addCardText: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  holidayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  holidayIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center' },
  holidayName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  holidayDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },

  // Enrollments
  enrollHeader: { paddingVertical: 4 },
  enrollCount: { fontSize: 14, fontWeight: '700', color: '#1a237e' },
  enrollRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  enrollAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  enrollAvatarText: { fontSize: 16, fontWeight: '800', color: '#374151' },
  enrollName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  enrollEmail: { fontSize: 12, color: '#6b7280' },
  enrollCustom: { fontSize: 11, color: '#3b82f6', marginTop: 2 },
  enrollActions: { alignItems: 'flex-end', gap: 6 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a237e' },
});

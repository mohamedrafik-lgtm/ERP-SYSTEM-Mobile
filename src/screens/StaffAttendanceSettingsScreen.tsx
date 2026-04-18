import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Switch, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import DateTimePickerField from '../components/DateTimePickerField';
import AuthService from '../services/AuthService';
import {usePermissions} from '../hooks/usePermissions';
import type {
  StaffAttendanceSettings, StaffHoliday, StaffAttendanceZone,
} from '../types/staffAttendance';

const DAYS_OF_WEEK = [
  {key: 'SUNDAY', label: 'الأحد'},
  {key: 'MONDAY', label: 'الإثنين'},
  {key: 'TUESDAY', label: 'الثلاثاء'},
  {key: 'WEDNESDAY', label: 'الأربعاء'},
  {key: 'THURSDAY', label: 'الخميس'},
  {key: 'FRIDAY', label: 'الجمعة'},
  {key: 'SATURDAY', label: 'السبت'},
];

const TIMEZONES = [
  {key: 'Africa/Cairo', label: 'القاهرة (UTC+2)'},
  {key: 'Asia/Riyadh', label: 'الرياض (UTC+3)'},
  {key: 'Asia/Dubai', label: 'دبي (UTC+4)'},
  {key: 'Asia/Kuwait', label: 'الكويت (UTC+3)'},
  {key: 'Asia/Amman', label: 'عمّان (UTC+3)'},
  {key: 'Asia/Beirut', label: 'بيروت (UTC+2)'},
  {key: 'Asia/Baghdad', label: 'بغداد (UTC+3)'},
  {key: 'Africa/Tripoli', label: 'طرابلس (UTC+2)'},
  {key: 'Africa/Tunis', label: 'تونس (UTC+1)'},
  {key: 'Africa/Casablanca', label: 'الدار البيضاء (UTC+1)'},
  {key: 'Asia/Jerusalem', label: 'القدس (UTC+2)'},
  {key: 'Africa/Khartoum', label: 'الخرطوم (UTC+2)'},
  {key: 'Asia/Muscat', label: 'مسقط (UTC+4)'},
];

const ZONE_COLORS = ['#059669', '#dc2626', '#3b82f6', '#d97706', '#7c3aed', '#ec4899', '#0891b2', '#4b5563'];

const StaffAttendanceSettingsScreen = ({navigation}: any) => {
  const {hasPermission, hasScreenAction} = usePermissions();
  const canManageSettings = hasPermission('staff-attendance.settings', 'manage');
  const canManageHolidays = hasScreenAction('StaffAttendanceSettings', 'manageHolidays');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'settings' | 'holidays' | 'zones'>('settings');
  const [settings, setSettings] = useState<StaffAttendanceSettings | null>(null);
  const [holidays, setHolidays] = useState<StaffHoliday[]>([]);
  const [zones, setZones] = useState<StaffAttendanceZone[]>([]);

  // Holiday modal
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<StaffHoliday | null>(null);
  const [holidayForm, setHolidayForm] = useState({name: '', date: '', endDate: '', isRecurring: false});
  const [savingHoliday, setSavingHoliday] = useState(false);

  // Zone modal
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<StaffAttendanceZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '', latitude: '', longitude: '', radius: '200', color: '#3b82f6', isGlobal: true,
  });
  const [savingZone, setSavingZone] = useState(false);

  // Timezone picker
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [settingsData, holidaysData, zonesData] = await Promise.all([
        AuthService.getStaffAttendanceSettings().catch(() => null),
        AuthService.getStaffHolidays().catch(() => []),
        AuthService.getStaffZones().catch(() => []),
      ]);
      setSettings(settingsData);
      setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      setZones(Array.isArray(zonesData) ? zonesData : []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ===== Settings =====
  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await AuthService.updateStaffAttendanceSettings(settings);
      Toast.show({type: 'success', text1: 'تم الحفظ', text2: 'تم تحديث الإعدادات بنجاح'});
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
    setSettings({...settings, weeklyOffDays: updated});
  };

  // ===== Holidays =====
  const openAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({name: '', date: '', endDate: '', isRecurring: false});
    setShowHolidayModal(true);
  };

  const openEditHoliday = (h: StaffHoliday) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      date: h.date?.split('T')[0] || '',
      endDate: h.endDate?.split('T')[0] || '',
      isRecurring: h.isRecurring,
    });
    setShowHolidayModal(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم وتاريخ العطلة');
      return;
    }
    setSavingHoliday(true);
    try {
      const data = {
        name: holidayForm.name,
        date: holidayForm.date,
        endDate: holidayForm.endDate || undefined,
        isRecurring: holidayForm.isRecurring,
      };
      if (editingHoliday) {
        await AuthService.updateStaffHoliday(editingHoliday.id, data);
        Toast.show({type: 'success', text1: 'تم التحديث'});
      } else {
        await AuthService.createStaffHoliday(data);
        Toast.show({type: 'success', text1: 'تمت الإضافة'});
      }
      setShowHolidayModal(false);
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل العملية');
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = (holiday: StaffHoliday) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف عطلة "${holiday.name}"؟`, [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deleteStaffHoliday(holiday.id);
            Toast.show({type: 'success', text1: 'تم الحذف'});
            loadData();
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل الحذف');
          }
        },
      },
    ]);
  };

  // ===== Zones =====
  const handleSaveZone = async () => {
    if (!zoneForm.name || (!editingZone && (!zoneForm.latitude || !zoneForm.longitude))) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المنطقة والإحداثيات');
      return;
    }
    setSavingZone(true);
    try {
      if (editingZone) {
        await AuthService.updateStaffZone(editingZone.id, {
          name: zoneForm.name,
          radius: parseInt(zoneForm.radius, 10) || 200,
          isGlobal: zoneForm.isGlobal,
        });
        Toast.show({type: 'success', text1: 'تم تحديث المنطقة'});
      } else {
        await AuthService.createStaffZone({
          name: zoneForm.name,
          latitude: parseFloat(zoneForm.latitude),
          longitude: parseFloat(zoneForm.longitude),
          radius: parseInt(zoneForm.radius, 10) || 200,
          color: zoneForm.color,
          isGlobal: zoneForm.isGlobal,
        });
        Toast.show({type: 'success', text1: 'تمت إضافة المنطقة'});
      }
      setShowZoneModal(false);
      setEditingZone(null);
      setZoneForm({name: '', latitude: '', longitude: '', radius: '200', color: '#3b82f6', isGlobal: true});
      loadData();
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل العملية');
    } finally {
      setSavingZone(false);
    }
  };

  const openEditZone = (zone: StaffAttendanceZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      latitude: String(zone.latitude),
      longitude: String(zone.longitude),
      radius: String(zone.radius),
      color: zone.color || '#3b82f6',
      isGlobal: zone.isGlobal,
    });
    setShowZoneModal(true);
  };

  const handleDeleteZone = (zone: StaffAttendanceZone) => {
    Alert.alert('تأكيد الحذف', `هل تريد حذف منطقة "${zone.name}"؟`, [
      {text: 'إلغاء', style: 'cancel'},
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await AuthService.deleteStaffZone(zone.id);
            Toast.show({type: 'success', text1: 'تم الحذف'});
            loadData();
          } catch (e: any) {
            Alert.alert('خطأ', e.message || 'فشل الحذف');
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', {day: 'numeric', month: 'short', year: 'numeric'});
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceSettings" />
          <Text style={s.headerTitle}>إعدادات الحضور</Text>
          <View style={{width: 44}} />
        </View>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#1a237e" />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <CustomMenu navigation={navigation} activeRouteName="StaffAttendanceSettings" />
        <Text style={s.headerTitle}>إعدادات الحضور</Text>
        <View style={{width: 44}} />
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {([
          {key: 'settings', label: 'الإعدادات', icon: 'settings'},
          {key: 'holidays', label: 'العطلات', icon: 'event'},
          {key: 'zones', label: 'المناطق', icon: 'location-on'},
        ] as const).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}>
            <Icon name={t.icon} size={16} color={tab === t.key ? '#1a237e' : '#6b7280'} />
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 30}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        {/* ===== SETTINGS TAB ===== */}
        {tab === 'settings' && settings && (
          <View style={{gap: 12}}>
            {/* System active */}
            <View style={s.card}>
              <View style={s.switchRow}>
                <View style={{flex: 1}}>
                  <Text style={s.switchLabel}>النظام نشط</Text>
                  <Text style={s.switchSub}>تفعيل أو تعطيل نظام الحضور</Text>
                </View>
                <Switch
                  value={settings.isActive}
                  onValueChange={v => setSettings({...settings, isActive: v})}
                  trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                  thumbColor={settings.isActive ? '#1a237e' : '#9ca3af'}
                />
              </View>
            </View>

            {/* Timezone */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>المنطقة الزمنية</Text>
              <TouchableOpacity style={s.tzBtn} onPress={() => setShowTimezonePicker(true)}>
                <Icon name="public" size={18} color="#1a237e" />
                <Text style={s.tzText}>
                  {TIMEZONES.find(tz => tz.key === settings.timezone)?.label || settings.timezone}
                </Text>
                <Icon name="arrow-drop-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Work Hours */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>مواعيد العمل</Text>
              <View style={s.row}>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>وقت البداية</Text>
                  <TextInput
                    style={s.input}
                    value={settings.workStartTime}
                    onChangeText={v => setSettings({...settings, workStartTime: v})}
                    placeholder="09:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>وقت النهاية</Text>
                  <TextInput
                    style={s.input}
                    value={settings.workEndTime}
                    onChangeText={v => setSettings({...settings, workEndTime: v})}
                    placeholder="17:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
              <View style={s.row}>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>ساعات/يوم</Text>
                  <TextInput
                    style={s.input}
                    value={String(settings.workHoursPerDay)}
                    onChangeText={v => setSettings({...settings, workHoursPerDay: parseFloat(v) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{flex: 1}} />
              </View>
            </View>

            {/* Late / Early Leave */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>إعدادات التأخير والانصراف المبكر</Text>
              <View style={s.row}>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>حد التأخير (دقيقة)</Text>
                  <TextInput
                    style={s.input}
                    value={String(settings.lateThresholdMinutes)}
                    onChangeText={v => setSettings({...settings, lateThresholdMinutes: parseInt(v, 10) || 0})}
                    keyboardType="numeric"
                  />
                </View>
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>حد الانصراف المبكر (دقيقة)</Text>
                  <TextInput
                    style={s.input}
                    value={String(settings.earlyLeaveThreshold)}
                    onChangeText={v => setSettings({...settings, earlyLeaveThreshold: parseInt(v, 10) || 0})}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Weekly Off Days */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>أيام الإجازة الأسبوعية</Text>
              <View style={s.daysGrid}>
                {DAYS_OF_WEEK.map(day => {
                  const isOff = settings.weeklyOffDays?.includes(day.key);
                  return (
                    <TouchableOpacity
                      key={day.key}
                      style={[s.dayChip, isOff && s.dayChipActive]}
                      onPress={() => toggleOffDay(day.key)}>
                      <Text style={[s.dayChipText, isOff && {color: '#fff'}]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location Settings */}
            <View style={s.card}>
              <Text style={s.sectionTitle}>إعدادات الموقع</Text>

              {/* Master toggle - matches web's requireLocation */}
              <View style={s.switchRow}>
                <View style={{flex: 1}}>
                  <Text style={s.switchLabel}>
                    {settings.requireLocation ? 'نظام الموقع الجغرافي مفعّل' : 'نظام الموقع الجغرافي معطّل'}
                  </Text>
                  <Text style={s.switchSub}>
                    {settings.requireLocation
                      ? 'حدد المناطق المسموحة وفعّل الإلزام للحضور والانصراف بشكل منفصل'
                      : 'يمكن للموظفين تسجيل الحضور والانصراف من أي مكان'
                    }
                  </Text>
                </View>
                <Switch
                  value={settings.requireLocation}
                  onValueChange={v => setSettings({
                    ...settings,
                    requireLocation: v,
                    requireCheckInLocation: v ? settings.requireCheckInLocation : false,
                    requireCheckOutLocation: v ? settings.requireCheckOutLocation : false,
                  })}
                  trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                  thumbColor={settings.requireLocation ? '#1a237e' : '#9ca3af'}
                />
              </View>

              {/* Sub-toggles - only shown when master is on */}
              {settings.requireLocation && (
                <>
                  <View style={[s.switchRow, {backgroundColor: '#f0f4ff', borderRadius: 10, paddingHorizontal: 12, marginTop: 8}]}>
                    <View style={{flex: 1}}>
                      <Text style={s.switchLabel}>إلزام الموقع عند الحضور</Text>
                      <Text style={s.switchSub}>
                        {settings.requireCheckInLocation
                          ? 'يجب التواجد في منطقة مسموحة لتسجيل الحضور'
                          : 'يسمح بتسجيل الحضور من أي مكان'
                        }
                      </Text>
                    </View>
                    <Switch
                      value={settings.requireCheckInLocation}
                      onValueChange={v => setSettings({...settings, requireCheckInLocation: v})}
                      trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                      thumbColor={settings.requireCheckInLocation ? '#1a237e' : '#9ca3af'}
                    />
                  </View>
                  <View style={[s.switchRow, {backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 12, marginTop: 8}]}>
                    <View style={{flex: 1}}>
                      <Text style={s.switchLabel}>إلزام الموقع عند الانصراف</Text>
                      <Text style={s.switchSub}>
                        {settings.requireCheckOutLocation
                          ? 'يجب التواجد في منطقة مسموحة لتسجيل الانصراف'
                          : 'يسمح بتسجيل الانصراف من أي مكان'
                        }
                      </Text>
                    </View>
                    <Switch
                      value={settings.requireCheckOutLocation}
                      onValueChange={v => setSettings({...settings, requireCheckOutLocation: v})}
                      trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                      thumbColor={settings.requireCheckOutLocation ? '#1a237e' : '#9ca3af'}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Save Button */}
            {canManageSettings && (
              <TouchableOpacity
                style={[s.saveBtn, saving && {opacity: 0.6}]}
                onPress={handleSaveSettings}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="save" size={20} color="#fff" />
                    <Text style={s.saveBtnText}>حفظ الإعدادات</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ===== HOLIDAYS TAB ===== */}
        {tab === 'holidays' && (
          <View style={{gap: 12}}>
            {canManageHolidays && (
              <TouchableOpacity style={s.addCard} onPress={openAddHoliday}>
                <Icon name="add-circle" size={20} color="#1a237e" />
                <Text style={s.addCardText}>إضافة عطلة جديدة</Text>
              </TouchableOpacity>
            )}

            {holidays.length === 0 ? (
              <View style={s.emptyBox}>
                <Icon name="event" size={48} color="#d1d5db" />
                <Text style={s.emptyText}>لا توجد عطلات مسجلة</Text>
              </View>
            ) : (
              holidays.map(holiday => (
                <View key={holiday.id} style={s.card}>
                  <View style={s.holidayRow}>
                    <View style={s.holidayIcon}>
                      <Icon name="celebration" size={20} color="#7c3aed" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={s.holidayName}>{holiday.name}</Text>
                      <Text style={s.holidayDate}>
                        {formatDate(holiday.date)}
                        {holiday.endDate ? ` → ${formatDate(holiday.endDate)}` : ''}
                      </Text>
                      {holiday.isRecurring && (
                        <View style={s.recurringBadge}>
                          <Icon name="repeat" size={12} color="#7c3aed" />
                          <Text style={{fontSize: 11, color: '#7c3aed', fontWeight: '600'}}>
                            متكررة سنوياً
                          </Text>
                        </View>
                      )}
                    </View>
                    {canManageHolidays && (
                      <View style={{flexDirection: 'row', gap: 6}}>
                        <TouchableOpacity style={s.editBtn} onPress={() => openEditHoliday(holiday)}>
                          <Icon name="edit" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteHoliday(holiday)}>
                          <Icon name="delete" size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ===== ZONES TAB ===== */}
        {tab === 'zones' && (
          <View style={{gap: 12}}>
            {canManageSettings && (
              <TouchableOpacity
                style={s.addCard}
                onPress={() => {
                  setEditingZone(null);
                  setZoneForm({name: '', latitude: '', longitude: '', radius: '200', color: '#3b82f6', isGlobal: true});
                  setShowZoneModal(true);
                }}>
                <Icon name="add-location" size={20} color="#1a237e" />
                <Text style={s.addCardText}>إضافة منطقة جديدة</Text>
              </TouchableOpacity>
            )}

            {zones.length === 0 ? (
              <View style={s.emptyBox}>
                <Icon name="location-off" size={48} color="#d1d5db" />
                <Text style={s.emptyText}>لا توجد مناطق</Text>
                <Text style={{fontSize: 12, color: '#9ca3af', textAlign: 'center'}}>
                  أضف مناطق جغرافية للتحقق من موقع الموظفين
                </Text>
              </View>
            ) : (
              zones.map(zone => (
                <View key={zone.id} style={s.card}>
                  <View style={s.zoneRow}>
                    <View style={[s.zoneColor, {backgroundColor: zone.color || '#3b82f6'}]} />
                    <View style={{flex: 1}}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        <Text style={s.zoneName}>{zone.name}</Text>
                        {zone.isGlobal && (
                          <View style={s.globalBadge}>
                            <Text style={s.globalBadgeText}>عامة</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.zoneCoords}>
                        {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                      </Text>
                      <Text style={s.zoneRadius}>
                        نطاق: {zone.radius >= 1000 ? `${(zone.radius / 1000).toFixed(1)} كم` : `${zone.radius} م`}
                      </Text>
                    </View>
                    {canManageSettings && (
                      <View style={{flexDirection: 'row', gap: 6}}>
                        <TouchableOpacity style={s.editBtn} onPress={() => openEditZone(zone)}>
                          <Icon name="edit" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteZone(zone)}>
                          <Icon name="delete" size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ===== HOLIDAY MODAL ===== */}
      <Modal visible={showHolidayModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {editingHoliday ? 'تعديل العطلة' : 'إضافة عطلة'}
              </Text>
              <TouchableOpacity onPress={() => setShowHolidayModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>اسم العطلة *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: عيد الفطر"
              placeholderTextColor="#9ca3af"
              value={holidayForm.name}
              onChangeText={v => setHolidayForm(p => ({...p, name: v}))}
            />

            <DateTimePickerField
              label="تاريخ البداية *"
              value={holidayForm.date}
              onChange={v => setHolidayForm(p => ({...p, date: v}))}
              placeholder="اختر تاريخ البداية"
              mode="date"
            />

            <DateTimePickerField
              label="تاريخ النهاية (اختياري)"
              value={holidayForm.endDate}
              onChange={v => setHolidayForm(p => ({...p, endDate: v}))}
              placeholder="اختر تاريخ النهاية"
              mode="date"
            />

            <View style={[s.switchRow, {marginTop: 12}]}>
              <Text style={s.switchLabel}>متكررة سنوياً</Text>
              <Switch
                value={holidayForm.isRecurring}
                onValueChange={v => setHolidayForm(p => ({...p, isRecurring: v}))}
                trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                thumbColor={holidayForm.isRecurring ? '#1a237e' : '#9ca3af'}
              />
            </View>

            <TouchableOpacity
              style={[s.saveBtn, savingHoliday && {opacity: 0.6}, {marginTop: 16}]}
              onPress={handleSaveHoliday}
              disabled={savingHoliday}>
              {savingHoliday ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name={editingHoliday ? 'save' : 'add'} size={20} color="#fff" />
                  <Text style={s.saveBtnText}>
                    {editingHoliday ? 'حفظ التعديلات' : 'إضافة العطلة'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== ZONE MODAL ===== */}
      <Modal visible={showZoneModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingZone ? 'تعديل المنطقة' : 'إضافة منطقة'}</Text>
              <TouchableOpacity onPress={() => { setShowZoneModal(false); setEditingZone(null); }}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>اسم المنطقة *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: المكتب الرئيسي"
              placeholderTextColor="#9ca3af"
              value={zoneForm.name}
              onChangeText={v => setZoneForm(p => ({...p, name: v}))}
            />

            <View style={s.row}>
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>خط العرض *</Text>
                <TextInput
                  style={s.input}
                  placeholder="30.0444"
                  placeholderTextColor="#9ca3af"
                  value={zoneForm.latitude}
                  onChangeText={v => setZoneForm(p => ({...p, latitude: v}))}
                  keyboardType="numeric"
                />
              </View>
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>خط الطول *</Text>
                <TextInput
                  style={s.input}
                  placeholder="31.2357"
                  placeholderTextColor="#9ca3af"
                  value={zoneForm.longitude}
                  onChangeText={v => setZoneForm(p => ({...p, longitude: v}))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={s.inputLabel}>نطاق المنطقة (بالمتر)</Text>
            <TextInput
              style={s.input}
              placeholder="200"
              placeholderTextColor="#9ca3af"
              value={zoneForm.radius}
              onChangeText={v => setZoneForm(p => ({...p, radius: v}))}
              keyboardType="numeric"
            />

            <Text style={s.inputLabel}>اللون</Text>
            <View style={s.colorGrid}>
              {ZONE_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    s.colorOption,
                    {backgroundColor: c},
                    zoneForm.color === c && s.colorOptionActive,
                  ]}
                  onPress={() => setZoneForm(p => ({...p, color: c}))}
                />
              ))}
            </View>

            <View style={[s.switchRow, {marginTop: 12}]}>
              <View style={{flex: 1}}>
                <Text style={s.switchLabel}>منطقة عامة</Text>
                <Text style={s.switchSub}>متاحة لجميع الموظفين</Text>
              </View>
              <Switch
                value={zoneForm.isGlobal}
                onValueChange={v => setZoneForm(p => ({...p, isGlobal: v}))}
                trackColor={{false: '#e5e7eb', true: '#a5b4fc'}}
                thumbColor={zoneForm.isGlobal ? '#1a237e' : '#9ca3af'}
              />
            </View>

            <TouchableOpacity
              style={[s.saveBtn, savingZone && {opacity: 0.6}, {marginTop: 16}]}
              onPress={handleSaveZone}
              disabled={savingZone}>
              {savingZone ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name={editingZone ? 'save' : 'add-location'} size={20} color="#fff" />
                  <Text style={s.saveBtnText}>{editingZone ? 'حفظ التعديلات' : 'إضافة المنطقة'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== TIMEZONE PICKER MODAL ===== */}
      <Modal visible={showTimezonePicker} animationType="fade" transparent>
        <TouchableOpacity
          style={s.modalOverlayCenter}
          activeOpacity={1}
          onPress={() => setShowTimezonePicker(false)}>
          <View style={s.pickerBox}>
            <Text style={s.pickerTitle}>اختر المنطقة الزمنية</Text>
            <ScrollView style={{maxHeight: 350}}>
              {TIMEZONES.map(tz => (
                <TouchableOpacity
                  key={tz.key}
                  style={[s.tzOption, settings?.timezone === tz.key && s.tzOptionActive]}
                  onPress={() => {
                    if (settings) setSettings({...settings, timezone: tz.key});
                    setShowTimezonePicker(false);
                  }}>
                  <Text
                    style={[
                      s.tzOptionText,
                      settings?.timezone === tz.key && {color: '#1a237e', fontWeight: '800'},
                    ]}>
                    {tz.label}
                  </Text>
                  {settings?.timezone === tz.key && (
                    <Icon name="check" size={18} color="#1a237e" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default StaffAttendanceSettingsScreen;

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6fa', paddingTop: 40},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  centerBox: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tabBar: {flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'},
  tab: {flex: 1, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4},
  tabActive: {borderBottomWidth: 2, borderBottomColor: '#1a237e'},
  tabText: {fontSize: 13, fontWeight: '600', color: '#6b7280'},
  tabTextActive: {color: '#1a237e', fontWeight: '800'},
  content: {flex: 1, padding: 16},
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  sectionTitle: {fontSize: 15, fontWeight: '800', color: '#1a237e', marginBottom: 12},
  row: {flexDirection: 'row', gap: 10, marginBottom: 10},
  inputGroup: {flex: 1},
  inputLabel: {fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4, marginTop: 8},
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827',
  },
  daysGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dayChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb'},
  dayChipActive: {backgroundColor: '#dc2626', borderColor: '#dc2626'},
  dayChipText: {fontSize: 13, fontWeight: '600', color: '#374151'},
  switchRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8},
  switchLabel: {fontSize: 14, color: '#374151', fontWeight: '600'},
  switchSub: {fontSize: 11, color: '#9ca3af', marginTop: 2},
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1a237e', borderRadius: 12, paddingVertical: 14, marginTop: 8,
  },
  saveBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},

  // Timezone
  tzBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#c7d2fe',
    borderRadius: 10, padding: 12,
  },
  tzText: {flex: 1, fontSize: 14, fontWeight: '600', color: '#1a237e'},

  // Holidays
  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed',
  },
  addCardText: {fontSize: 14, fontWeight: '700', color: '#1a237e'},
  emptyBox: {alignItems: 'center', padding: 40, gap: 12},
  emptyText: {fontSize: 14, color: '#6b7280', fontWeight: '600'},
  holidayRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  holidayIcon: {width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center'},
  holidayName: {fontSize: 14, fontWeight: '700', color: '#111827'},
  holidayDate: {fontSize: 12, color: '#6b7280', marginTop: 2},
  recurringBadge: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3},
  editBtn: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center'},
  deleteBtn: {width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center'},

  // Zones
  zoneRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  zoneColor: {width: 12, height: 40, borderRadius: 6},
  zoneName: {fontSize: 14, fontWeight: '700', color: '#111827'},
  zoneCoords: {fontSize: 11, color: '#9ca3af', marginTop: 2, fontVariant: ['tabular-nums']},
  zoneRadius: {fontSize: 11, color: '#6b7280', marginTop: 1, fontWeight: '600'},
  globalBadge: {backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999},
  globalBadgeText: {fontSize: 10, fontWeight: '700', color: '#059669'},
  colorGrid: {flexDirection: 'row', gap: 10, marginTop: 6},
  colorOption: {width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent'},
  colorOptionActive: {borderColor: '#111827', borderWidth: 3},

  // Modals
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  modalOverlayCenter: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20},
  modalContent: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16},
  modalTitle: {fontSize: 18, fontWeight: '800', color: '#1a237e'},
  pickerBox: {backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%'},
  pickerTitle: {fontSize: 16, fontWeight: '800', color: '#1a237e', marginBottom: 12},
  tzOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  tzOptionActive: {backgroundColor: '#f0f4ff'},
  tzOptionText: {fontSize: 14, color: '#374151', fontWeight: '500'},
});

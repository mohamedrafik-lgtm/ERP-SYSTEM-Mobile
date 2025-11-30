import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import SelectBox from '../components/SelectBox';
import AuthService from '../services/AuthService';
import StudyMaterialsService from '../services/StudyMaterialsService';
import { styles } from './AddStudyMaterialScreen.styles.ts';

interface AddStudyMaterialScreenProps {
  navigation: any;
  route?: {
    params?: {
      material?: any; // البيانات للتعديل
      mode?: 'add' | 'edit';
    };
  };
}

const AddStudyMaterialScreen: React.FC<AddStudyMaterialScreenProps> = ({ navigation, route }) => {
  // Edit mode detection
  const isEditMode = route?.params?.mode === 'edit';
  const materialToEdit = route?.params?.material;
  // Form State
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [selectedFee, setSelectedFee] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Data from API
  const [programs, setPrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // جلب البرامج والمستخدمين من API
  useEffect(() => {
    fetchPrograms();
    fetchUsers();
    
    // إذا كان Edit mode، تحميل البيانات
    if (isEditMode && materialToEdit) {
      loadMaterialData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // تحميل بيانات الأداة للتعديل
  const loadMaterialData = () => {
    if (!materialToEdit) return;

    console.log('[AddStudyMaterial] Loading material data for edit:', materialToEdit);

    setName(materialToEdit.name || '');
    setNameEn(materialToEdit.nameEn || '');
    setDescription(materialToEdit.description || '');
    setQuantity(materialToEdit.quantity?.toString() || '0');
    setIsActive(materialToEdit.isActive !== false);
    setSelectedProgram(materialToEdit.programId || null);
    setSelectedFee(materialToEdit.linkedFeeId || null);
    
    // تحميل المسؤولين المعينين
    if (materialToEdit.responsibleUsers && Array.isArray(materialToEdit.responsibleUsers)) {
      const userIds = materialToEdit.responsibleUsers.map((ru: any) => ru.userId);
      setSelectedUsers(userIds);
    }
  };

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const data = await AuthService.getAllPrograms();
      setPrograms(data);
      console.log('[AddStudyMaterial] Programs loaded:', data.length);
    } catch (error) {
      console.error('[AddStudyMaterial] Error fetching programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await AuthService.getAllUsers();
      setUsers(data);
      console.log('[AddStudyMaterial] Users loaded:', data.length);
      console.log('[AddStudyMaterial] Users:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[AddStudyMaterial] Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // جلب الرسوم بناءً على البرنامج المختار
  const fetchFees = async (programId: number) => {
    try {
      setLoadingFees(true);
      setFees([]); // مسح الرسوم السابقة
      setSelectedFee(null); // مسح الرسم المختار
      
      console.log('[AddStudyMaterial] ====== Fetching Fees ======');
      console.log('[AddStudyMaterial] Selected Program ID:', programId);
      
      const data = await AuthService.getAllTraineeFees();
      
      console.log('[AddStudyMaterial] Total fees received:', data.length);
      console.log('[AddStudyMaterial] All fees:', JSON.stringify(data, null, 2));
      
      // فلترة الرسوم حسب البرنامج
      const programFees = data.filter((fee: any) => fee.programId === programId);
      
      console.log('[AddStudyMaterial] Filtered fees for program', programId, ':', programFees.length);
      console.log('[AddStudyMaterial] Program fees:', JSON.stringify(programFees, null, 2));
      
      setFees(programFees);
    } catch (error) {
      console.error('[AddStudyMaterial] ====== ERROR Fetching Fees ======');
      console.error('[AddStudyMaterial] Error details:', error);
      console.error('[AddStudyMaterial] Error message:', (error as Error).message);
    } finally {
      setLoadingFees(false);
    }
  };

  // عند تغيير البرنامج، جلب الرسوم الخاصة به
  useEffect(() => {
    if (selectedProgram) {
      fetchFees(selectedProgram);
    } else {
      setFees([]);
      setSelectedFee(null);
    }
  }, [selectedProgram]);

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // الحقول الإجبارية
    if (!name.trim()) {
      errors.push('اسم الأداة مطلوب');
    }

    if (!selectedProgram) {
      errors.push('يجب اختيار البرنامج التدريبي');
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      errors.push('الكمية يجب أن تكون رقم صحيح غير سالب');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Submit Handler
  const handleSubmit = async () => {
    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert(
        'خطأ في البيانات',
        validation.errors.join('\n'),
        [{ text: 'موافق' }]
      );
      return;
    }

    // تأكيد الحفظ
    Alert.alert(
      'تأكيد الحفظ',
      `هل أنت متأكد من إضافة الأداة "${name}"؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حفظ',
          onPress: async () => {
            await submitForm();
          },
        },
      ]
    );
  };

  const submitForm = async () => {
    try {
      setSubmitting(true);

      const payload = {
        // الحقول الإجبارية
        name: name.trim(),
        programId: selectedProgram!,
        quantity: parseInt(quantity),
        
        // الحقول الاختيارية
        ...(nameEn.trim() && { nameEn: nameEn.trim() }),
        ...(description.trim() && { description: description.trim() }),
        ...(selectedFee && { linkedFeeId: selectedFee }),
        isActive,
        ...(selectedUsers.length > 0 && { responsibleUserIds: selectedUsers }),
      };

      console.log('[AddStudyMaterial] ====== Submitting Form ======');
      console.log('[AddStudyMaterial] Mode:', isEditMode ? 'EDIT' : 'ADD');
      console.log('[AddStudyMaterial] Payload:', JSON.stringify(payload, null, 2));

      let result;
      if (isEditMode && materialToEdit?.id) {
        // Edit mode - استخدام update
        console.log('[AddStudyMaterial] Updating material:', materialToEdit.id);
        result = await StudyMaterialsService.updateStudyMaterial(materialToEdit.id, payload);
      } else {
        // Add mode - استخدام create
        console.log('[AddStudyMaterial] Creating new material');
        result = await StudyMaterialsService.createStudyMaterial(payload);
      }

      console.log('[AddStudyMaterial] ====== Success ======');
      console.log('[AddStudyMaterial] Result:', result);

      Toast.show({
        type: 'success',
        text1: 'تم بنجاح',
        text2: isEditMode ? 'تم تحديث الأداة الدراسية بنجاح' : 'تم إضافة الأداة الدراسية بنجاح',
      });

      // العودة للصفحة السابقة بعد 1.5 ثانية
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error('[AddStudyMaterial] ====== ERROR Submitting ======');
      console.error('[AddStudyMaterial] Error:', error);

      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: (error as Error).message || 'فشل في إضافة الأداة الدراسية',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>إضافة أداة دراسية جديدة</Text>
          <Text style={styles.subtitle}>أدخل بيانات الأداة الدراسية</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* المعلومات الأساسية */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

            {/* اسم الأداة */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم الأداة *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: كتاب الرياضيات"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* اسم الأداة بالإنجليزية */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم الأداة بالإنجليزية</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: Mathematics Book"
                placeholderTextColor="#9ca3af"
                value={nameEn}
                onChangeText={setNameEn}
              />
            </View>

            {/* البرنامج التدريبي */}
            <SelectBox<number>
              label="البرنامج التدريبي *"
              selectedValue={selectedProgram || undefined}
              onValueChange={(value: number) => setSelectedProgram(value)}
              items={programs.map(p => ({
                value: p.id,
                label: p.nameAr
              }))}
              placeholder="-- اختر البرنامج..."
              loading={loadingPrograms}
            />
          </View>

          {/* إعدادات التسليم */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إعدادات التسليم</Text>

            {/* الرسم المطلوب */}
            <SelectBox<number>
              label="الرسم المطلوب سداده للتسليم"
              selectedValue={selectedFee || undefined}
              onValueChange={(value: number) => setSelectedFee(value)}
              items={fees.map(f => ({
                value: f.id,
                label: `${f.name} - ${f.amount} جنيه`
              }))}
              placeholder="يجب أن يدفع (0) جم ليتمكن..."
              loading={loadingFees}
              disabled={!selectedProgram}
            />
          </View>

          {/* المسؤولون عن التسليم */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>المسؤولون عن التسليم الاختياري</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>اختياري</Text>
              </View>
            </View>

            {/* قائمة المستخدمين */}
            {loadingUsers ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.loadingText}>جاري تحميل المستخدمين...</Text>
              </View>
            ) : users.length === 0 ? (
              <Text style={styles.emptyText}>لا يوجد مستخدمين متاحين</Text>
            ) : (
              <View style={styles.usersList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => toggleUserSelection(user.id)}
                  >
                    <View style={styles.checkbox}>
                      {selectedUsers.includes(user.id) && (
                        <Icon name="check" size={18} color="#3b82f6" />
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* الكمية المتاحة */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الكمية المتاحة *</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          {/* تفاصيل إضافية */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفاصيل إضافية</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="وصف تفصيلي عن الأداة الدراسية..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* تبديل النشاط */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon name="check-circle" size={20} color="#10b981" />
                <Text style={styles.switchText}>الأداة نشطة ومتاحة للتسليم</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={isActive ? '#3b82f6' : '#f4f4f5'}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={20} color="#6b7280" />
          <Text style={styles.cancelButtonText}>إلغاء</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.saveButtonText}>جاري الحفظ...</Text>
            </>
          ) : (
            <>
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>حفظ الأداة</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddStudyMaterialScreen;
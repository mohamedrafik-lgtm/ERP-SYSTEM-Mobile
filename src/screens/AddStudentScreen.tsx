import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import styles from './AddStudentScreen.styles';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { Program } from './ProgramsScreen';
import AuthService from '../services/AuthService';
import SelectBox from '../components/SelectBox';
import {
  EnrollmentType,
  EnrollmentTypeArabic,
  MaritalStatus,
  MaritalStatusArabic,
  ProgramType,
  ProgramTypeArabic,
  Gender,
  GenderArabic,
  Religion,
  ReligionArabic,
  EducationType,
  EducationTypeArabic,
  TraineeStatus,
  TraineeStatusArabic,
  Year,
  YearArabic,
  ClassLevel,
  ClassLevelArabic,
} from '../types/enums';

interface StudentFormData {
  // البيانات الشخصية
  nameAr: string;                    // اسم المتدرب باللغة العربية
  nameEn: string;                    // اسم المتدرب باللغة الإنجليزية
  nationalId: string;                // الرقم القومي (14 رقم)
  birthDate: string;                 // تاريخ الميلاد
  gender: Gender;                    // الجنس (MALE | FEMALE)
  maritalStatus: MaritalStatus;      // الحالة الاجتماعية (SINGLE | MARRIED | DIVORCED | WIDOWED)
  nationality: string;               // الجنسية
  religion?: Religion;               // الديانة (اختياري) (ISLAM | CHRISTIANITY | JUDAISM)
  photoUrl?: string;                 // رابط الصورة الشخصية (اختياري)

  // البيانات الأكاديمية
  enrollmentType: EnrollmentType;    // نوع الالتحاق (REGULAR | DISTANCE | BOTH)
  programType: ProgramType;          // نوع البرنامج (SUMMER | WINTER | ANNUAL)
  programId: number;                 // رقم البرنامج التدريبي
  educationType: EducationType;      // نوع التعليم
  schoolName: string;                // اسم المدرسة/الجامعة
  graduationDate: string;            // تاريخ التخرج
  totalGrade?: number;               // المجموع الكلي (اختياري)
  gradePercentage?: number;          // النسبة المئوية للدرجات (اختياري)
  academicYear?: string;             // العام الدراسي (اختياري)
  traineeStatus?: TraineeStatus;     // حالة المتدرب (اختياري) (NEW | CURRENT | GRADUATE | WITHDRAWN)
  classLevel?: Year;                 // الفرقة الدراسية (اختياري) (FIRST | SECOND | THIRD | FOURTH)

  // بيانات العنوان
  country: string;                   // الدولة
  governorate?: string;              // المحافظة (اختياري)
  city: string;                      // المدينة
  address: string;                   // العنوان
  residenceAddress: string;          // عنوان الإقامة

  // بيانات التواصل
  phone: string;                     // رقم الهاتف
  email?: string;                    // البريد الإلكتروني (اختياري)
  landline?: string;                 // رقم الهاتف الأرضي (اختياري)
  whatsapp?: string;                 // رقم واتساب (اختياري)
  facebook?: string;                 // حساب فيسبوك (اختياري)

  // بيانات ولي الأمر
  guardianName: string;              // اسم ولي الأمر
  guardianPhone: string;             // رقم هاتف ولي الأمر
  guardianEmail?: string;            // البريد الإلكتروني لولي الأمر (اختياري)
  guardianJob?: string;              // وظيفة ولي الأمر (اختياري)
  guardianRelation: string;          // صلة القرابة بولي الأمر
}

const initialState: StudentFormData = {
  // البيانات الشخصية
  nameAr: '',
  nameEn: '',
  nationalId: '',
  birthDate: new Date().toISOString(),
  gender: Gender.MALE,
  maritalStatus: MaritalStatus.SINGLE,
  nationality: 'مصر',
  religion: Religion.ISLAM,
  photoUrl: '',

  // البيانات الأكاديمية
  enrollmentType: EnrollmentType.REGULAR,
  programType: ProgramType.ANNUAL,
  programId: 0,
  educationType: EducationType.SECONDARY,
  schoolName: '',
  graduationDate: new Date().toISOString(),
  totalGrade: 0,
  gradePercentage: 0,
  academicYear: '',
  traineeStatus: TraineeStatus.NEW,
  classLevel: ClassLevel.FIRST,

  // بيانات العنوان
  country: 'مصر',
  governorate: '',
  city: '',
  address: '',
  residenceAddress: '',

  // بيانات التواصل
  phone: '',
  email: '',
  landline: '',
  whatsapp: '',
  facebook: '',

  // بيانات ولي الأمر
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  guardianJob: '',
  guardianRelation: '',
};

const AddStudentScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof initialState>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProgramModalVisible, setProgramModalVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programSearchText, setProgramSearchText] = useState('');
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setProgramsLoading(true);
        const fetchedPrograms = await AuthService.getAllPrograms();
        setPrograms(fetchedPrograms);
      } catch (error) {
        Alert.alert('خطأ', 'فشل في تحميل قائمة البرامج التدريبية.');
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const parseNationalId = (nationalId: string) => {
    if (nationalId.length !== 14 || !/^\d{14}$/.test(nationalId)) {
      return null;
    }

    const centuryDigit = parseInt(nationalId.substring(0, 1), 10);
    const year = parseInt(nationalId.substring(1, 3), 10);
    const month = parseInt(nationalId.substring(3, 5), 10);
    const day = parseInt(nationalId.substring(5, 7), 10);
    const genderDigit = parseInt(nationalId.substring(12, 13), 10);

    const fullYear = (centuryDigit === 2 ? 1900 : 2000) + year;

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null; // Basic date validation
    }

    const birthDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const gender = genderDigit % 2 !== 0 ? 'ذكر' : 'أنثى';

    return { birthDate, gender };
  };

  const handleInputChange = (field: keyof typeof initialState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    if (field === 'nationalId') {
      handleNationalIdChange(value);
    }
  };

  const handleNationalIdChange = (nationalId: string) => {
    setFormData(prev => ({
      ...prev,
      nationalId,
    }));

    // Auto-fill birth date and gender if national ID is complete
    if (nationalId.length === 14) {
      const parsedData = parseNationalId(nationalId);
      if (parsedData) {
        const updatedData: Partial<StudentFormData> = {
          birthDate: parsedData.birthDate,
          gender: parsedData.gender as Gender,
        };
        
        setFormData(prev => ({
          ...prev,
          ...updatedData,
        }));
        
        Toast.show({
          type: 'success',
          text1: 'تم تعبئة البيانات تلقائياً',
          text2: 'تم استخراج تاريخ الميلاد والنوع من الرقم القومي',
        });
      }
    }
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      'اختيار صورة شخصية',
      'اختر الطريقة التي تفضلها',
      [
        {
          text: 'التقاط صورة بالكاميرا',
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.7, saveToPhotos: true }, (response) => {
              if (response.didCancel) return;
              if (response.errorCode) {
                Alert.alert('خطأ', 'حدث خطأ أثناء استخدام الكاميرا.');
                return;
              }
              if (response.assets && response.assets[0].uri) {
                setPhotoUri(response.assets[0].uri);
                // TODO: Upload image and get URL
                handleInputChange('photoUrl', response.assets[0].uri); // Placeholder
              }
            });
          },
        },
        {
          text: 'اختيار صورة من المعرض',
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
              if (response.didCancel) return;
              if (response.errorCode) {
                Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة.');
                return;
              }
              if (response.assets && response.assets[0].uri) {
                setPhotoUri(response.assets[0].uri);
                // TODO: Upload image and get URL
                handleInputChange('photoUrl', response.assets[0].uri); // Placeholder
              }
            });
          },
        },
        {
          text: 'إلغاء',
          style: 'cancel',
        },
      ],
    );
  };

  const handleSubmit = async () => {
    // Validate form data
    const newErrors: Record<string, string> = {};
    if (!formData.nameAr) newErrors.nameAr = 'الاسم بالعربية مطلوب';
    if (!formData.nationalId) newErrors.nationalId = 'الرقم القومي مطلوب';
    if (!formData.gender) newErrors.gender = 'النوع مطلوب';
    if (!formData.enrollmentType) newErrors.enrollmentType = 'نوع القيد مطلوب';
    if (!formData.maritalStatus) newErrors.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    if (!formData.programType) newErrors.programType = 'نوع البرنامج مطلوب';
    if (!formData.educationType) newErrors.educationType = 'نوع التعليم مطلوب';
    if (!formData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
    if (!formData.country) newErrors.country = 'الدولة مطلوبة';
    if (!formData.city) newErrors.city = 'المدينة مطلوبة';
    if (!formData.address) newErrors.address = 'العنوان مطلوب';
    if (!formData.residenceAddress) newErrors.residenceAddress = 'عنوان الإقامة مطلوب';
    if (!formData.guardianName) newErrors.guardianName = 'اسم ولي الأمر مطلوب';
    if (!formData.guardianPhone) newErrors.guardianPhone = 'هاتف ولي الأمر مطلوب';
    if (!formData.guardianRelation) newErrors.guardianRelation = 'صلة القرابة مطلوبة';
    if (!formData.schoolName) newErrors.schoolName = 'اسم المدرسة/الجامعة مطلوب';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.addTrainee({
        ...formData,
        photoUrl: photoUri || formData.photoUrl,
      });
      Toast.show({
        type: 'success',
        text1: 'تمت الإضافة بنجاح',
        text2: 'تمت إضافة المتدرب بنجاح',
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Error adding trainee:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إضافة المتدرب');
    } finally {
      setLoading(false);
    }
  };

  const getEnumItems = <T extends string | number | symbol>(
    enumObj: Record<string, T>,
    labels: Record<T, string>
  ) => {
    return Object.values(enumObj).map(value => ({
      value,
      label: labels[value as T]
    }));
  };

    const renderSelectBox = <T extends string>(
    field: keyof StudentFormData,
    label: string,
    enumObj: Record<string, T>,
    labels: Record<T, string>
  ) => {
    return (
      <View style={styles.formGroup}>
        <SelectBox
          label={label}
          selectedValue={formData[field] as string | undefined}
          onValueChange={(value: string) => handleInputChange(field, value)}
          items={Object.entries(enumObj).map(([key, value]) => ({
            value: value as string,
            label: labels[value as T] || key,
          }))}
          placeholder={`اختر ${label}`}
          error={errors[field] as string | undefined}
        />
      </View>
    );
  };

  const renderTextInput = (
    field: keyof StudentFormData,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default',
    isEditable = true
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={String(formData[field])}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          editable={isEditable}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field] as string}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-forward-ios" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.title}>إضافة طالب جديد</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.imagePickerContainer}>
            <TouchableOpacity onPress={handleChoosePhoto} style={styles.avatarPlaceholder}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <Icon name="person" size={60} color="#d1d5db" />
              )}
              <View style={styles.cameraIconContainer}>
                <Icon name="camera-alt" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          {renderTextInput('nameAr', 'الاسم بالعربية *', 'ادخل الاسم بالعربية')}
          {renderTextInput('nameEn', 'الاسم بالإنجليزية', 'ادخل الاسم بالإنجليزية')}
          {renderTextInput('nationalId', 'الرقم القومي *', 'ادخل 14 رقم', 'numeric')}
          {renderTextInput('nationality', 'الجنسية', 'ادخل الجنسية')}
          {renderTextInput('birthDate', 'تاريخ الميلاد', 'YYYY-MM-DD', 'default', false)}
          {renderTextInput('residenceAddress', 'عنوان الإقامة *', 'ادخل عنوان الإقامة')}
          {renderSelectBox('gender', 'النوع *', Gender, GenderArabic)}
          {renderSelectBox('religion', 'الديانة', Religion, ReligionArabic)}
          {renderSelectBox('maritalStatus', 'الحالة الاجتماعية *', MaritalStatus, MaritalStatusArabic)}

          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          {renderTextInput('phone', 'رقم الهاتف *', '01xxxxxxxxx', 'phone-pad')}
          {renderTextInput('email', 'البريد الإلكتروني', 'example@domain.com', 'email-address')}
          {renderTextInput('landline', 'الهاتف الأرضي', 'ادخل الهاتف الأرضي', 'phone-pad')}
          {renderTextInput('whatsapp', 'رقم الواتساب', '01xxxxxxxxx', 'phone-pad')}
          {renderTextInput('facebook', 'حساب فيسبوك', 'ادخل رابط الحساب')}

          <Text style={styles.sectionTitle}>معلومات العنوان</Text>
          {renderTextInput('country', 'الدولة *', 'ادخل الدولة')}
          {renderTextInput('governorate', 'المحافظة', 'ادخل المحافظة')}
          {renderTextInput('city', 'المدينة *', 'ادخل المدينة')}
          {renderTextInput('address', 'العنوان بالتفصيل *', 'ادخل العنوان')}

          <Text style={styles.sectionTitle}>معلومات ولي الأمر</Text>
          {renderTextInput('guardianName', 'اسم ولي الأمر *', 'ادخل اسم ولي الأمر')}
          {renderTextInput('guardianPhone', 'هاتف ولي الأمر *', '01xxxxxxxxx', 'phone-pad')}
          {renderTextInput('guardianEmail', 'بريد ولي الأمر', 'example@domain.com', 'email-address')}
          {renderTextInput('guardianJob', 'وظيفة ولي الأمر', 'ادخل الوظيفة')}
          {renderTextInput('guardianRelation', 'صلة القرابة *', 'ادخل صلة القرابة')}

          <Text style={styles.sectionTitle}>المؤهل الدراسي</Text>
          {renderSelectBox('educationType', 'نوع التعليم *', EducationType, EducationTypeArabic)}
          {renderTextInput('schoolName', 'اسم المدرسة/الجامعة *', 'ادخل اسم المدرسة')}
          {renderTextInput('graduationDate', 'تاريخ التخرج', 'YYYY-MM-DD')}
          {renderTextInput('totalGrade', 'المجموع الكلي', 'ادخل المجموع', 'numeric')}
          {renderTextInput('gradePercentage', 'النسبة المئوية', 'ادخل النسبة', 'numeric')}
          {renderTextInput('academicYear', 'العام الدراسي', 'ادخل العام الدراسي')}

          <Text style={styles.sectionTitle}>معلومات التسجيل</Text>
          {renderSelectBox('enrollmentType', 'نوع القيد *', EnrollmentType, EnrollmentTypeArabic)}
          {renderSelectBox('programType', 'نوع البرنامج *', ProgramType, ProgramTypeArabic)}
          {renderSelectBox('traineeStatus', 'حالة المتدرب', TraineeStatus, TraineeStatusArabic)}
          {renderSelectBox('classLevel', 'المستوى الدراسي', Year, YearArabic)}
          {renderProgramSelector()}

          <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>إضافة الطالب</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );

  function renderProgramSelector() {
    const filteredPrograms = programs.filter(p => 
      p.nameAr.toLowerCase().includes(programSearchText.toLowerCase()) || 
      p.nameEn.toLowerCase().includes(programSearchText.toLowerCase())
    );

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>البرنامج التدريبي *</Text>
        <TouchableOpacity onPress={() => setProgramModalVisible(true)} style={styles.selectButton}>
          <Text style={styles.selectButtonText}>{selectedProgram ? selectedProgram.nameAr : 'اختر برنامجًا'}</Text>
          <Icon name="keyboard-arrow-down" size={24} color="#6b7280" />
        </TouchableOpacity>

        <Modal
          visible={isProgramModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setProgramModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setProgramModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر برنامجًا تدريبيًا</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن برنامج..."
              value={programSearchText}
              onChangeText={setProgramSearchText}
            />
            {programsLoading ? (
              <ActivityIndicator size="large" color="#1a237e" />
            ) : (
              <FlatList
                data={filteredPrograms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.programItem}
                    onPress={() => {
                      setSelectedProgram(item);
                      handleInputChange('programId', item.id.toString());
                      setProgramModalVisible(false);
                      setProgramSearchText('');
                    }}
                  >
                    <Text style={styles.programItemText}>{item.nameAr}</Text>
                    <Text style={styles.programItemSubText}>{item.nameEn}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyListText}>لا توجد برامج مطابقة</Text>}
              />
            )}
          </View>
        </Modal>
      </View>
    );
  }
};

export default AddStudentScreen;

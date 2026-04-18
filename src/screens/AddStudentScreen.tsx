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
import LocationService, { LocationCountry, LocationGovernorate, LocationCity } from '../services/LocationService';
import SelectBox from '../components/SelectBox';
import DateTimePickerField from '../components/DateTimePickerField';
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
} from '../types/enums';

interface StudentFormData {
  // البيانات الشخصية
  nameAr: string;                    // اسم المتدرب باللغة العربية
  nameEn: string;                    // اسم المتدرب باللغة الإنجليزية
  nationalId: string;                // الرقم القومي (14 رقم)
  idIssueDate: string;               // تاريخ إصدار البطاقة
  idExpiryDate: string;              // تاريخ انتهاء البطاقة
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
  educationalAdministration?: string; // الإدارة التعليمية (اختياري)
  graduationDate: string;            // تاريخ التخرج
  totalGrade?: number;               // المجموع الكلي (اختياري)
  gradePercentage?: number;          // النسبة المئوية للدرجات (اختياري)
  academicYear?: string;             // العام الدراسي (اختياري)

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
  whatsapp: string;                  // رقم واتساب
  facebook?: string;                 // حساب فيسبوك (اختياري)

  // بيانات ولي الأمر
  guardianName: string;              // اسم ولي الأمر
  guardianPhone: string;             // رقم هاتف ولي الأمر
  guardianEmail?: string;            // البريد الإلكتروني لولي الأمر (اختياري)
  guardianJob?: string;              // وظيفة ولي الأمر (اختياري)
  guardianRelation: string;          // صلة القرابة بولي الأمر

  // بيانات إضافية
}

const initialState: StudentFormData = {
  // البيانات الشخصية
  nameAr: '',
  nameEn: '',
  nationalId: '',
  idIssueDate: new Date().toISOString(),
  idExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 7)).toISOString(),
  birthDate: new Date().toISOString(),
  gender: Gender.MALE,
  maritalStatus: MaritalStatus.SINGLE,
  nationality: 'EG',
  religion: Religion.ISLAM,
  photoUrl: '',

  // البيانات الأكاديمية
  enrollmentType: EnrollmentType.REGULAR,
  programType: ProgramType.ANNUAL,
  programId: 0,
  educationType: EducationType.SECONDARY,
  schoolName: '',
  educationalAdministration: '',
  graduationDate: new Date().toISOString(),
  totalGrade: 0,
  gradePercentage: 0,
  academicYear: '',

  // بيانات العنوان
  country: 'EG',
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof initialState>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProgramModalVisible, setProgramModalVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programSearchText, setProgramSearchText] = useState('');
  const [programsLoading, setProgramsLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [countries, setCountries] = useState<LocationCountry[]>([]);
  const [governorates, setGovernorates] = useState<LocationGovernorate[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);

  const egyptianGovernorates: Record<string, string> = {
    '01': 'cairo',
    '02': 'alexandria',
    '03': 'port_said',
    '04': 'suez',
    '11': 'damietta',
    '12': 'dakahlia',
    '13': 'sharqia',
    '14': 'qalyubia',
    '15': 'kafr_sheikh',
    '16': 'gharbia',
    '17': 'monufia',
    '18': 'beheira',
    '19': 'ismailia',
    '21': 'giza',
    '22': 'beni_suef',
    '23': 'fayoum',
    '24': 'minya',
    '25': 'asyut',
    '26': 'sohag',
    '27': 'qena',
    '28': 'aswan',
    '29': 'luxor',
    '31': 'red_sea',
    '32': 'new_valley',
    '33': 'matrouh',
    '34': 'north_sinai',
    '35': 'south_sinai',
  };

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

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        const locationCountries = await LocationService.getLocationsTree();
        setCountries(locationCountries);
      } catch (error) {
        console.error('Failed to load locations tree:', error);
        setCountries([]);
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

  useEffect(() => {
    const selectedCountry = countries.find(country => country.code === formData.country);
    const countryGovernorates = selectedCountry?.governorates || [];
    setGovernorates(countryGovernorates);

    const hasGovernorate = countryGovernorates.some(gov => gov.code === formData.governorate);
    if (formData.governorate && !hasGovernorate) {
      setFormData(prev => ({ ...prev, governorate: '', city: '' }));
      setCities([]);
      return;
    }

    const selectedGovernorate = countryGovernorates.find(gov => gov.code === formData.governorate);
    const governorateCities = selectedGovernorate?.cities || [];
    setCities(governorateCities);

    if (formData.city && !governorateCities.some(city => city.code === formData.city)) {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  }, [countries, formData.country, formData.governorate, formData.city]);

  const parseNationalId = (nationalId: string) => {
    if (nationalId.length !== 14 || !/^\d{14}$/.test(nationalId)) {
      return null;
    }

    const centuryDigit = parseInt(nationalId.substring(0, 1), 10);
    const year = parseInt(nationalId.substring(1, 3), 10);
    const month = parseInt(nationalId.substring(3, 5), 10);
    const day = parseInt(nationalId.substring(5, 7), 10);
    const governorateCode = nationalId.substring(7, 9);
    const genderDigit = parseInt(nationalId.substring(12, 13), 10);

    const fullYear = (centuryDigit === 2 ? 1900 : 2000) + year;

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null; // Basic date validation
    }

    const birthDate = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const gender = genderDigit % 2 !== 0 ? Gender.MALE : Gender.FEMALE;
    const governorate = egyptianGovernorates[governorateCode] || '';

    return { birthDate, gender, governorate };
  };

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
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
          gender: parsedData.gender,
          ...(formData.country === 'EG' && parsedData.governorate ? { governorate: parsedData.governorate } : {}),
        };
        
        setFormData(prev => ({
          ...prev,
          ...updatedData,
        }));
        
        Toast.show({
          type: 'success',
          text1: 'تم تعبئة البيانات تلقائياً',
          text2: 'تم استخراج تاريخ الميلاد والنوع (والمحافظة داخل مصر) من الرقم القومي',
        });
      }
    }
  };

  useEffect(() => {
    if (!formData.idIssueDate) {
      return;
    }

    const issueDate = new Date(formData.idIssueDate);
    if (Number.isNaN(issueDate.getTime())) {
      return;
    }

    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 7);
    const formattedExpiryDate = expiryDate.toISOString().split('T')[0];

    if (formData.idExpiryDate !== formattedExpiryDate) {
      setFormData(prev => ({
        ...prev,
        idExpiryDate: formattedExpiryDate,
      }));
    }
  }, [formData.idIssueDate, formData.idExpiryDate]);

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) {
      return null;
    }

    const birthDate = new Date(birthDateString);
    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
      months += 12;
    }

    if (today.getDate() < birthDate.getDate()) {
      months -= 1;
      if (months < 0) {
        months = 11;
        years -= 1;
      }
    }

    return { years, months };
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
              if (response.assets && response.assets[0]) {
                handleUploadTraineePhoto(response.assets[0]);
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
              if (response.assets && response.assets[0]) {
                handleUploadTraineePhoto(response.assets[0]);
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

  const buildPhotoFileMeta = (asset: { uri?: string; fileName?: string; type?: string }) => {
    const uri = asset?.uri;
    if (!uri) {
      throw new Error('بيانات الصورة غير مكتملة');
    }

    const fallbackName = `trainee-photo-${Date.now()}.jpg`;
    const fileName = asset.fileName || uri.split('/').pop() || fallbackName;
    const fileType = asset.type || 'image/jpeg';

    return {
      uri,
      name: fileName,
      type: fileType,
    };
  };

  const handleUploadTraineePhoto = async (asset: { uri?: string; fileName?: string; type?: string }) => {
    const previousPreview = photoUri;
    const previousPhotoUrl = formData.photoUrl || '';

    try {
      const uploadFile = buildPhotoFileMeta(asset);

      setPhotoUri(uploadFile.uri);
      setPhotoUploading(true);

      const uploaded = await AuthService.uploadFile(uploadFile, 'trainees');
      const uploadedUrl = String(uploaded.url || '').trim();

      if (!uploadedUrl) {
        throw new Error('تم رفع الصورة لكن لم يتم استلام الرابط');
      }

      setPhotoUri(uploadedUrl);
      handleInputChange('photoUrl', uploadedUrl);

      Toast.show({
        type: 'success',
        text1: 'تم رفع الصورة',
        text2: 'تم تحديث صورة المتدرب بنجاح',
      });
    } catch (error: any) {
      setPhotoUri(previousPreview);
      handleInputChange('photoUrl', previousPhotoUrl);
      Alert.alert('خطأ', error?.message || 'فشل في رفع صورة المتدرب');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (photoUploading) {
      Alert.alert('تنبيه', 'جاري رفع الصورة، يرجى الانتظار قليلاً');
      return;
    }

    // Validate form data
    const newErrors: Record<string, string> = {};
    if (!formData.nameAr) newErrors.nameAr = 'الاسم بالعربية مطلوب';
    if (!formData.nationalId) newErrors.nationalId = 'الرقم القومي مطلوب';
    if (formData.nationalId && !/^\d{14}$/.test(formData.nationalId)) newErrors.nationalId = 'الرقم القومي يجب أن يكون 14 رقم';
    if (!formData.idIssueDate) newErrors.idIssueDate = 'تاريخ إصدار البطاقة مطلوب';
    if (!formData.idExpiryDate) newErrors.idExpiryDate = 'تاريخ انتهاء البطاقة مطلوب';
    if (!formData.gender) newErrors.gender = 'النوع مطلوب';
    if (!formData.enrollmentType) newErrors.enrollmentType = 'نوع القيد مطلوب';
    if (!formData.maritalStatus) newErrors.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    if (!formData.programType) newErrors.programType = 'نوع البرنامج مطلوب';
    if (!formData.educationType) newErrors.educationType = 'نوع التعليم مطلوب';
    if (!formData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
    if (formData.phone && formData.phone.length < 11) newErrors.phone = 'رقم الهاتف يجب أن يكون 11 رقم على الأقل';
    if (!formData.whatsapp) newErrors.whatsapp = 'رقم واتساب مطلوب';
    if (formData.whatsapp && formData.whatsapp.length < 11) newErrors.whatsapp = 'رقم واتساب يجب أن يكون 11 رقم على الأقل';
    if (!formData.country) newErrors.country = 'الدولة مطلوبة';
    if (!formData.city) newErrors.city = 'المدينة مطلوبة';
    if (!formData.address) newErrors.address = 'العنوان مطلوب';
    if (!formData.residenceAddress) newErrors.residenceAddress = 'عنوان الإقامة مطلوب';
    if (!formData.guardianName) newErrors.guardianName = 'اسم ولي الأمر مطلوب';
    if (!formData.guardianPhone) newErrors.guardianPhone = 'هاتف ولي الأمر مطلوب';
    if (formData.guardianPhone && formData.guardianPhone.length < 11) newErrors.guardianPhone = 'هاتف ولي الأمر يجب أن يكون 11 رقم على الأقل';
    if (!formData.guardianRelation) newErrors.guardianRelation = 'صلة القرابة مطلوبة';
    if (!formData.schoolName) newErrors.schoolName = 'اسم المدرسة/الجامعة مطلوب';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        photoUrl: formData.photoUrl?.trim() || null,
        programId: Number(formData.programId),
        totalGrade: formData.totalGrade ? Number(formData.totalGrade) : null,
        gradePercentage: formData.gradePercentage ? Number(formData.gradePercentage) : null,
        email: formData.email?.trim() || null,
        guardianEmail: formData.guardianEmail?.trim() || null,
        guardianJob: formData.guardianJob?.trim() || null,
        landline: formData.landline?.trim() || null,
        facebook: formData.facebook?.trim() || null,
        educationalAdministration: formData.educationalAdministration?.trim() || null,
        academicYear: formData.academicYear?.trim() || null,
      };

      await AuthService.addTrainee({
        ...payload,
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
          value={formData[field] == null ? '' : String(formData[field])}
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

  const age = calculateAge(formData.birthDate);

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
            <TouchableOpacity onPress={handleChoosePhoto} style={styles.avatarPlaceholder} disabled={photoUploading}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <Icon name="person" size={60} color="#d1d5db" />
              )}
              <View style={styles.cameraIconContainer}>
                <Icon name="camera-alt" size={20} color="#fff" />
              </View>
              {photoUploading && (
                <View style={styles.photoLoadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            {photoUploading && <Text style={styles.photoLoadingText}>جاري رفع الصورة...</Text>}
          </View>

          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          {renderTextInput('nameAr', 'الاسم بالعربية *', 'ادخل الاسم بالعربية')}
          {renderTextInput('nameEn', 'الاسم بالإنجليزية', 'ادخل الاسم بالإنجليزية')}
          {renderTextInput('nationalId', 'الرقم القومي *', 'ادخل 14 رقم', 'numeric')}
          <View style={styles.formGroup}>
            <DateTimePickerField
              label="تاريخ إصدار البطاقة *"
              value={String(formData.idIssueDate)}
              onChange={(value) => handleInputChange('idIssueDate', value)}
              placeholder="اختر تاريخ إصدار البطاقة"
              mode="date"
            />
            {errors.idIssueDate && <Text style={styles.errorText}>{errors.idIssueDate as string}</Text>}
          </View>
          <View style={styles.formGroup}>
            <DateTimePickerField
              label="تاريخ انتهاء البطاقة *"
              value={String(formData.idExpiryDate)}
              onChange={(value) => handleInputChange('idExpiryDate', value)}
              placeholder="اختر تاريخ انتهاء البطاقة"
              mode="date"
            />
            {errors.idExpiryDate && <Text style={styles.errorText}>{errors.idExpiryDate as string}</Text>}
          </View>
          {renderTextInput('nationality', 'الجنسية', 'ادخل الجنسية')}
          <View style={styles.formGroup}>
            <DateTimePickerField
              label="تاريخ الميلاد"
              value={String(formData.birthDate)}
              onChange={(value) => handleInputChange('birthDate', value)}
              placeholder="اختر تاريخ الميلاد"
              mode="date"
            />
            {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate as string}</Text>}
          </View>
          {age && (
            <View style={{ marginBottom: 12, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#1e3a8a', fontWeight: '700', textAlign: 'right' }}>العمر الحالي: {age.years} سنة و {age.months} شهر</Text>
            </View>
          )}
          {renderTextInput('residenceAddress', 'عنوان الإقامة *', 'ادخل عنوان الإقامة')}
          {renderSelectBox('gender', 'النوع *', Gender, GenderArabic)}
          {renderSelectBox('religion', 'الديانة', Religion, ReligionArabic)}
          {renderSelectBox('maritalStatus', 'الحالة الاجتماعية *', MaritalStatus, MaritalStatusArabic)}

          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          {renderTextInput('phone', 'رقم الهاتف *', '01xxxxxxxxx', 'phone-pad')}
          {renderTextInput('email', 'البريد الإلكتروني', 'example@domain.com', 'email-address')}
          {renderTextInput('landline', 'الهاتف الأرضي', 'ادخل الهاتف الأرضي', 'phone-pad')}
          {renderTextInput('whatsapp', 'رقم الواتساب *', '01xxxxxxxxx', 'phone-pad')}
          {renderTextInput('facebook', 'حساب فيسبوك', 'ادخل رابط الحساب')}

          <Text style={styles.sectionTitle}>معلومات العنوان</Text>
          <View style={styles.formGroup}>
            <SelectBox
              label="الدولة *"
              selectedValue={formData.country}
              onValueChange={(value: string) => handleInputChange('country', value)}
              items={countries.map(country => ({ value: country.code, label: country.nameAr }))}
              placeholder="اختر الدولة"
              error={errors.country as string | undefined}
              loading={locationsLoading}
            />
          </View>
          <View style={styles.formGroup}>
            <SelectBox
              label="المحافظة"
              selectedValue={formData.governorate}
              onValueChange={(value: string) => handleInputChange('governorate', value)}
              items={governorates.map(governorate => ({ value: governorate.code, label: governorate.nameAr }))}
              placeholder={formData.country ? 'اختر المحافظة' : 'اختر الدولة أولاً'}
              disabled={!formData.country || governorates.length === 0}
              loading={locationsLoading}
            />
          </View>
          <View style={styles.formGroup}>
            <SelectBox
              label="المدينة *"
              selectedValue={formData.city}
              onValueChange={(value: string) => handleInputChange('city', value)}
              items={cities.map(city => ({ value: city.code, label: city.nameAr }))}
              placeholder={formData.governorate ? 'اختر المدينة' : 'اختر المحافظة أولاً'}
              error={errors.city as string | undefined}
              disabled={!formData.governorate || cities.length === 0}
              loading={locationsLoading}
            />
          </View>
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
          {renderTextInput('educationalAdministration', 'الإدارة التعليمية', 'ادخل الإدارة التعليمية (اختياري)')}
          <View style={styles.formGroup}>
            <DateTimePickerField
              label="تاريخ التخرج"
              value={String(formData.graduationDate)}
              onChange={(value) => handleInputChange('graduationDate', value)}
              placeholder="اختر تاريخ التخرج"
              mode="date"
            />
            {errors.graduationDate && <Text style={styles.errorText}>{errors.graduationDate as string}</Text>}
          </View>
          {renderTextInput('totalGrade', 'المجموع الكلي', 'ادخل المجموع', 'numeric')}
          {renderTextInput('gradePercentage', 'النسبة المئوية', 'ادخل النسبة', 'numeric')}
          {renderTextInput('academicYear', 'العام الدراسي', 'ادخل العام الدراسي')}

          <Text style={styles.sectionTitle}>معلومات التسجيل</Text>
          {renderSelectBox('enrollmentType', 'نوع القيد *', EnrollmentType, EnrollmentTypeArabic)}
          {renderSelectBox('programType', 'نوع البرنامج *', ProgramType, ProgramTypeArabic)}
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
                      handleInputChange('programId', item.id);
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

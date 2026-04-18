import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AuthService from '../services/AuthService';
import LocationService, { LocationCountry, LocationGovernorate, LocationCity } from '../services/LocationService';
import WhatsAppAutoMessageService from '../services/WhatsAppAutoMessageService';
import DateTimePickerField from '../components/DateTimePickerField';
import SelectBox from '../components/SelectBox';
import { ITrainee, UpdateTraineePayload } from '../types/student';
import { Program } from './ProgramsScreen';
import { 
  EnrollmentType, 
  MaritalStatus, 
  ProgramType, 
  Gender, 
  EducationType, 
} from '../types/enums';

const normalizeLookupValue = (value?: string | null): string => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0640]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\s\-_]+/g, '');
};

const GOVERNORATE_CODE_ALIASES: Record<string, string> = {
  qaliubiya: 'qalyubia',
  menoufia: 'monufia',
  kafrelsheikh: 'kafrsheikh',
  kafrelshiekh: 'kafrsheikh',
};

const CITY_CODE_ALIASES: Record<string, string> = {
  alexandriacenter: 'alex_center',
};

const resolveCountryCode = (rawValue: string | undefined, countryList: LocationCountry[]): string => {
  const raw = String(rawValue || '').trim();
  if (!raw) return '';

  const direct = countryList.find(country => country.code === raw || country.id === raw);
  if (direct) return direct.code;

  const normalizedRaw = normalizeLookupValue(raw);
  const matched = countryList.find(country => {
    return (
      normalizeLookupValue(country.code) === normalizedRaw ||
      normalizeLookupValue(country.nameAr) === normalizedRaw ||
      normalizeLookupValue(country.nameEn) === normalizedRaw
    );
  });

  return matched?.code || '';
};

const resolveGovernorateCode = (rawValue: string | undefined, country?: LocationCountry): string => {
  const raw = String(rawValue || '').trim();
  if (!raw || !country) return '';

  const direct = country.governorates.find(governorate => governorate.code === raw || governorate.id === raw);
  if (direct) return direct.code;

  const normalizedRaw = normalizeLookupValue(raw);
  const aliasedRaw = GOVERNORATE_CODE_ALIASES[normalizedRaw] || normalizedRaw;
  const matched = country.governorates.find(governorate => {
    return (
      normalizeLookupValue(governorate.code) === aliasedRaw ||
      normalizeLookupValue(governorate.nameAr) === normalizedRaw ||
      normalizeLookupValue(governorate.nameEn) === normalizedRaw
    );
  });

  return matched?.code || '';
};

const resolveCityCode = (rawValue: string | undefined, governorate?: LocationGovernorate): string => {
  const raw = String(rawValue || '').trim();
  if (!raw || !governorate) return '';

  const direct = governorate.cities.find(city => city.code === raw || city.id === raw);
  if (direct) return direct.code;

  const normalizedRaw = normalizeLookupValue(raw);
  const aliasedRaw = CITY_CODE_ALIASES[normalizedRaw] || normalizedRaw;
  const matched = governorate.cities.find(city => {
    return (
      normalizeLookupValue(city.code) === aliasedRaw ||
      normalizeLookupValue(city.nameAr) === normalizedRaw ||
      normalizeLookupValue(city.nameEn) === normalizedRaw
    );
  });

  return matched?.code || '';
};

const EditTraineeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainee } = route.params as { trainee: ITrainee };

  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [formData, setFormData] = useState<UpdateTraineePayload>({});
  const [updatedFields, setUpdatedFields] = useState<string[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [countries, setCountries] = useState<LocationCountry[]>([]);
  const [governorates, setGovernorates] = useState<LocationGovernorate[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(trainee.photoUrl || null);
  const [autoFillExpiryFromIssueDate, setAutoFillExpiryFromIssueDate] = useState(!Boolean(trainee.idExpiryDate));

  const buildFormDataFromTrainee = (traineeData: ITrainee): UpdateTraineePayload => ({
    nameAr: traineeData.nameAr,
    nameEn: traineeData.nameEn,
    enrollmentType: traineeData.enrollmentType,
    maritalStatus: traineeData.maritalStatus,
    nationalId: traineeData.nationalId,
    idIssueDate: traineeData.idIssueDate,
    idExpiryDate: traineeData.idExpiryDate,
    programType: traineeData.programType,
    nationality: traineeData.nationality,
    gender: traineeData.gender,
    birthDate: traineeData.birthDate,
    residenceAddress: traineeData.residenceAddress,
    religion: traineeData.religion,
    programId: traineeData.programId,
    country: traineeData.country,
    governorate: traineeData.governorate,
    city: traineeData.city,
    address: traineeData.address,
    phone: traineeData.phone,
    email: traineeData.email,
    guardianPhone: traineeData.guardianPhone,
    guardianEmail: traineeData.guardianEmail,
    guardianJob: traineeData.guardianJob,
    guardianRelation: traineeData.guardianRelation,
    guardianName: traineeData.guardianName,
    landline: traineeData.landline,
    whatsapp: traineeData.whatsapp,
    facebook: traineeData.facebook,
    educationType: traineeData.educationType,
    schoolName: traineeData.schoolName,
    educationalAdministration: traineeData.educationalAdministration,
    graduationDate: traineeData.graduationDate,
    totalGrade: traineeData.totalGrade,
    gradePercentage: traineeData.gradePercentage,
    sportsActivity: traineeData.sportsActivity,
    culturalActivity: traineeData.culturalActivity,
    educationalActivity: traineeData.educationalActivity,
    notes: traineeData.notes,
    academicYear: traineeData.academicYear,
    marketingEmployeeId: traineeData.marketingEmployeeId,
    firstContactEmployeeId: traineeData.firstContactEmployeeId,
    secondContactEmployeeId: traineeData.secondContactEmployeeId,
    photoUrl: traineeData.photoUrl,
  });

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
        const fetchedPrograms = await AuthService.getAllPrograms();
        setPrograms(fetchedPrograms);
      } catch {
        setPrograms([]);
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
    setFormData(buildFormDataFromTrainee(trainee));
    setPhotoPreviewUri(trainee.photoUrl || null);
    setAutoFillExpiryFromIssueDate(!Boolean(trainee.idExpiryDate));
  }, [trainee]);

  useEffect(() => {
    let isMounted = true;

    const hydrateFromApi = async () => {
      try {
        const response = await AuthService.getTraineeById(trainee.id);
        const fullTrainee = (response?.data || response) as ITrainee | undefined;

        if (!isMounted || !fullTrainee) {
          return;
        }

        setFormData(buildFormDataFromTrainee(fullTrainee));
        setPhotoPreviewUri(fullTrainee.photoUrl || null);
        setAutoFillExpiryFromIssueDate(!Boolean(fullTrainee.idExpiryDate));
      } catch (error) {
        console.error('Failed to hydrate trainee details for edit screen:', error);
      }
    };

    hydrateFromApi();

    return () => {
      isMounted = false;
    };
  }, [trainee.id]);

  useEffect(() => {
    if (countries.length === 0) {
      return;
    }

    setFormData(prev => {
      const originalCountry = String(prev.country || '').trim();
      const originalGovernorate = String(prev.governorate || '').trim();
      const originalCity = String(prev.city || '').trim();

      const resolvedCountry = resolveCountryCode(originalCountry, countries);
      const selectedCountry = countries.find(country => country.code === (resolvedCountry || originalCountry));

      const resolvedGovernorate = resolveGovernorateCode(originalGovernorate, selectedCountry);
      const selectedGovernorate = selectedCountry?.governorates.find(governorate => governorate.code === (resolvedGovernorate || originalGovernorate));

      const resolvedCity = resolveCityCode(originalCity, selectedGovernorate);

      const nextCountry = resolvedCountry || originalCountry;
      const nextGovernorate = resolvedGovernorate || originalGovernorate;
      const nextCity = resolvedCity || originalCity;

      if (
        nextCountry === originalCountry &&
        nextGovernorate === originalGovernorate &&
        nextCity === originalCity
      ) {
        return prev;
      }

      return {
        ...prev,
        country: nextCountry,
        governorate: nextGovernorate,
        city: nextCity,
      };
    });
  }, [countries]);

  const parseNationalId = (nationalId: string) => {
    if (!/^\d{14}$/.test(nationalId)) {
      return null;
    }

    const centuryDigit = Number(nationalId.substring(0, 1));
    const year = Number(nationalId.substring(1, 3));
    const month = Number(nationalId.substring(3, 5));
    const day = Number(nationalId.substring(5, 7));
    const governorateCode = nationalId.substring(7, 9);
    const genderDigit = Number(nationalId.substring(12, 13));

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const fullYear = (centuryDigit === 2 ? 1900 : 2000) + year;
    return {
      birthDate: `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      gender: genderDigit % 2 !== 0 ? Gender.MALE : Gender.FEMALE,
      governorate: egyptianGovernorates[governorateCode] || undefined,
    };
  };

  useEffect(() => {
    if (!formData.nationalId || formData.nationalId.length !== 14) {
      return;
    }

    const parsed = parseNationalId(formData.nationalId);
    if (!parsed) {
      return;
    }

    if (formData.birthDate !== parsed.birthDate) {
      handleInputChange('birthDate', parsed.birthDate);
    }
    if (formData.gender !== parsed.gender) {
      handleInputChange('gender', parsed.gender);
    }
    if (formData.country === 'EG' && parsed.governorate && formData.governorate !== parsed.governorate) {
      handleInputChange('governorate', parsed.governorate);
    }
  }, [formData.nationalId]);

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

  useEffect(() => {
    if (!autoFillExpiryFromIssueDate) {
      return;
    }

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
      handleInputChange('idExpiryDate', formattedExpiryDate);
    }
  }, [autoFillExpiryFromIssueDate, formData.idIssueDate]);

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) {
      return null;
    }

    const birth = new Date(birthDateString);
    if (Number.isNaN(birth.getTime())) {
      return null;
    }

    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years -= 1;
      months += 12;
    }

    if (today.getDate() < birth.getDate()) {
      months -= 1;
      if (months < 0) {
        months = 11;
        years -= 1;
      }
    }

    return { years, months };
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
    const previousPreview = photoPreviewUri;
    const previousPhotoUrl = (formData.photoUrl as string) || '';

    try {
      const uploadFile = buildPhotoFileMeta(asset);

      setPhotoPreviewUri(uploadFile.uri);
      setPhotoUploading(true);

      const uploaded = await AuthService.uploadFile(uploadFile, 'trainees');
      const uploadedUrl = String(uploaded.url || '').trim();

      if (!uploadedUrl) {
        throw new Error('تم رفع الصورة لكن لم يتم استلام الرابط');
      }

      setPhotoPreviewUri(uploadedUrl);
      handleInputChange('photoUrl', uploadedUrl);

      Toast.show({
        type: 'success',
        text1: 'تم رفع الصورة',
        text2: 'تم تحديث صورة المتدرب بنجاح',
      });
    } catch (error: any) {
      setPhotoPreviewUri(previousPreview);
      handleInputChange('photoUrl', previousPhotoUrl);
      Alert.alert('خطأ', error?.message || 'فشل في رفع صورة المتدرب');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      'اختيار صورة المتدرب',
      'اختر طريقة رفع الصورة',
      [
        {
          text: 'التقاط صورة بالكاميرا',
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.7, saveToPhotos: true }, (response) => {
              if (response.didCancel) return;
              if (response.errorCode) {
                Alert.alert('خطأ', 'حدث خطأ أثناء استخدام الكاميرا');
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
                Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
                return;
              }
              if (response.assets && response.assets[0]) {
                handleUploadTraineePhoto(response.assets[0]);
              }
            });
          },
        },
        { text: 'إلغاء', style: 'cancel' },
      ],
    );
  };

  const handleInputChange = (field: keyof UpdateTraineePayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Track updated fields
    if (value !== trainee[field as keyof ITrainee]) {
      if (!updatedFields.includes(field)) {
        setUpdatedFields(prev => [...prev, field]);
      }
    } else {
      setUpdatedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleUpdate = async () => {
    if (photoUploading) {
      Alert.alert('تنبيه', 'جاري رفع الصورة، يرجى الانتظار قليلاً');
      return;
    }

    if (updatedFields.length === 0) {
      Alert.alert('تنبيه', 'لم يتم تحديث أي حقل');
      return;
    }

    Alert.alert(
      'تأكيد التحديث',
      `هل تريد تحديث ${updatedFields.length} حقل؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تحديث', onPress: confirmUpdate },
      ]
    );
  };

  const confirmUpdate = async () => {
    try {
      setLoading(true);

      // Prepare update data with only changed fields
      const updateData: UpdateTraineePayload = {};
      updatedFields.forEach(field => {
        const value = formData[field];
        // Only include non-empty values
        if (value !== undefined && value !== null && value !== '') {
          // Handle date fields - ensure they're in ISO format
          if (field.includes('Date') && typeof value === 'string') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                updateData[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              } else {
                updateData[field] = value;
              }
            } catch (e) {
              updateData[field] = value;
            }
          } 
          // Handle numeric fields
          else if (field === 'totalGrade' || field === 'gradePercentage' || field === 'programId' || field === 'marketingEmployeeId' || field === 'firstContactEmployeeId' || field === 'secondContactEmployeeId') {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              updateData[field] = numValue;
            } else {
              updateData[field] = value;
            }
          } 
          else {
            updateData[field] = value;
          }
        }
      });

      // Check if there's any data to update
      if (Object.keys(updateData).length === 0) {
        Alert.alert('تنبيه', 'لا توجد بيانات للتحديث');
        return;
      }

      // Update trainee
      console.log('Updating trainee with data:', updateData);
      const response = await AuthService.updateTrainee(trainee.id, updateData);
      console.log('Update response:', response);

      // Check if update was successful (API might return data directly or with success field)
      if (response.success !== false && (response.success === true || response.data || response)) {
        // Show success message
        if (Toast && Toast.show) {
          Toast.show({
            type: 'success',
            text1: 'تم التحديث بنجاح',
            text2: 'تم تحديث بيانات المتدرب',
          });
        } else {
          Alert.alert('نجح', 'تم تحديث بيانات المتدرب بنجاح');
        }

        // Send WhatsApp message if phone number is available
        if (trainee.phone) {
          setSendingMessage(true);
          try {
            await WhatsAppAutoMessageService.sendTraineeUpdateMessage(
              trainee.phone,
              trainee.nameAr,
              updatedFields.map(field => getFieldDisplayName(field)),
              'النظام', // You can get this from user context
              new Date().toISOString(),
              updateData
            );
            
            if (Toast && Toast.show) {
              Toast.show({
                type: 'success',
                text1: 'تم إرسال الإشعار',
                text2: 'تم إرسال رسالة WhatsApp للمتدرب',
              });
            } else {
              Alert.alert('نجح', 'تم إرسال رسالة WhatsApp للمتدرب');
            }
          } catch (messageError) {
            console.error('Error sending WhatsApp message:', messageError);
            if (Toast && Toast.show) {
              Toast.show({
                type: 'error',
                text1: 'خطأ في الإرسال',
                text2: 'تم التحديث ولكن فشل إرسال الرسالة',
              });
            } else {
              Alert.alert('تحذير', 'تم التحديث ولكن فشل إرسال الرسالة');
            }
          } finally {
            setSendingMessage(false);
          }
        }

        // Navigate back
        navigation.goBack();
      } else {
        throw new Error(response.message || response.error || 'فشل في تحديث المتدرب');
      }
    } catch (error: any) {
      console.error('Error updating trainee:', error);
      if (Toast && Toast.show) {
        Toast.show({
          type: 'error',
          text1: 'خطأ في التحديث',
          text2: error.message || 'حدث خطأ غير متوقع',
        });
      } else {
        Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldDisplayName = (field: string): string => {
    const fieldNames: { [key: string]: string } = {
      nameAr: 'الاسم بالعربية',
      nameEn: 'الاسم بالإنجليزية',
      phone: 'رقم الهاتف',
      email: 'البريد الإلكتروني',
      photoUrl: 'صورة المتدرب',
      address: 'العنوان',
      city: 'المدينة',
      governorate: 'المحافظة',
      country: 'البلد',
      nationalId: 'الرقم القومي',
      guardianName: 'اسم ولي الأمر',
      guardianPhone: 'هاتف ولي الأمر',
      guardianEmail: 'بريد ولي الأمر',
      traineeStatus: 'حالة المتدرب',
      programId: 'البرنامج',
      notes: 'الملاحظات',
      idIssueDate: 'تاريخ إصدار البطاقة',
      idExpiryDate: 'تاريخ انتهاء البطاقة',
      educationalAdministration: 'الإدارة التعليمية',
      residenceAddress: 'محل الإقامة',
      enrollmentType: 'نوع الالتحاق',
      programType: 'نوع البرنامج',
      classLevel: 'الفرقة الدراسية',
      academicYear: 'العام الدراسي',
    };
    return fieldNames[field] || field;
  };

  const renderInput = (
    label: string,
    field: keyof UpdateTraineePayload,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          updatedFields.includes(field) && styles.updatedInput
        ]}
        value={formData[field]?.toString() || ''}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder || label}
        keyboardType={keyboardType}
        multiline={field === 'notes' || field === 'address'}
        numberOfLines={field === 'notes' || field === 'address' ? 3 : 1}
      />
    </View>
  );

  const renderDateInput = (
    label: string,
    field: keyof UpdateTraineePayload,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <DateTimePickerField
        label={label}
        value={formData[field]?.toString() || ''}
        onChange={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        mode="date"
      />
    </View>
  );

  const age = calculateAge(formData.birthDate);

  const renderSelect = (
    label: string,
    field: keyof UpdateTraineePayload,
    options: { value: any; label: string }[]
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              formData[field] === option.value && styles.selectedOption
            ]}
            onPress={() => handleInputChange(field, option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              formData[field] === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحديث بيانات المتدرب</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>

          <View style={styles.photoSection}>
            <Text style={styles.label}>صورة المتدرب</Text>
            <TouchableOpacity style={styles.avatarPlaceholder} onPress={handleChoosePhoto} disabled={photoUploading}>
              {photoPreviewUri ? (
                <Image source={{ uri: photoPreviewUri }} style={styles.avatar} />
              ) : (
                <Icon name="person" size={56} color="#d1d5db" />
              )}
              <View style={styles.cameraIconContainer}>
                <Icon name="camera-alt" size={18} color="#fff" />
              </View>
              {photoUploading && (
                <View style={styles.photoLoadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.photoHelpText}>
              {photoUploading ? 'جاري رفع الصورة...' : 'اضغط لتحديث صورة المتدرب'}
            </Text>
          </View>
          
          {renderInput('الاسم بالعربية', 'nameAr', 'أدخل الاسم بالعربية')}
          {renderInput('الاسم بالإنجليزية', 'nameEn', 'أدخل الاسم بالإنجليزية')}
          {renderInput('الرقم القومي', 'nationalId', 'أدخل الرقم القومي', 'numeric')}
          {renderDateInput('تاريخ إصدار البطاقة', 'idIssueDate', 'اختر تاريخ إصدار البطاقة')}
          {renderDateInput('تاريخ انتهاء البطاقة', 'idExpiryDate', 'اختر تاريخ انتهاء البطاقة')}
          {renderDateInput('تاريخ الميلاد', 'birthDate', 'اختر تاريخ الميلاد')}
          {age && (
            <View style={styles.ageInfoCard}>
              <Text style={styles.ageInfoText}>العمر الحالي: {age.years} سنة و {age.months} شهر</Text>
            </View>
          )}
          {renderInput('الجنسية', 'nationality', 'أدخل الجنسية')}
          {renderInput('محل الإقامة', 'residenceAddress', 'أدخل محل الإقامة')}
          {renderInput('رقم الهاتف', 'phone', 'أدخل رقم الهاتف', 'phone-pad')}
          {renderInput('رقم واتساب', 'whatsapp', 'أدخل رقم واتساب', 'phone-pad')}
          {renderInput('البريد الإلكتروني', 'email', 'أدخل البريد الإلكتروني', 'email-address')}
          {renderInput('حساب فيسبوك', 'facebook', 'أدخل رابط فيسبوك')}
          
          {renderSelect('الجنس', 'gender', [
            { value: Gender.MALE, label: 'ذكر' },
            { value: Gender.FEMALE, label: 'أنثى' },
          ])}
          
          {renderSelect('الحالة الاجتماعية', 'maritalStatus', [
            { value: MaritalStatus.SINGLE, label: 'أعزب' },
            { value: MaritalStatus.MARRIED, label: 'متزوج' },
            { value: MaritalStatus.DIVORCED, label: 'مطلق' },
            { value: MaritalStatus.WIDOWED, label: 'أرمل' },
          ])}
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات العنوان</Text>

          <SelectBox
            label="الدولة"
            selectedValue={(formData.country as string) || ''}
            onValueChange={(value: string) => handleInputChange('country', value)}
            items={countries.map(country => ({ value: country.code, label: country.nameAr }))}
            placeholder="اختر الدولة"
            loading={locationsLoading}
          />

          <SelectBox
            label="المحافظة"
            selectedValue={(formData.governorate as string) || ''}
            onValueChange={(value: string) => handleInputChange('governorate', value)}
            items={governorates.map(governorate => ({ value: governorate.code, label: governorate.nameAr }))}
            placeholder={formData.country ? 'اختر المحافظة' : 'اختر الدولة أولاً'}
            disabled={!formData.country || governorates.length === 0}
            loading={locationsLoading}
          />

          <SelectBox
            label="المدينة"
            selectedValue={(formData.city as string) || ''}
            onValueChange={(value: string) => handleInputChange('city', value)}
            items={cities.map(city => ({ value: city.code, label: city.nameAr }))}
            placeholder={formData.governorate ? 'اختر المدينة' : 'اختر المحافظة أولاً'}
            disabled={!formData.governorate || cities.length === 0}
            loading={locationsLoading}
          />

          {renderInput('العنوان', 'address', 'أدخل العنوان التفصيلي')}
          {renderInput('رقم الأرضي', 'landline', 'أدخل رقم الهاتف الأرضي', 'phone-pad')}
        </View>

        {/* Guardian Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات ولي الأمر</Text>
          
          {renderInput('اسم ولي الأمر', 'guardianName', 'أدخل اسم ولي الأمر')}
          {renderInput('هاتف ولي الأمر', 'guardianPhone', 'أدخل هاتف ولي الأمر', 'phone-pad')}
          {renderInput('بريد ولي الأمر', 'guardianEmail', 'أدخل بريد ولي الأمر', 'email-address')}
          {renderInput('عمل ولي الأمر', 'guardianJob', 'أدخل عمل ولي الأمر')}
          {renderInput('صلة القرابة', 'guardianRelation', 'أدخل صلة القرابة')}
        </View>

        {/* Academic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأكاديمية</Text>
          
          {renderSelect('نوع التعليم', 'educationType', [
            { value: EducationType.PREPARATORY, label: 'إعدادي' },
            { value: EducationType.INDUSTRIAL_SECONDARY, label: 'ثانوي فني صناعي' },
            { value: EducationType.COMMERCIAL_SECONDARY, label: 'ثانوي فني تجاري' },
            { value: EducationType.AGRICULTURAL_SECONDARY, label: 'ثانوي فني زراعي' },
            { value: EducationType.AZHAR_SECONDARY, label: 'ثانوي أزهري' },
            { value: EducationType.GENERAL_SECONDARY, label: 'ثانوي عام' },
            { value: EducationType.UNIVERSITY, label: 'بكالوريوس/ليسانس' },
            { value: EducationType.INDUSTRIAL_APPRENTICESHIP, label: 'تلمذة صناعية' },
          ])}
          
          {renderInput('اسم المدرسة', 'schoolName', 'أدخل اسم المدرسة')}
          {renderInput('الإدارة التعليمية', 'educationalAdministration', 'أدخل الإدارة التعليمية')}
          <View style={styles.inputContainer}>
            <DateTimePickerField
              label="تاريخ التخرج"
              value={formData.graduationDate?.toString() || ''}
              onChange={(value) => handleInputChange('graduationDate', value)}
              placeholder="اختر تاريخ التخرج"
              mode="date"
            />
          </View>
          {renderInput('المجموع', 'totalGrade', 'أدخل المجموع', 'numeric')}
          {renderInput('النسبة المئوية', 'gradePercentage', 'أدخل النسبة المئوية', 'numeric')}
          {renderInput('العام الدراسي', 'academicYear', 'أدخل العام الدراسي')}
        </View>

        {/* Program Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات البرنامج</Text>

          {programs.length > 0 && renderSelect('البرنامج', 'programId', programs.map((program) => ({
            value: program.id,
            label: program.nameAr,
          })))}

          {renderSelect('نوع الالتحاق', 'enrollmentType', [
            { value: EnrollmentType.REGULAR, label: 'انتظام' },
            { value: EnrollmentType.DISTANCE, label: 'انتساب' },
            { value: EnrollmentType.BOTH, label: 'الكل' },
          ])}

          {renderSelect('نوع البرنامج', 'programType', [
            { value: ProgramType.SUMMER, label: 'صيفي (فبراير)' },
            { value: ProgramType.WINTER, label: 'شتوي (اكتوبر)' },
            { value: ProgramType.ANNUAL, label: 'سنوي' },
          ])}
        </View>

        {/* Update Summary */}
        {updatedFields.length > 0 && (
          <View style={styles.updateSummary}>
            <Text style={styles.updateSummaryTitle}>
              الحقول المحدثة ({updatedFields.length})
            </Text>
            {updatedFields.map((field) => (
              <Text key={field} style={styles.updatedField}>
                • {getFieldDisplayName(field)}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.updateButton,
              (loading || updatedFields.length === 0) && styles.disabledButton
            ]}
            onPress={handleUpdate}
            disabled={loading || updatedFields.length === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>
                تحديث البيانات
                {sendingMessage && ' وإرسال الإشعار...'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2c3e50',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 59,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#3498db',
    borderRadius: 18,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHelpText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  updatedInput: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  selectOptionText: {
    fontSize: 12,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  ageInfoCard: {
    backgroundColor: '#eef6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -8,
    marginBottom: 10,
  },
  ageInfoText: {
    color: '#1e3a8a',
    fontWeight: '700',
    textAlign: 'right',
  },
  updateSummary: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  updateSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10,
  },
  updatedField: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  updateButton: {
    backgroundColor: '#3498db',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTraineeScreen;

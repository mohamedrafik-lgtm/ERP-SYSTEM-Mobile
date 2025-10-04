import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';

interface TraineeAccountDetails {
  id: string;
  nationalId: string;
  birthDate: string;
  password: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  resetCode: string | null;
  resetCodeExpiresAt: string | null;
  resetCodeGeneratedAt: string | null;
  traineeId: number;
  createdAt: string;
  updatedAt: string;
  trainee: {
    id: number;
    nameAr: string;
    nameEn: string;
    nationalId: string;
    email: string | null;
    phone: string;
    photoUrl: string | null;
    photoCloudinaryId: string | null;
    enrollmentType: string;
    maritalStatus: string;
    gender: string;
    nationality: string;
    religion: string;
    birthDate: string;
    idIssueDate: string;
    idExpiryDate: string;
    programType: string;
    programId: number;
    country: string;
    governorate: string | null;
    city: string;
    address: string;
    residenceAddress: string;
    guardianName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    guardianJob: string | null;
    guardianRelation: string;
    landline: string | null;
    whatsapp: string | null;
    facebook: string | null;
    educationType: string;
    schoolName: string;
    graduationDate: string;
    totalGrade: number | null;
    gradePercentage: number | null;
    sportsActivity: string | null;
    culturalActivity: string | null;
    educationalActivity: string | null;
    traineeStatus: string;
    classLevel: string;
    academicYear: string | null;
    marketingEmployeeId: number | null;
    firstContactEmployeeId: number | null;
    secondContactEmployeeId: number | null;
    createdById: string | null;
    updatedById: string | null;
    createdAt: string;
    updatedAt: string;
    notes: string | null;
    program: {
      id: number;
      nameAr: string;
      nameEn: string;
    };
  };
}

interface TraineeAccountDetailsScreenProps {
  route: {
    params: {
      accountId: string;
      accountName?: string;
    };
  };
  navigation: any;
}

const TraineeAccountDetailsScreen = ({ route, navigation }: TraineeAccountDetailsScreenProps) => {
  console.log('🔍 TraineeAccountDetailsScreen - Component loaded');
  console.log('🔍 TraineeAccountDetailsScreen - Route:', route);
  console.log('🔍 TraineeAccountDetailsScreen - Route params:', route?.params);
  
  const { accountId, accountName } = route.params;
  
  console.log('🔍 TraineeAccountDetailsScreen - Account ID:', accountId);
  console.log('🔍 TraineeAccountDetailsScreen - Account Name:', accountName);
  
  const [accountDetails, setAccountDetails] = useState<TraineeAccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountDetails();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 TraineeAccountDetailsScreen - Fetching account details for ID:', accountId);
      
      const details = await AuthService.getTraineeAccountDetails(accountId);
      console.log('🔍 TraineeAccountDetailsScreen - Account details:', details);
      
      setAccountDetails(details);
    } catch (error) {
      console.error('Error fetching account details:', error);
      Alert.alert('خطأ', 'فشل في تحميل تفاصيل حساب المتدرب');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#4CAF50' : '#F44336';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  const getTraineeStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#2196F3';
      case 'continuing':
        return '#4CAF50';
      case 'graduated':
        return '#FF9800';
      case 'withdrawn':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getTraineeStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'جديد';
      case 'continuing':
        return 'مستمر';
      case 'graduated':
        return 'متخرج';
      case 'withdrawn':
        return 'منسحب';
      default:
        return status;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'ذكر';
      case 'female':
        return 'أنثى';
      default:
        return gender;
    }
  };

  const getMaritalStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'single':
        return 'أعزب';
      case 'married':
        return 'متزوج';
      case 'divorced':
        return 'مطلق';
      case 'widowed':
        return 'أرمل';
      default:
        return status;
    }
  };

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
    <View style={styles.infoRow}>
      {icon && <Icon name={icon} size={16} color="#666" style={styles.infoIcon} />}
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل حساب المتدرب</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>جاري تحميل التفاصيل...</Text>
        </View>
      </View>
    );
  }

  if (!accountDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تفاصيل حساب المتدرب</Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#ff3b30" />
          <Text style={styles.errorTitle}>خطأ في البيانات</Text>
          <Text style={styles.errorMessage}>
            لم يتم العثور على تفاصيل حساب المتدرب
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchAccountDetails}
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل حساب المتدرب</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={24} color="#1a237e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* معلومات الحساب الأساسية */}
        <InfoCard title="معلومات الحساب">
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(accountDetails.isActive) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(accountDetails.isActive) }]}>
                {getStatusLabel(accountDetails.isActive)}
              </Text>
            </View>
          </View>
          <InfoRow label="معرف الحساب" value={accountDetails.id} icon="fingerprint" />
          <InfoRow label="الرقم القومي" value={accountDetails.nationalId} icon="badge" />
          <InfoRow label="تاريخ الميلاد" value={new Date(accountDetails.birthDate).toLocaleDateString('ar-EG')} icon="cake" />
          <InfoRow label="تاريخ الإنشاء" value={new Date(accountDetails.createdAt).toLocaleDateString('ar-EG')} icon="calendar-today" />
          {accountDetails.lastLoginAt && (
            <InfoRow label="آخر دخول" value={new Date(accountDetails.lastLoginAt).toLocaleDateString('ar-EG')} icon="login" />
          )}
        </InfoCard>

        {/* معلومات المتدرب الشخصية */}
        <InfoCard title="المعلومات الشخصية">
          <View style={styles.profileContainer}>
            {accountDetails.trainee.photoUrl ? (
              <Image source={{ uri: accountDetails.trainee.photoUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Icon name="person" size={40} color="#666" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{accountDetails.trainee.nameAr}</Text>
              <Text style={styles.profileNameEn}>{accountDetails.trainee.nameEn}</Text>
            </View>
          </View>
          <InfoRow label="النوع" value={getGenderLabel(accountDetails.trainee.gender)} icon="person" />
          <InfoRow label="الحالة الاجتماعية" value={getMaritalStatusLabel(accountDetails.trainee.maritalStatus)} icon="favorite" />
          <InfoRow label="الجنسية" value={accountDetails.trainee.nationality} icon="flag" />
          <InfoRow label="الديانة" value={accountDetails.trainee.religion} icon="book" />
        </InfoCard>

        {/* معلومات التواصل */}
        <InfoCard title="معلومات التواصل">
          <InfoRow label="الهاتف" value={accountDetails.trainee.phone} icon="phone" />
          {accountDetails.trainee.email && (
            <InfoRow label="البريد الإلكتروني" value={accountDetails.trainee.email} icon="email" />
          )}
          {accountDetails.trainee.whatsapp && (
            <InfoRow label="الواتساب" value={accountDetails.trainee.whatsapp} icon="chat" />
          )}
          {accountDetails.trainee.landline && (
            <InfoRow label="الهاتف الأرضي" value={accountDetails.trainee.landline} icon="phone-in-talk" />
          )}
          {accountDetails.trainee.facebook && (
            <InfoRow label="فيسبوك" value={accountDetails.trainee.facebook} icon="facebook" />
          )}
        </InfoCard>

        {/* معلومات العنوان */}
        <InfoCard title="العنوان">
          <InfoRow label="الدولة" value={accountDetails.trainee.country} icon="public" />
          {accountDetails.trainee.governorate && (
            <InfoRow label="المحافظة" value={accountDetails.trainee.governorate} icon="location-city" />
          )}
          <InfoRow label="المدينة" value={accountDetails.trainee.city} icon="location-on" />
          <InfoRow label="العنوان" value={accountDetails.trainee.address} icon="home" />
          <InfoRow label="محل الإقامة" value={accountDetails.trainee.residenceAddress} icon="home-work" />
        </InfoCard>

        {/* معلومات ولي الأمر */}
        <InfoCard title="ولي الأمر">
          <InfoRow label="الاسم" value={accountDetails.trainee.guardianName} icon="person" />
          <InfoRow label="رقم الهاتف" value={accountDetails.trainee.guardianPhone} icon="phone" />
          {accountDetails.trainee.guardianEmail && (
            <InfoRow label="البريد الإلكتروني" value={accountDetails.trainee.guardianEmail} icon="email" />
          )}
          <InfoRow label="صلة القرابة" value={accountDetails.trainee.guardianRelation} icon="family-restroom" />
          {accountDetails.trainee.guardianJob && (
            <InfoRow label="الوظيفة" value={accountDetails.trainee.guardianJob} icon="work" />
          )}
        </InfoCard>

        {/* المعلومات الأكاديمية */}
        <InfoCard title="المعلومات الأكاديمية">
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getTraineeStatusColor(accountDetails.trainee.traineeStatus) + '20' }]}>
              <Text style={[styles.statusText, { color: getTraineeStatusColor(accountDetails.trainee.traineeStatus) }]}>
                {getTraineeStatusLabel(accountDetails.trainee.traineeStatus)}
              </Text>
            </View>
          </View>
          <InfoRow label="البرنامج" value={accountDetails.trainee.program.nameAr} icon="school" />
          <InfoRow label="نوع البرنامج" value={accountDetails.trainee.programType} icon="category" />
          <InfoRow label="الفرقة" value={accountDetails.trainee.classLevel} icon="class" />
          {accountDetails.trainee.academicYear && (
            <InfoRow label="العام الدراسي" value={accountDetails.trainee.academicYear} icon="date-range" />
          )}
          <InfoRow label="نوع المؤهل" value={accountDetails.trainee.educationType} icon="school" />
          <InfoRow label="اسم المدرسة" value={accountDetails.trainee.schoolName} icon="account-balance" />
          <InfoRow label="تاريخ التخرج" value={new Date(accountDetails.trainee.graduationDate).toLocaleDateString('ar-EG')} icon="graduation-cap" />
          {accountDetails.trainee.totalGrade && (
            <InfoRow label="المجموع" value={accountDetails.trainee.totalGrade.toString()} icon="grade" />
          )}
          {accountDetails.trainee.gradePercentage && (
            <InfoRow label="النسبة المئوية" value={`${accountDetails.trainee.gradePercentage}%`} icon="percent" />
          )}
        </InfoCard>

        {/* الأنشطة */}
        {(accountDetails.trainee.sportsActivity || accountDetails.trainee.culturalActivity || accountDetails.trainee.educationalActivity) && (
          <InfoCard title="الأنشطة">
            {accountDetails.trainee.sportsActivity && (
              <InfoRow label="النشاط الرياضي" value={accountDetails.trainee.sportsActivity} icon="sports" />
            )}
            {accountDetails.trainee.culturalActivity && (
              <InfoRow label="النشاط الثقافي" value={accountDetails.trainee.culturalActivity} icon="theater-comedy" />
            )}
            {accountDetails.trainee.educationalActivity && (
              <InfoRow label="النشاط التعليمي" value={accountDetails.trainee.educationalActivity} icon="menu-book" />
            )}
          </InfoCard>
        )}

        {/* ملاحظات */}
        {accountDetails.trainee.notes && (
          <InfoCard title="ملاحظات">
            <Text style={styles.notesText}>{accountDetails.trainee.notes}</Text>
          </InfoCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    width: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    minWidth: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileNameEn: {
    fontSize: 14,
    color: '#666',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default TraineeAccountDetailsScreen;

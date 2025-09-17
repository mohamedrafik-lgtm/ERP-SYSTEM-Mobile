import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';
import WhatsAppAutoMessageService from '../services/WhatsAppAutoMessageService';
import { ITrainee, IPaginatedTraineesResponse, TraineeStatus } from '../types/student';

const StudentsListScreen = ({ navigation }: any) => {
  const [students, setStudents] = useState<ITrainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'NEW', label: 'جديد' },
    { value: 'CURRENT', label: 'حالي' },
    { value: 'GRADUATE', label: 'خريج' },
    { value: 'WITHDRAWN', label: 'منسحب' },
  ];

  const fetchStudents = async (page: number = 1, search: string = '', status: string = 'all') => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        includeDetails,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      };

      console.log('Fetching students with params:', params);
      const result: IPaginatedTraineesResponse = await AuthService.getTrainees(params);
      console.log('API Response:', result);

      setStudents(result.data || []);
      if (result.pagination) {
        setCurrentPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
        setTotalItems(result.pagination.total);
      } else {
        // Fallback if pagination object is missing
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(result.data?.length || 0);
      }
      
      console.log('Students loaded:', result.data?.length || 0, 'students');
    } catch (error) {
      console.error('🔍 StudentsListScreen.fetchStudents() - Error fetching students:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل بيانات الطلاب';

      // معالجة أنواع مختلفة من الأخطاء
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized') || errorMessage.includes('انتهت صلاحية الجلسة')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.', [
          {
            text: 'تسجيل الدخول',
            onPress: () => {
              AuthService.clearAuthData().then(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              });
            }
          }
        ]);
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal server error') || errorMessage.includes('خطأ في الخادم')) {
        Alert.alert('خطأ في الخادم', 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.', [
          {
            text: 'إعادة المحاولة',
            onPress: () => fetchStudents(currentPage, searchText, statusFilter)
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]);
      } else if (errorMessage.includes('Network request failed') || errorMessage.includes('فشل في الاتصال')) {
        Alert.alert('خطأ في الاتصال', 'فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.', [
          {
            text: 'إعادة المحاولة',
            onPress: () => fetchStudents(currentPage, searchText, statusFilter)
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]);
      } else if (errorMessage.includes('انتهت مهلة الطلب')) {
        Alert.alert('انتهت مهلة الطلب', 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.', [
          {
            text: 'إعادة المحاولة',
            onPress: () => fetchStudents(currentPage, searchText, statusFilter)
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]);
      } else {
        Alert.alert('خطأ', errorMessage, [
          {
            text: 'إعادة المحاولة',
            onPress: () => fetchStudents(currentPage, searchText, statusFilter)
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchStudents(1, searchText, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    fetchStudents(1, searchText, status);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents(currentPage, searchText, statusFilter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchStudents(page, searchText, statusFilter);
  };

  const toggleStudentExpansion = (studentId: number) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: TraineeStatus) => {
    switch (status) {
      case 'CURRENT':
        return '#10b981';
      case 'NEW':
        return '#3b82f6';
      case 'GRADUATE':
        return '#059669';
      case 'WITHDRAWN':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: TraineeStatus) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getSubscriptionColor = (enrollmentType: string) => {
    switch (enrollmentType) {
      case 'REGULAR':
        return '#10b981'; // أخضر للانتظام
      case 'PART_TIME':
        return '#3b82f6'; // أزرق للانتساب
      default:
        return '#6b7280'; // رمادي للقيم غير المعروفة
    }
  };

  const getSubscriptionLabel = (enrollmentType: string) => {
    switch (enrollmentType) {
      case 'REGULAR':
        return 'انتظام';
      case 'PART_TIME':
        return 'انتساب';
      default:
        return 'غير محدد';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return '#1a237e'; // أزرق للذكر
      case 'FEMALE':
        return '#e91e63'; // وردي للأنثى
      default:
        return '#6b7280'; // رمادي للقيم غير المعروفة
    }
  };

  const handleCall = (phoneNumber: string, studentName: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('خطأ', 'لا يمكن فتح تطبيق الاتصال');
        }
      })
      .catch((err) => {
        console.error('Error opening phone app:', err);
        Alert.alert('خطأ', 'حدث خطأ أثناء فتح تطبيق الاتصال');
      });
  };

  const handleWhatsApp = (phoneNumber: string, studentName: string) => {
    // تنظيف رقم الهاتف من المسافات والرموز
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // إذا لم يكن الواتساب مثبت، افتح المتصفح
          const webUrl = `https://wa.me/${cleanPhone}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('خطأ', 'حدث خطأ أثناء فتح الواتساب');
      });
  };

  const handleStudentAction = (student: ITrainee) => {
    Alert.alert(
      'إجراءات الطالب',
      `اختر الإجراء المطلوب لـ ${student.nameAr}`,
      [
        {
          text: 'تحديث البيانات',
          onPress: () => navigation.navigate('EditTrainee', { trainee: student }),
        },
        {
          text: 'مدفوعات المتدرب',
          onPress: () => navigation.navigate('TraineePaymentDetails', { traineeId: student.id, traineeName: student.nameAr }),
        },
        {
          text: 'حذف المتدرب',
          style: 'destructive',
          onPress: () => handleDeleteStudent(student),
        },
        {
          text: 'إلغاء',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteStudent = (student: ITrainee) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المتدرب "${student.nameAr}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => confirmDeleteStudent(student),
        },
      ]
    );
  };

  const confirmDeleteStudent = async (student: ITrainee) => {
    try {
      setLoading(true);
      console.log('Deleting trainee:', student.id);

      // Delete trainee
      const response = await AuthService.deleteTrainee(student.id);
      console.log('Delete response:', response);

      if (response.success !== false) {
        // Show success message
        Alert.alert(
          'تم الحذف بنجاح',
          `تم حذف المتدرب "${student.nameAr}" بنجاح`,
          [
            {
              text: 'موافق',
              onPress: () => {
                // Refresh the list
                fetchStudents(currentPage, searchText, statusFilter);
              },
            },
          ]
        );

        // Send WhatsApp message if phone number is available
        if (student.phone) {
          try {
            await WhatsAppAutoMessageService.sendTraineeDeletionMessage(
              student.phone,
              student.nameAr,
              'حذف من النظام',
              'النظام', // You can get this from user context
              new Date().toISOString()
            );
            
            console.log('WhatsApp deletion message sent successfully');
          } catch (messageError) {
            console.error('Error sending WhatsApp deletion message:', messageError);
            // Don't show error to user as deletion was successful
          }
        }
      } else {
        throw new Error(response.message || response.error || 'فشل في حذف المتدرب');
      }
    } catch (error: any) {
      console.error('Error deleting trainee:', error);
      Alert.alert(
        'خطأ في الحذف',
        error.message || 'حدث خطأ غير متوقع أثناء حذف المتدرب'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            i === currentPage && styles.activePageButton,
          ]}
          onPress={() => handlePageChange(i)}
        >
          <Text
            style={[
              styles.pageButtonText,
              i === currentPage && styles.activePageButtonText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>
        
        {pages}
        
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Icon name="chevron-right" size={20} color={currentPage === totalPages ? '#9ca3af' : '#1a237e'} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="StudentsList" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title}>قائمة الطلاب</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        {/* شريط البحث والفلاتر */}
        <View style={styles.searchContainer}>
          <ArabicSearchInput
            placeholder="البحث عن الطلاب..."
            value={searchText}
            onChangeText={setSearchText}
            onSearch={handleSearch}
          />

          {/* فلاتر الحالة */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterButton,
                  statusFilter === option.value && styles.activeFilterButton,
                ]}
                onPress={() => handleStatusFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === option.value && styles.activeFilterButtonText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddStudent')}>
            <Icon name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>إضافة طالب</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={() => {
            console.log('Testing API connection...');
            fetchStudents(1, '', 'all');
          }}>
            <Icon name="refresh" size={20} color="#1a237e" />
            <Text style={styles.testButtonText}>اختبار الاتصال</Text>
          </TouchableOpacity>
        </View>

        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="school" size={24} color="#1a237e" />
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={styles.statLabel}>إجمالي الطلاب</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={24} color="#10b981" />
            <Text style={styles.statNumber}>
              {students.filter(s => s.traineeStatus === 'CURRENT').length}
            </Text>
            <Text style={styles.statLabel}>حالي</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="school" size={24} color="#059669" />
            <Text style={styles.statNumber}>
              {students.filter(s => s.traineeStatus === 'GRADUATE').length}
            </Text>
            <Text style={styles.statLabel}>خريج</Text>
          </View>
        </View>

        {/* قائمة الطلاب */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل الطلاب...</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا يوجد طلاب</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على أي طلاب يطابقون معايير البحث الحالية.</Text>
            <Text style={styles.debugText}>
              إجمالي الطلاب: {totalItems} | الصفحة: {currentPage} من {totalPages}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchStudents(1, '', 'all')}
            >
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة تحميل الكل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studentsList}>
            {students.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                {/* Header with Image and Basic Info */}
                <View style={styles.cardHeader}>
                  <View style={styles.studentImageContainer}>
                    {student.photoUrl ? (
                      <Image 
                        source={{ uri: student.photoUrl }} 
                        style={styles.studentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.defaultImageContainer}>
                        <Icon name="person" size={32} color="#6b7280" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.studentBasicInfo}>
                    <Text style={styles.studentName}>{student.nameAr}</Text>
                    <View style={styles.badgesContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: getSubscriptionColor(student.enrollmentType) + '20' }]}>
                        <Text style={[styles.statusText, { color: getSubscriptionColor(student.enrollmentType) }]}>
                          {getSubscriptionLabel(student.enrollmentType)}
                        </Text>
                      </View>
                      <View style={[styles.genderBadge, { backgroundColor: getGenderColor(student.gender) + '20' }]}>
                        <Text style={[styles.genderText, { color: getGenderColor(student.gender) }]}>
                          {student.gender === 'MALE' ? 'ذكر' : 'أنثى'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtonsContainer}>
                    {student.phone && (
                      <>
                        <TouchableOpacity 
                          style={styles.whatsappButton}
                          onPress={() => handleWhatsApp(student.phone, student.nameAr)}
                        >
                          <Icon name="chat" size={20} color="#25D366" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.callButton}
                          onPress={() => handleCall(student.phone, student.nameAr)}
                        >
                          <Icon name="phone" size={20} color="#1a237e" />
                        </TouchableOpacity>
                      </>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleStudentAction(student)}
                    >
                      <Icon name="more-vert" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Basic Details Section */}
                <View style={styles.studentDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="assignment" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {getSubscriptionLabel(student.enrollmentType)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Icon name="wb-sunny" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {student.programType === 'SUMMER' ? 'صيفي' : 
                       student.programType === 'WINTER' ? 'شتوي' : 
                       student.programType || 'غير محدد'}
                    </Text>
                  </View>

                  {/* Expand/Collapse Button */}
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => toggleStudentExpansion(student.id)}
                  >
                    <Icon 
                      name={expandedStudents.has(student.id) ? "expand-less" : "expand-more"} 
                      size={20} 
                      color="#1a237e" 
                    />
                    <Text style={styles.expandButtonText}>
                      {expandedStudents.has(student.id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Expanded Details Section */}
                {expandedStudents.has(student.id) && (
                  <View style={styles.expandedDetails}>
                    {/* Personal Information */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
                      
                      {student.email && (
                        <View style={styles.detailRow}>
                          <Icon name="email" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.email}</Text>
                        </View>
                      )}
                      
                      {student.nationalId && (
                        <View style={styles.detailRow}>
                          <Icon name="badge" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.nationalId}</Text>
                        </View>
                      )}
                      
                      {student.address && (
                        <View style={styles.detailRow}>
                          <Icon name="location-on" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.address}</Text>
                        </View>
                      )}
                    </View>

                    {/* Educational Information */}
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionTitle}>المعلومات التعليمية</Text>
                      
                      {student.educationalQualification && (
                        <View style={styles.detailRow}>
                          <Icon name="workspace-premium" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.educationalQualification}</Text>
                        </View>
                      )}
                      
                      {student.specialization && (
                        <View style={styles.detailRow}>
                          <Icon name="work" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.specialization}</Text>
                        </View>
                      )}
                      
                      {student.program && (
                        <View style={styles.detailRow}>
                          <Icon name="school" size={16} color="#6b7280" />
                          <Text style={styles.detailText}>{student.program.nameAr}</Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.expandedActions}>
                      <TouchableOpacity 
                        style={styles.actionButtonExpanded}
                        onPress={() => navigation.navigate('TraineeDocuments', { 
                          trainee: { id: student.id, nameAr: student.nameAr } 
                        })}
                      >
                        <Icon name="description" size={18} color="#1a237e" />
                        <Text style={styles.actionButtonText}>الوثائق</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButtonExpanded}
                        onPress={() => navigation.navigate('TraineePaymentDetails', { 
                          traineeId: student.id, 
                          traineeName: student.nameAr 
                        })}
                      >
                        <Icon name="payment" size={18} color="#10b981" />
                        <Text style={styles.actionButtonText}>المدفوعات</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButtonExpanded}
                        onPress={() => navigation.navigate('EditTrainee', { trainee: student })}
                      >
                        <Icon name="edit" size={18} color="#f59e0b" />
                        <Text style={styles.actionButtonText}>تعديل</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* الباجينيشن */}
        {!loading && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Text style={styles.paginationInfo}>
              صفحة {currentPage} من {totalPages} ({totalItems} طالب)
            </Text>
            {renderPagination()}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
    flex: 1,
  },
  testButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilterButton: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  studentsList: {
    marginBottom: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentImageContainer: {
    marginRight: 12,
  },
  studentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  defaultImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentBasicInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  genderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsappButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  paginationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activePageButton: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activePageButtonText: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  retryButtonText: {
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    marginLeft: 4,
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButtonExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default StudentsListScreen;


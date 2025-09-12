import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import ArabicSearchInput from '../components/ArabicSearchInput';
import AuthService from '../services/AuthService';
import { ITrainingContent, ITrainingProgram } from '../types/student';
import { ISemesterArabic, YearArabic } from '../types/enums';

const TrainingContentsScreen = ({ navigation }: any) => {
  const [contents, setContents] = useState<ITrainingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [programs, setPrograms] = useState<ITrainingProgram[]>([]);

  const semesterOptions = [
    { value: 'all', label: 'جميع الفصول' },
    { value: 'FIRST', label: 'الفصل الأول' },
    { value: 'SECOND', label: 'الفصل الثاني' },
  ];

  const yearOptions = [
    { value: 'all', label: 'جميع السنوات' },
    { value: 'FIRST', label: 'السنة الأولى' },
    { value: 'SECOND', label: 'السنة الثانية' },
    { value: 'THIRD', label: 'السنة الثالثة' },
    { value: 'FOURTH', label: 'السنة الرابعة' },
  ];

  const fetchContents = async (search: string = '', semester: string = 'all', year: string = 'all', programId: string = 'all') => {
    try {
      setLoading(true);
      const params: any = {
        includeQuestionCount: true,
      };

      if (search) params.search = search;
      if (semester !== 'all') params.semester = semester;
      if (year !== 'all') params.year = year;
      if (programId !== 'all') params.programId = parseInt(programId);

      console.log('Fetching training contents with params:', params);
      const result = await AuthService.getTrainingContents(params);
      console.log('API Response:', result);

      setContents(result || []);
      console.log('Training contents loaded:', result?.length || 0, 'contents');
    } catch (error) {
      console.error('Error fetching training contents:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في تحميل المحتوى التدريبي';

      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized')) {
        Alert.alert('خطأ في المصادقة', 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.');
        AuthService.clearAuthData().then(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        });
      } else {
        Alert.alert('خطأ', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const fetchedPrograms = await AuthService.getAllPrograms();
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  useEffect(() => {
    fetchContents();
    fetchPrograms();
  }, []);

  const handleSearch = () => {
    fetchContents(searchText, semesterFilter, yearFilter, programFilter);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'semester':
        setSemesterFilter(value);
        fetchContents(searchText, value, yearFilter, programFilter);
        break;
      case 'year':
        setYearFilter(value);
        fetchContents(searchText, semesterFilter, value, programFilter);
        break;
      case 'program':
        setProgramFilter(value);
        fetchContents(searchText, semesterFilter, yearFilter, value);
        break;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContents(searchText, semesterFilter, yearFilter, programFilter);
  };

  const handleDeleteContent = (content: ITrainingContent) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المحتوى التدريبي "${content.name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AuthService.deleteTrainingContent(content.id);
              Toast.show({
                type: 'success',
                text1: 'تم الحذف بنجاح',
                text2: `تم حذف المحتوى التدريبي "${content.name}"`,
              });
              // إعادة تحميل البيانات
              fetchContents(searchText, semesterFilter, yearFilter, programFilter);
            } catch (error: any) {
              console.error('Error deleting training content:', error);
              Alert.alert(
                'خطأ',
                error.message || 'حدث خطأ أثناء حذف المحتوى التدريبي',
                [{ text: 'حسناً', style: 'cancel' }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getSemesterLabel = (semester: string) => {
    return ISemesterArabic[semester as keyof typeof ISemesterArabic] || semester;
  };

  const getYearLabel = (year: string) => {
    return YearArabic[year as keyof typeof YearArabic] || year;
  };

  const getTotalMarks = (content: ITrainingContent) => {
    return content.yearWorkMarks + content.practicalMarks + content.writtenMarks + 
           content.attendanceMarks + content.quizzesMarks + content.finalExamMarks;
  };

  const renderFilterButtons = (options: any[], filterType: string, currentValue: string) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterButton,
            currentValue === option.value && styles.activeFilterButton,
          ]}
          onPress={() => handleFilterChange(filterType, option.value)}
        >
          <Text
            style={[
              styles.filterButtonText,
              currentValue === option.value && styles.activeFilterButtonText,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="TrainingContents" />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <Text style={styles.title}>المحتوى التدريبي</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
        {/* شريط البحث والفلاتر */}
        <View style={styles.searchContainer}>
          <ArabicSearchInput
            placeholder="البحث في المحتوى التدريبي..."
            value={searchText}
            onChangeText={setSearchText}
            onSearch={handleSearch}
          />

          {/* فلاتر الفصل الدراسي */}
          <Text style={styles.filterTitle}>الفصل الدراسي</Text>
          {renderFilterButtons(semesterOptions, 'semester', semesterFilter)}

          {/* فلاتر السنة الدراسية */}
          <Text style={styles.filterTitle}>السنة الدراسية</Text>
          {renderFilterButtons(yearOptions, 'year', yearFilter)}

          {/* فلاتر البرنامج */}
          <Text style={styles.filterTitle}>البرنامج التدريبي</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                programFilter === 'all' && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterChange('program', 'all')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  programFilter === 'all' && styles.activeFilterButtonText,
                ]}
              >
                جميع البرامج
              </Text>
            </TouchableOpacity>
            {programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.filterButton,
                  programFilter === program.id.toString() && styles.activeFilterButton,
                ]}
                onPress={() => handleFilterChange('program', program.id.toString())}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    programFilter === program.id.toString() && styles.activeFilterButtonText,
                  ]}
                >
                  {program.nameAr}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddTrainingContent')}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة محتوى تدريبي</Text>
        </TouchableOpacity>

        {/* إحصائيات */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="book" size={24} color="#1a237e" />
            <Text style={styles.statNumber}>{contents.length}</Text>
            <Text style={styles.statLabel}>إجمالي المحتوى</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="quiz" size={24} color="#10b981" />
            <Text style={styles.statNumber}>
              {contents.reduce((sum, c) => sum + (c._count?.questions || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>إجمالي الأسئلة</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="school" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>
              {contents.filter(c => c.semester === 'FIRST').length}
            </Text>
            <Text style={styles.statLabel}>الفصل الأول</Text>
          </View>
        </View>

        {/* قائمة المحتوى التدريبي */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل المحتوى التدريبي...</Text>
          </View>
        ) : contents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="book-outlined" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا يوجد محتوى تدريبي</Text>
            <Text style={styles.emptySubtitle}>لم يتم العثور على أي محتوى يطابق معايير البحث الحالية.</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchContents('', 'all', 'all', 'all')}
            >
              <Icon name="refresh" size={20} color="#1a237e" />
              <Text style={styles.retryButtonText}>إعادة تحميل الكل</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentsList}>
            {contents.map((content) => (
              <View key={content.id} style={styles.contentCard}>
                <View style={styles.contentInfo}>
                  <View style={styles.contentHeader}>
                    <View style={styles.contentTitleContainer}>
                      <Text style={styles.contentCode}>{content.code}</Text>
                      <Text style={styles.contentName}>{content.name}</Text>
                    </View>
                    <View style={styles.contentBadges}>
                      <View style={[styles.badge, { backgroundColor: '#e3f2fd' }]}> 
                        <Text style={[styles.badgeText, { color: '#1976d2' }]}>{getSemesterLabel(content.semester)}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: '#f3e5f5' }]}> 
                        <Text style={[styles.badgeText, { color: '#7b1fa2' }]}>{getYearLabel(content.year)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.contentDetails}>
                    {content.program && (
                      <View style={styles.detailRow}>
                        <Icon name="book" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>{content.program.nameAr}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Icon name="person" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>المحاضر: {content.instructor.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="schedule" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{content.theorySessionsPerWeek} نظري + {content.practicalSessionsPerWeek} عملي أسبوعياً</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="assessment" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>إجمالي الدرجات: {getTotalMarks(content)} | الفصول: {content.chaptersCount}</Text>
                    </View>
                    {content._count?.questions && (
                      <View style={styles.detailRow}>
                        <Icon name="quiz" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>عدد الأسئلة: {content._count.questions}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('EditTrainingContent', { content })}
                  >
                    <Icon name="edit" size={16} color="#1a237e" />
                    <Text style={styles.actionButtonText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.questionsButton}
                    onPress={() => navigation.navigate('QuestionsScreen', { content })}
                  >
                    <Icon name="quiz" size={16} color="#059669" />
                    <Text style={styles.questionsButtonText}>الأسئلة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteActionButton}
                    onPress={() => handleDeleteContent(content)}
                  >
                    <Icon name="delete" size={16} color="#dc2626" />
                    <Text style={styles.deleteActionButtonText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <Toast />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
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
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
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
  contentsList: {
    marginBottom: 20,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  contentInfo: {
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentTitleContainer: {
    flex: 1,
  },
  contentCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  contentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  contentBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contentDetails: {
    marginTop: 8,
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
  cardActions: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#1a237e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#1a237e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  questionsButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteActionButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
});

export default TrainingContentsScreen;

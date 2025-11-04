import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { TraineeGradesResponse, ContentGrade } from '../types/grades';

interface TraineeGradeDetailsScreenProps {
  route: {
    params: {
      traineeId: number;
      traineeName: string;
    };
  };
  navigation: any;
}

const TraineeGradeDetailsScreen = ({ route, navigation }: TraineeGradeDetailsScreenProps) => {
  const { traineeId, traineeName } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gradesData, setGradesData] = useState<TraineeGradesResponse | null>(null);

  useEffect(() => {
    fetchTraineeGrades();
  }, [traineeId]);

  const fetchTraineeGrades = async () => {
    try {
      setLoading(true);
      console.log('🔍 TraineeGradeDetailsScreen - Fetching trainee grades for ID:', traineeId);
      
      const response = await AuthService.getTraineeGrades(traineeId);
      console.log('🔍 TraineeGradeDetailsScreen - API response:', JSON.stringify(response, null, 2));
      
      setGradesData(response);
      console.log('🔍 TraineeGradeDetailsScreen - Grades data loaded:', response?.contentGrades?.length || 0);
      console.log('🔍 TraineeGradeDetailsScreen - Trainee photo URL:', response?.trainee?.photoUrl);
      console.log('🔍 TraineeGradeDetailsScreen - Has photo URL?', !!response?.trainee?.photoUrl);
    } catch (error) {
      console.error('🔍 TraineeGradeDetailsScreen - Error fetching trainee grades:', error);
      
      // Provide more specific error messages
      let errorMessage = 'فشل في تحميل درجات المتدرب';
      if ((error as Error).message.includes('Network request failed')) {
        errorMessage = 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.';
      } else if ((error as Error).message.includes('timeout')) {
        errorMessage = 'انتهت مهلة الاتصال. حاول مرة أخرى.';
      } else if ((error as Error).message.includes('غير مصرح')) {
        errorMessage = 'غير مصرح بالوصول. يرجى تسجيل الدخول مرة أخرى.';
      } else if ((error as Error).message.includes('غير موجود')) {
        errorMessage = 'المتدرب غير موجود.';
      } else {
        errorMessage = `فشل في تحميل درجات المتدرب: ${(error as Error).message}`;
      }
      
      Alert.alert('خطأ', errorMessage, [
        { text: 'إعادة المحاولة', onPress: () => fetchTraineeGrades() },
        { text: 'موافق', style: 'cancel' }
      ]);
      
      setGradesData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTraineeGrades();
    setRefreshing(false);
  };

  const getGradePercentage = (obtained: number | null, max: number) => {
    if (!obtained || max === 0) return 0;
    return Math.round((obtained / max) * 100);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return '#4CAF50'; // Green
    if (percentage >= 80) return '#8BC34A'; // Light Green
    if (percentage >= 70) return '#FFC107'; // Amber
    if (percentage >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const renderGradeCard = ({ item }: { item: ContentGrade }) => {
    const { content, grade } = item;
    const hasGrade = grade !== null;
    
    // Calculate percentages for each component
    const yearWorkPercentage = getGradePercentage(grade?.yearWorkMarks, content.maxMarks.yearWorkMarks);
    const practicalPercentage = getGradePercentage(grade?.practicalMarks, content.maxMarks.practicalMarks);
    const writtenPercentage = getGradePercentage(grade?.writtenMarks, content.maxMarks.writtenMarks);
    const attendancePercentage = getGradePercentage(grade?.attendanceMarks, content.maxMarks.attendanceMarks);
    const quizzesPercentage = getGradePercentage(grade?.quizzesMarks, content.maxMarks.quizzesMarks);
    const finalExamPercentage = getGradePercentage(grade?.finalExamMarks, content.maxMarks.finalExamMarks);
    const totalPercentage = getGradePercentage(grade?.totalMarks, content.maxMarks.total);

    return (
      <View style={styles.gradeCard}>
        <View style={styles.gradeHeader}>
          <View style={styles.contentInfo}>
            <Text style={styles.contentName}>{content.name}</Text>
            <Text style={styles.contentCode}>{content.code}</Text>
            <Text style={styles.classroomName}>الفصل: {content.classroom.name}</Text>
          </View>
          {hasGrade && (
            <View style={[styles.totalGradeBadge, { backgroundColor: getGradeColor(totalPercentage) }]}>
              <Text style={styles.totalGradeText}>{totalPercentage}%</Text>
              <Text style={styles.totalGradeLabel}>{getGradeLabel(totalPercentage)}</Text>
            </View>
          )}
        </View>

        {hasGrade ? (
          <View style={styles.gradeDetails}>
            {/* Year Work Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>أعمال السنة</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.yearWorkMarks || 0} / {content.maxMarks.yearWorkMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(yearWorkPercentage) }]}>
                  {yearWorkPercentage}%
                </Text>
              </View>
            </View>

            {/* Practical Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>العملي</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.practicalMarks || 0} / {content.maxMarks.practicalMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(practicalPercentage) }]}>
                  {practicalPercentage}%
                </Text>
              </View>
            </View>

            {/* Written Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>التحريري</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.writtenMarks || 0} / {content.maxMarks.writtenMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(writtenPercentage) }]}>
                  {writtenPercentage}%
                </Text>
              </View>
            </View>

            {/* Attendance Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>الحضور</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.attendanceMarks || 0} / {content.maxMarks.attendanceMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(attendancePercentage) }]}>
                  {attendancePercentage}%
                </Text>
              </View>
            </View>

            {/* Quizzes Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>اختبارات مصغرة</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.quizzesMarks || 0} / {content.maxMarks.quizzesMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(quizzesPercentage) }]}>
                  {quizzesPercentage}%
                </Text>
              </View>
            </View>

            {/* Final Exam Marks */}
            <View style={styles.gradeRow}>
              <Text style={styles.gradeLabel}>الميد تيرم</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.gradeValue}>
                  {grade?.finalExamMarks || 0} / {content.maxMarks.finalExamMarks}
                </Text>
                <Text style={[styles.gradePercentage, { color: getGradeColor(finalExamPercentage) }]}>
                  {finalExamPercentage}%
                </Text>
              </View>
            </View>

            {/* Total Marks */}
            <View style={[styles.gradeRow, styles.totalGradeRow]}>
              <Text style={styles.totalGradeLabel}>المجموع الكلي</Text>
              <View style={styles.gradeValueContainer}>
                <Text style={styles.totalGradeValue}>
                  {grade?.totalMarks || 0} / {content.maxMarks.total}
                </Text>
                <Text style={[styles.totalGradePercentage, { color: getGradeColor(totalPercentage) }]}>
                  {totalPercentage}%
                </Text>
              </View>
            </View>

            {/* Notes */}
            {grade?.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>ملاحظات:</Text>
                <Text style={styles.notesText}>{grade.notes}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noGradeContainer}>
            <Icon name="grade" size={32} color="#ccc" />
            <Text style={styles.noGradeText}>لا توجد درجات مسجلة</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>جاري تحميل درجات المتدرب...</Text>
      </View>
    );
  }

  if (!gradesData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#f44336" />
        <Text style={styles.errorText}>فشل في تحميل درجات المتدرب</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTraineeGrades}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { trainee, contentGrades } = gradesData;
  const gradesWithMarks = contentGrades.filter(item => item.grade !== null);
  const gradesWithoutMarks = contentGrades.filter(item => item.grade === null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>درجات المتدرب</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Trainee Info */}
        <View style={styles.traineeInfoCard}>
          <View style={styles.traineeHeader}>
            <View style={styles.traineeDetails}>
              <Text style={styles.traineeName}>{trainee.nameAr}</Text>
              <Text style={styles.traineeId}>الرقم القومي: {trainee.nationalId}</Text>
              <Text style={styles.programName}>{trainee.program.nameAr}</Text>
            </View>
            <View style={styles.photoContainer}>
              {trainee.photoUrl ? (
                <>
                  {console.log('🔍 TraineeGradeDetailsScreen - Rendering photo with URL:', trainee.photoUrl)}
                  <Image 
                    source={{ uri: trainee.photoUrl }} 
                    style={styles.traineePhoto}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('🔍 TraineeGradeDetailsScreen - Failed to load photo:', trainee.photoUrl);
                      console.log('🔍 TraineeGradeDetailsScreen - Image error:', error);
                    }}
                    onLoad={() => {
                      console.log('🔍 TraineeGradeDetailsScreen - Photo loaded successfully:', trainee.photoUrl);
                    }}
                  />
                </>
              ) : (
                <>
                  {console.log('🔍 TraineeGradeDetailsScreen - No photo URL, showing icon')}
                  <Icon name="person" size={40} color="#666" />
                </>
              )}
            </View>
          </View>
          
          {(trainee.phone || trainee.email) && (
            <View style={styles.contactInfo}>
              {trainee.phone && (
                <View style={styles.contactRow}>
                  <Icon name="phone" size={16} color="#666" />
                  <Text style={styles.contactText}>{trainee.phone}</Text>
                </View>
              )}
              {trainee.email && (
                <View style={styles.contactRow}>
                  <Icon name="email" size={16} color="#666" />
                  <Text style={styles.contactText}>{trainee.email}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{contentGrades.length}</Text>
            <Text style={styles.statLabel}>إجمالي المواد</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{gradesWithMarks.length}</Text>
            <Text style={styles.statLabel}>لديهم درجات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{gradesWithoutMarks.length}</Text>
            <Text style={styles.statLabel}>بدون درجات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2196F3' }]}>
              {gradesWithMarks.length > 0 ? Math.round(
                gradesWithMarks.reduce((sum, item) => {
                  const percentage = getGradePercentage(item.grade?.totalMarks, item.content.maxMarks.total);
                  return sum + percentage;
                }, 0) / gradesWithMarks.length
              ) : 0}%
            </Text>
            <Text style={styles.statLabel}>المتوسط العام</Text>
          </View>
        </View>

        {/* Grades List */}
        <View style={styles.gradesContainer}>
          <Text style={styles.sectionTitle}>درجات المواد ({contentGrades.length})</Text>
          
          {contentGrades.length > 0 ? (
            <FlatList
              data={contentGrades}
              renderItem={renderGradeCard}
              keyExtractor={(item) => item.content.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="grade" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد مواد متاحة</Text>
              <Text style={styles.emptySubtext}>لم يتم العثور على مواد لهذا المتدرب</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  traineeInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  traineeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  traineeDetails: {
    flex: 1,
  },
  traineeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  traineeId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  programName: {
    fontSize: 14,
    color: '#1a237e',
    marginTop: 4,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  traineePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  gradesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  gradeCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentInfo: {
    flex: 1,
  },
  contentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contentCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  classroomName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  totalGradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  totalGradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalGradeLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
  gradeDetails: {
    marginTop: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalGradeRow: {
    backgroundColor: '#f8f9fa',
    marginTop: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderBottomWidth: 0,
  },
  gradeLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  totalGradeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  gradeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeValue: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  totalGradeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  gradePercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  totalGradePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noGradeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noGradeText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TraineeGradeDetailsScreen;

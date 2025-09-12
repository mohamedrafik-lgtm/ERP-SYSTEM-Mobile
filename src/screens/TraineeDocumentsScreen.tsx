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
  Image,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { 
  TraineeDocumentsResponse, 
  DocumentWithStatus, 
  DocumentType,
  TraineeDocument 
} from '../types/student';

const TraineeDocumentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainee } = route.params as { trainee: { id: number; nameAr: string } };

  const [documentsData, setDocumentsData] = useState<TraineeDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents for trainee:', trainee.id);
      
      const response = await AuthService.getTraineeDocuments(trainee.id);
      console.log('Documents response:', response);
      
      setDocumentsData(response);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      Alert.alert(
        'خطأ في جلب البيانات',
        error.message || 'حدث خطأ غير متوقع أثناء جلب وثائق المتدرب'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const getDocumentTypeIcon = (type: DocumentType): string => {
    switch (type) {
      case 'NATIONAL_ID':
        return 'credit-card';
      case 'PASSPORT':
        return 'book';
      case 'BIRTH_CERTIFICATE':
        return 'child-care';
      case 'EDUCATION_CERTIFICATE':
        return 'school';
      case 'MEDICAL_CERTIFICATE':
        return 'local-hospital';
      case 'PHOTO':
        return 'photo-camera';
      case 'CONTRACT':
        return 'description';
      case 'OTHER':
        return 'insert-drive-file';
      default:
        return 'description';
    }
  };

  const getDocumentTypeColor = (type: DocumentType): string => {
    switch (type) {
      case 'NATIONAL_ID':
        return '#3498db';
      case 'PASSPORT':
        return '#e74c3c';
      case 'BIRTH_CERTIFICATE':
        return '#f39c12';
      case 'EDUCATION_CERTIFICATE':
        return '#2ecc71';
      case 'MEDICAL_CERTIFICATE':
        return '#e67e22';
      case 'PHOTO':
        return '#9b59b6';
      case 'CONTRACT':
        return '#34495e';
      case 'OTHER':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDocument = async (document: TraineeDocument) => {
    try {
      // Try to open the document URL
      const canOpen = await Linking.canOpenURL(document.filePath);
      if (canOpen) {
        await Linking.openURL(document.filePath);
      } else {
        Alert.alert('خطأ', 'لا يمكن فتح هذا الملف');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح الملف');
    }
  };

  const renderDocumentCard = (doc: DocumentWithStatus) => {
    const iconColor = getDocumentTypeColor(doc.type);
    const iconName = getDocumentTypeIcon(doc.type);

    return (
      <View key={doc.type} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentIconContainer}>
            <Icon name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName}>{doc.nameAr}</Text>
            <View style={styles.documentStatusContainer}>
              {doc.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>مطلوب</Text>
                </View>
              )}
              {doc.isUploaded ? (
                <View style={[styles.statusBadge, { backgroundColor: doc.isVerified ? '#2ecc71' : '#f39c12' }]}>
                  <Text style={styles.statusText}>
                    {doc.isVerified ? 'محقق' : 'مرفوع'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#e74c3c' }]}>
                  <Text style={styles.statusText}>غير مرفوع</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {doc.isUploaded && doc.document && (
          <View style={styles.documentDetails}>
            <View style={styles.documentDetailRow}>
              <Icon name="insert-drive-file" size={16} color="#666" />
              <Text style={styles.documentDetailText}>{doc.document.fileName}</Text>
            </View>
            <View style={styles.documentDetailRow}>
              <Icon name="storage" size={16} color="#666" />
              <Text style={styles.documentDetailText}>{formatFileSize(doc.document.fileSize)}</Text>
            </View>
            <View style={styles.documentDetailRow}>
              <Icon name="schedule" size={16} color="#666" />
              <Text style={styles.documentDetailText}>{formatDate(doc.document.uploadedAt)}</Text>
            </View>
            <View style={styles.documentDetailRow}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.documentDetailText}>رفع بواسطة: {doc.document.uploadedBy.name}</Text>
            </View>
            {doc.document.notes && (
              <View style={styles.documentDetailRow}>
                <Icon name="note" size={16} color="#666" />
                <Text style={styles.documentDetailText}>{doc.document.notes}</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.viewDocumentButton}
              onPress={() => handleViewDocument(doc.document!)}
            >
              <Icon name="visibility" size={20} color="#3498db" />
              <Text style={styles.viewDocumentText}>عرض الوثيقة</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderStatsCard = () => {
    if (!documentsData) return null;

    const { stats } = documentsData;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>إحصائيات الوثائق</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalRequired}</Text>
            <Text style={styles.statLabel}>مطلوب</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.uploadedRequired}</Text>
            <Text style={styles.statLabel}>مرفوع</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.verifiedCount}</Text>
            <Text style={styles.statLabel}>محقق</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: stats.isComplete ? '#2ecc71' : '#e74c3c' }]}>
              {stats.completionPercentage}%
            </Text>
            <Text style={styles.statLabel}>مكتمل</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${stats.completionPercentage}%`,
                  backgroundColor: stats.isComplete ? '#2ecc71' : '#f39c12'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {stats.isComplete ? 'جميع الوثائق المطلوبة مرفوعة' : 'يحتاج رفع وثائق إضافية'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>جاري تحميل وثائق المتدرب...</Text>
      </View>
    );
  }

  if (!documentsData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>لا يمكن تحميل وثائق المتدرب</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDocuments}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>وثائق المتدرب</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Trainee Info */}
        <View style={styles.traineeInfoCard}>
          <View style={styles.traineeInfo}>
            {documentsData.trainee.photoUrl && (
              <Image 
                source={{ uri: documentsData.trainee.photoUrl }} 
                style={styles.traineePhoto}
              />
            )}
            <View style={styles.traineeDetails}>
              <Text style={styles.traineeName}>{documentsData.trainee.nameAr}</Text>
              <Text style={styles.traineeId}>رقم المتدرب: {documentsData.trainee.id}</Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>قائمة الوثائق</Text>
          {documentsData.documents.map(renderDocumentCard)}
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
  refreshButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  traineeInfoCard: {
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
  traineeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traineePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  traineeDetails: {
    flex: 1,
  },
  traineeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  traineeId: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  documentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  documentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  requiredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  documentDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  documentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  documentDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  viewDocumentText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default TraineeDocumentsScreen;

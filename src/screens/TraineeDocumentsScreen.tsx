import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, ImagePickerAsset } from 'react-native-image-picker';
import AuthService from '../services/AuthService';
import { usePermissions } from '../hooks/usePermissions';
import {
  DocumentWithStatus,
  TraineeDocument,
  TraineeDocumentsResponse,
} from '../types/student';

type TraineeRouteParams = {
  trainee: {
    id: number;
    nameAr: string;
  };
};

type PhotoViewerState = {
  uri: string;
  title: string;
} | null;

const TraineeDocumentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { trainee } = (route.params || {}) as TraineeRouteParams;
  const { canEdit } = usePermissions();

  const [documentsData, setDocumentsData] = useState<TraineeDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [photoViewer, setPhotoViewer] = useState<PhotoViewerState>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const canUploadDocuments = canEdit('dashboard.trainee-documents');

  useEffect(() => {
    fetchDocuments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadBaseUrl = async () => {
      try {
        const baseUrl = await AuthService.getCurrentApiBaseUrl();
        setApiBaseUrl(baseUrl || '');
      } catch {
        setApiBaseUrl('');
      }
    };

    loadBaseUrl();
  }, []);

  const resolveDocumentUrl = (filePath?: string | null): string => {
    if (!filePath) {
      return '';
    }

    const normalizedPath = String(filePath).replace(/\\/g, '/').trim();
    if (!normalizedPath) {
      return '';
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const base = (apiBaseUrl || '').replace(/\/+$/, '');
    if (!base) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/uploads/')) {
      return `${base}${normalizedPath}`;
    }

    if (normalizedPath.startsWith('uploads/')) {
      return `${base}/${normalizedPath}`;
    }

    if (normalizedPath.startsWith('/')) {
      return `${base}${normalizedPath}`;
    }

    return `${base}/uploads/${normalizedPath}`;
  };

  const isImageDocument = (document: TraineeDocument): boolean => {
    const mime = (document.mimeType || '').toLowerCase();
    const fileName = (document.fileName || '').toLowerCase();

    if (mime.startsWith('image/')) {
      return true;
    }

    return /\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)$/i.test(fileName);
  };

  const isPdfDocument = (document: TraineeDocument): boolean => {
    const mime = (document.mimeType || '').toLowerCase();
    const fileName = (document.fileName || '').toLowerCase();

    return mime.includes('pdf') || fileName.endsWith('.pdf');
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getTraineeDocuments(trainee.id);
      setDocumentsData(response);
    } catch (error: any) {
      Alert.alert('خطأ في جلب البيانات', error?.message || 'حدث خطأ غير متوقع أثناء جلب وثائق المتدرب');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const formatFileSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 بايت';
    }

    if (bytes < 1024) {
      return `${bytes} بايت`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) {
      return 'غير متاح';
    }

    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeMeta = (type: string) => {
    switch (type) {
      case 'PERSONAL_PHOTO':
      case 'PHOTO':
        return { icon: 'photo-camera', color: '#9333ea' };
      case 'ID_CARD_FRONT':
      case 'ID_CARD_BACK':
      case 'NATIONAL_ID':
        return { icon: 'badge', color: '#2563eb' };
      case 'QUALIFICATION_FRONT':
      case 'QUALIFICATION_BACK':
      case 'EDUCATION_CERTIFICATE':
        return { icon: 'school', color: '#059669' };
      case 'EXPERIENCE_CERT':
      case 'MINISTRY_CERT':
      case 'SKILL_CERT':
      case 'PROFESSION_CARD':
      case 'PASSPORT':
      case 'CONTRACT':
      case 'MEDICAL_CERTIFICATE':
      case 'BIRTH_CERTIFICATE':
        return { icon: 'description', color: '#d97706' };
      default:
        return { icon: 'insert-drive-file', color: '#64748b' };
    }
  };

  const openPhotoViewer = (uri: string, title: string) => {
    if (!uri) {
      Alert.alert('تنبيه', 'الرابط غير متاح لعرض الصورة');
      return;
    }

    setPhotoViewer({ uri, title });
  };

  const handleViewDocument = async (doc: DocumentWithStatus) => {
    if (!doc.document) {
      return;
    }

    const resolvedUrl = resolveDocumentUrl(doc.document.filePath);

    if (!resolvedUrl) {
      Alert.alert('خطأ', 'تعذر تحديد رابط الملف');
      return;
    }

    try {
      if (isImageDocument(doc.document)) {
        openPhotoViewer(resolvedUrl, doc.nameAr || doc.document.fileName || 'صورة الوثيقة');
        return;
      }

      if (isPdfDocument(doc.document)) {
        navigation.navigate('PdfViewer', {
          url: resolvedUrl,
          title: doc.nameAr || doc.document.fileName || 'عرض PDF',
        });
        return;
      }

      const canOpen = await Linking.canOpenURL(resolvedUrl);
      if (!canOpen) {
        Alert.alert('خطأ', 'لا يمكن فتح هذا الملف على الجهاز');
        return;
      }

      await Linking.openURL(resolvedUrl);
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء فتح الملف');
    }
  };

  const normalizeImageAsset = (asset: ImagePickerAsset, docType: string) => {
    const uri = asset.uri;
    if (!uri) {
      throw new Error('تعذر قراءة مسار الصورة المحددة');
    }

    const inferredType = asset.type || 'image/jpeg';
    if (!inferredType.startsWith('image/')) {
      throw new Error('يرجى اختيار صورة فقط');
    }

    const extFromMime = inferredType.split('/')[1] || 'jpg';
    const fileName =
      asset.fileName || `${String(docType).toLowerCase()}_${Date.now()}.${extFromMime}`;

    return {
      uri,
      type: inferredType,
      fileName,
      fileSize: asset.fileSize || 0,
    };
  };

  const uploadDocumentAsset = async (doc: DocumentWithStatus, asset?: ImagePickerAsset) => {
    if (!asset) {
      return;
    }

    try {
      const normalized = normalizeImageAsset(asset, String(doc.type));
      setUploadingType(String(doc.type));

      const uploadResult = await AuthService.uploadFile(
        {
          uri: normalized.uri,
          name: normalized.fileName,
          type: normalized.type,
        },
        'documents',
      );

      await AuthService.uploadTraineeDocument(trainee.id, {
        documentType: doc.type,
        fileName: normalized.fileName,
        filePath: uploadResult.url,
        fileSize: normalized.fileSize,
        mimeType: normalized.type,
      });

      Alert.alert('تم بنجاح', 'تم رفع الوثيقة بنجاح');
      await fetchDocuments();
    } catch (error: any) {
      Alert.alert('خطأ في الرفع', error?.message || 'تعذر رفع الوثيقة');
    } finally {
      setUploadingType(null);
    }
  };

  const pickFromCamera = async (doc: DocumentWithStatus) => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.85,
      saveToPhotos: false,
      includeBase64: false,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      throw new Error(result.errorMessage || 'تعذر فتح الكاميرا');
    }

    await uploadDocumentAsset(doc, result.assets?.[0]);
  };

  const pickFromLibrary = async (doc: DocumentWithStatus) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.85,
      includeBase64: false,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      throw new Error(result.errorMessage || 'تعذر فتح معرض الصور');
    }

    await uploadDocumentAsset(doc, result.assets?.[0]);
  };

  const handleUploadDocument = (doc: DocumentWithStatus) => {
    if (!canUploadDocuments) {
      Alert.alert('غير مسموح', 'لا تمتلك صلاحية رفع وثائق المتدربين');
      return;
    }

    if (uploadingType) {
      return;
    }

    Alert.alert('رفع الوثيقة', 'اختر مصدر الصورة', [
      {
        text: 'التقاط بالكاميرا',
        onPress: async () => {
          try {
            await pickFromCamera(doc);
          } catch (error: any) {
            Alert.alert('خطأ', error?.message || 'تعذر التقاط الصورة');
          }
        },
      },
      {
        text: 'اختيار من المعرض',
        onPress: async () => {
          try {
            await pickFromLibrary(doc);
          } catch (error: any) {
            Alert.alert('خطأ', error?.message || 'تعذر اختيار الصورة');
          }
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const stats = documentsData?.stats;

  const completionColor = useMemo(() => {
    if (!stats) {
      return '#f59e0b';
    }

    if (stats.completionPercentage >= 100) {
      return '#16a34a';
    }

    if (stats.completionPercentage >= 60) {
      return '#f59e0b';
    }

    return '#ef4444';
  }, [stats]);

  const traineePhotoUrl = useMemo(() => {
    if (!documentsData?.trainee?.photoUrl) {
      return '';
    }

    return resolveDocumentUrl(documentsData.trainee.photoUrl);
  }, [documentsData?.trainee?.photoUrl, apiBaseUrl]);

  const renderStatsCard = () => {
    if (!stats) {
      return null;
    }

    return (
      <View style={styles.statsCard}>
        <View style={styles.cardHeadRow}>
          <Text style={styles.cardTitle}>ملخص الوثائق</Text>
          <View style={styles.cardHeadBadge}>
            <Icon name="analytics" size={14} color="#1d4ed8" />
            <Text style={styles.cardHeadBadgeText}>تحديث مباشر</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalRequired}</Text>
            <Text style={styles.statLabel}>مطلوب</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.uploadedRequired}</Text>
            <Text style={styles.statLabel}>مرفوع</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.verifiedCount}</Text>
            <Text style={styles.statLabel}>محقق</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: completionColor }]}>{stats.completionPercentage}%</Text>
            <Text style={styles.statLabel}>الإكمال</Text>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(0, Math.min(100, stats.completionPercentage))}%`,
                  backgroundColor: completionColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.isComplete ? 'جميع الوثائق المطلوبة مكتملة' : 'لا يزال هناك وثائق مطلوبة غير مكتملة'}
          </Text>
        </View>
      </View>
    );
  };

  const renderDocumentCard = (doc: DocumentWithStatus) => {
    const meta = getDocumentTypeMeta(String(doc.type));
    const documentUrl = doc.document ? resolveDocumentUrl(doc.document.filePath) : '';
    const isUploadingThisType = uploadingType === String(doc.type);

    return (
      <View key={`${doc.type}-${doc.nameAr}`} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={[styles.documentIconWrap, { backgroundColor: `${meta.color}20` }]}>
            <Icon name={meta.icon} size={20} color={meta.color} />
          </View>

          <View style={styles.documentHeaderContent}>
            <Text style={styles.documentName}>{doc.nameAr}</Text>
            <View style={styles.documentBadgesRow}>
              {doc.required ? (
                <View style={[styles.badge, styles.requiredBadge]}>
                  <Text style={styles.requiredBadgeText}>مطلوب</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.optionalBadge]}>
                  <Text style={styles.optionalBadgeText}>اختياري</Text>
                </View>
              )}

              {doc.isUploaded ? (
                <View style={[styles.badge, doc.isVerified ? styles.verifiedBadge : styles.uploadedBadge]}>
                  <Text style={doc.isVerified ? styles.verifiedBadgeText : styles.uploadedBadgeText}>
                    {doc.isVerified ? 'محقق' : 'مرفوع'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.missingBadge]}>
                  <Text style={styles.missingBadgeText}>غير مرفوع</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {doc.isUploaded && doc.document ? (
          <View style={styles.documentDetailsSection}>
            {isImageDocument(doc.document) && documentUrl ? (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.imagePreviewWrap}
                onPress={() => openPhotoViewer(documentUrl, doc.nameAr)}
              >
                <Image source={{ uri: documentUrl }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imagePreviewOverlay}>
                  <Icon name="zoom-in" size={20} color="#ffffff" />
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.documentDetailRow}>
              <Icon name="insert-drive-file" size={15} color="#64748b" />
              <Text style={styles.documentDetailText}>{doc.document.fileName}</Text>
            </View>

            <View style={styles.documentDetailRow}>
              <Icon name="storage" size={15} color="#64748b" />
              <Text style={styles.documentDetailText}>{formatFileSize(doc.document.fileSize)}</Text>
            </View>

            <View style={styles.documentDetailRow}>
              <Icon name="schedule" size={15} color="#64748b" />
              <Text style={styles.documentDetailText}>{formatDate(doc.document.uploadedAt)}</Text>
            </View>

            <View style={styles.documentDetailRow}>
              <Icon name="person" size={15} color="#64748b" />
              <Text style={styles.documentDetailText}>رفع بواسطة: {doc.document.uploadedBy?.name || 'غير محدد'}</Text>
            </View>

            {doc.document.notes ? (
              <View style={styles.notesContainer}>
                <Icon name="note" size={15} color="#64748b" />
                <Text style={styles.notesText}>{doc.document.notes}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.viewButton} onPress={() => handleViewDocument(doc)}>
              <Icon
                name={isPdfDocument(doc.document) ? 'picture-as-pdf' : isImageDocument(doc.document) ? 'photo' : 'open-in-new'}
                size={18}
                color="#ffffff"
              />
              <Text style={styles.viewButtonText}>
                {isPdfDocument(doc.document)
                  ? 'عرض داخل التطبيق'
                  : isImageDocument(doc.document)
                    ? 'عرض الصورة'
                    : 'فتح الملف'}
              </Text>
            </TouchableOpacity>

            {canUploadDocuments ? (
              <TouchableOpacity
                style={[styles.uploadButton, styles.replaceButton, uploadingType ? styles.disabledActionButton : null]}
                onPress={() => handleUploadDocument(doc)}
                disabled={Boolean(uploadingType)}
              >
                {isUploadingThisType ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="upload-file" size={18} color="#ffffff" />
                )}
                <Text style={styles.uploadButtonText}>{isUploadingThisType ? 'جاري الرفع...' : 'استبدال الوثيقة'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.missingContainer}>
            <Icon name="cloud-off" size={18} color="#ef4444" />
            <Text style={styles.missingText}>هذه الوثيقة غير مرفوعة حتى الآن</Text>

            {canUploadDocuments ? (
              <TouchableOpacity
                style={[styles.uploadButton, uploadingType ? styles.disabledActionButton : null]}
                onPress={() => handleUploadDocument(doc)}
                disabled={Boolean(uploadingType)}
              >
                {isUploadingThisType ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Icon name="upload-file" size={18} color="#ffffff" />
                )}
                <Text style={styles.uploadButtonText}>
                  {isUploadingThisType ? 'جاري الرفع...' : 'رفع الوثيقة'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.centeredText}>جاري تحميل أرشيف المتدرب...</Text>
      </View>
    );
  }

  if (!documentsData) {
    return (
      <View style={styles.centeredContainer}>
        <Icon name="error-outline" size={62} color="#ef4444" />
        <Text style={styles.centeredErrorText}>تعذر تحميل بيانات الأرشيف</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDocuments}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#1e3a8a" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>أرشيف المتدرب</Text>
          <Text style={styles.headerSubtitle}>{trainee?.nameAr || documentsData.trainee?.nameAr || ''}</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.traineeCard}>
          <TouchableOpacity
            activeOpacity={traineePhotoUrl ? 0.85 : 1}
            style={styles.traineePhotoWrap}
            onPress={() => {
              if (traineePhotoUrl) {
                openPhotoViewer(traineePhotoUrl, documentsData.trainee.nameAr || 'الصورة الشخصية');
              }
            }}
            disabled={!traineePhotoUrl}
          >
            {traineePhotoUrl ? (
              <Image source={{ uri: traineePhotoUrl }} style={styles.traineePhoto} resizeMode="cover" />
            ) : (
              <View style={styles.traineePhotoFallback}>
                <Icon name="person" size={30} color="#94a3b8" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.traineeInfoTextWrap}>
            <Text style={styles.traineeName}>{documentsData.trainee.nameAr}</Text>
            <Text style={styles.traineeMeta}>رقم المتدرب: {documentsData.trainee.id}</Text>
            <Text style={styles.traineeMeta}>آخر تحديث: {formatDate(documentsData.trainee.updatedAt)}</Text>
          </View>
        </View>

        {renderStatsCard()}

        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>الوثائق ({documentsData.documents.length})</Text>
          {documentsData.documents.map(renderDocumentCard)}
        </View>
      </ScrollView>

      <Modal visible={Boolean(photoViewer)} transparent animationType="fade" onRequestClose={() => setPhotoViewer(null)}>
        <View style={styles.photoOverlay}>
          <TouchableOpacity style={styles.photoBackdrop} onPress={() => setPhotoViewer(null)} />

          <View style={styles.photoCard}>
            {photoViewer?.uri ? (
              <Image source={{ uri: photoViewer.uri }} style={styles.photoLarge} resizeMode="contain" />
            ) : null}

            <Text style={styles.photoTitle}>{photoViewer?.title || 'معاينة الصورة'}</Text>

            <TouchableOpacity style={styles.photoCloseButton} onPress={() => setPhotoViewer(null)}>
              <Text style={styles.photoCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  centeredText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  centeredErrorText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#b91c1c',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  traineeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  traineePhotoWrap: {
    marginRight: 12,
  },
  traineePhoto: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#e2e8f0',
  },
  traineePhotoFallback: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traineeInfoTextWrap: {
    flex: 1,
  },
  traineeName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
  traineeMeta: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
    textAlign: 'right',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardHeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardHeadBadgeText: {
    marginLeft: 4,
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  progressWrap: {
    marginTop: 2,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    marginTop: 7,
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    fontWeight: '600',
  },
  documentsSection: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'right',
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  documentHeaderContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
  },
  documentBadgesRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  requiredBadge: {
    backgroundColor: '#fef3c7',
  },
  requiredBadgeText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },
  optionalBadge: {
    backgroundColor: '#e2e8f0',
  },
  optionalBadgeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
  },
  verifiedBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadedBadge: {
    backgroundColor: '#dbeafe',
  },
  uploadedBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
  },
  missingBadge: {
    backgroundColor: '#fee2e2',
  },
  missingBadgeText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  documentDetailsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  imagePreviewWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 170,
    backgroundColor: '#e2e8f0',
  },
  imagePreviewOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  documentDetailText: {
    marginLeft: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesContainer: {
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesText: {
    marginLeft: 6,
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    textAlign: 'right',
  },
  viewButton: {
    marginTop: 3,
    backgroundColor: '#1e3a8a',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadButton: {
    marginTop: 8,
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceButton: {
    backgroundColor: '#0f766e',
  },
  uploadButtonText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  missingContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  missingText: {
    marginLeft: 6,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  photoBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  photoCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
  },
  photoLarge: {
    width: '100%',
    height: 420,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  photoTitle: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  photoCloseButton: {
    marginTop: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  photoCloseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default TraineeDocumentsScreen;

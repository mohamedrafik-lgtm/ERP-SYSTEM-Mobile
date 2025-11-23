import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import { PaymentSchedule, TraineeFee } from '../types/paymentSchedules';

interface PaymentScheduleDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      program: {
        id: number;
        nameAr: string;
        nameEn: string;
        price: number;
      };
    };
  };
}

const PaymentScheduleDetailsScreen = ({ navigation, route }: PaymentScheduleDetailsScreenProps) => {
  const { program } = route.params;
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [fees, setFees] = useState<TraineeFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [useStaticData, setUseStaticData] = useState(true); // استخدام بيانات static مؤقتاً

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // جرب الـ API أولاً
      let apiSuccess = false;
      try {
        await Promise.all([fetchSchedules(), fetchFees()]);
        
        // تحقق إذا كان في بيانات فعلاً
        if (fees.length > 0 || schedules.length > 0) {
          console.log('✅ API returned data successfully');
          apiSuccess = true;
          setUseStaticData(false);
        }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
      }
      
      // إذا فشل الـ API أو لم يرجع بيانات، استخدم static data
      if (!apiSuccess) {
        console.log('📦 Loading static data as fallback');
        loadStaticData();
      }
    } catch (error) {
      console.error('❌ General error:', error);
      loadStaticData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStaticData = () => {
    console.log('📦 Loading static data for program:', program.id);
    
    // بيانات رسوم static (حسب الموقع الإلكتروني)
    const staticFees: any[] = [
      {
        id: 1,
        name: 'القسط الأول مساعد خدمات صحية',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 2,
        name: 'القسط الثاني مساعد خدمات صحية',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 3,
        name: 'القسط الثالث مساعد خدمات صحية',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 4,
        name: 'القسط الرابع مساعد خدمات صحية',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 5,
        name: 'القسط الخامس مساعد خدمات صحية',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 6,
        name: 'كورس إدارة الوقت وتنمية بشرية',
        amount: 200,
        type: 'TRAINING',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 7,
        name: 'كورس جنرال إنجلش',
        amount: 200,
        type: 'TRAINING',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 8,
        name: 'كورس (نفسية - عمليات - حضانات -اسعافات )',
        amount: 600,
        type: 'TRAINING',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 9,
        name: 'مقدم مساعد خدمات صحية',
        amount: 2500,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 10,
        name: 'رسوم إضافية - مساعد خدمات صحية',
        amount: 500,
        type: 'ADDITIONAL',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 11,
        name: 'رسوم خدمات طلابية',
        amount: 300,
        type: 'SERVICES',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 12,
        name: 'القسط الثالث مساعد خدمات صحية',
        amount: 500,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 13,
        name: 'القسط الثاني المساحة والإنشاءات',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
      {
        id: 14,
        name: 'القسط الأول المساحة والإنشاءات',
        amount: 1000,
        type: 'TUITION',
        academicYear: '2025/2024',
        programId: program.id,
      },
    ];

    // بيانات مواعيد static - 12 موعد لكل الرسوم
    const staticSchedules: any[] = [
      // القسط الأول
      {
        id: 'schedule-1',
        feeId: 1,
        paymentStartDate: new Date('2025-09-25'),
        paymentEndDate: new Date('2025-11-25'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-11-30'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الثاني
      {
        id: 'schedule-2',
        feeId: 2,
        paymentStartDate: new Date('2025-01-01'),
        paymentEndDate: new Date('2025-11-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-11-06'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الثالث
      {
        id: 'schedule-3',
        feeId: 3,
        paymentStartDate: new Date('2025-11-01'),
        paymentEndDate: new Date('2025-12-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-12-06'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الرابع
      {
        id: 'schedule-4',
        feeId: 4,
        paymentStartDate: new Date('2025-12-01'),
        paymentEndDate: new Date('2026-01-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2026-01-06'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الخامس
      {
        id: 'schedule-5',
        feeId: 5,
        paymentStartDate: new Date('2025-11-01'),
        paymentEndDate: new Date('2025-11-10'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-11-15'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // كورس إدارة الوقت
      {
        id: 'schedule-6',
        feeId: 6,
        paymentStartDate: new Date('2025-09-01'),
        paymentEndDate: new Date('2025-09-30'),
        gracePeriodDays: 3,
        finalDeadline: new Date('2025-10-03'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية'],
        actionEnabled: true,
        notes: null,
      },
      // كورس جنرال إنجلش
      {
        id: 'schedule-7',
        feeId: 7,
        paymentStartDate: new Date('2025-09-01'),
        paymentEndDate: new Date('2025-09-30'),
        gracePeriodDays: 3,
        finalDeadline: new Date('2025-10-03'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية'],
        actionEnabled: true,
        notes: null,
      },
      // كورس نفسية/عمليات
      {
        id: 'schedule-8',
        feeId: 8,
        paymentStartDate: new Date('2025-09-15'),
        paymentEndDate: new Date('2025-10-15'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-10-20'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // مقدم
      {
        id: 'schedule-9',
        feeId: 9,
        paymentStartDate: new Date('2025-01-10'),
        paymentEndDate: new Date('2025-07-30'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-08-04'),
        nonPaymentActions: ['إيقاف المنصة الإلكترونية', 'إيقاف الحضور', 'إيقاف الاختبارات الإلكترونية', 'إيقاف الكل'],
        actionEnabled: true,
        notes: null,
      },
      // رسوم إضافية
      {
        id: 'schedule-10',
        feeId: 10,
        paymentStartDate: new Date('2025-09-01'),
        paymentEndDate: new Date('2025-10-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-10-06'),
        nonPaymentActions: ['إيقاف المنصة الإلكترونية'],
        actionEnabled: true,
        notes: null,
      },
      // رسوم خدمات طلابية
      {
        id: 'schedule-11',
        feeId: 11,
        paymentStartDate: new Date('2025-09-01'),
        paymentEndDate: new Date('2025-09-15'),
        gracePeriodDays: 3,
        finalDeadline: new Date('2025-09-18'),
        nonPaymentActions: ['إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // رسوم تدريب عملي
      {
        id: 'schedule-12',
        feeId: 12,
        paymentStartDate: new Date('2025-10-01'),
        paymentEndDate: new Date('2025-11-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-11-06'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الثاني المساحة
      {
        id: 'schedule-13',
        feeId: 13,
        paymentStartDate: new Date('2025-10-01'),
        paymentEndDate: new Date('2025-11-15'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-11-20'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
      // القسط الأول المساحة
      {
        id: 'schedule-14',
        feeId: 14,
        paymentStartDate: new Date('2025-09-01'),
        paymentEndDate: new Date('2025-10-01'),
        gracePeriodDays: 5,
        finalDeadline: new Date('2025-10-06'),
        nonPaymentActions: ['إيقاف الاختبارات الإلكترونية', 'إيقاف الحضور'],
        actionEnabled: true,
        notes: null,
      },
    ];

    console.log('\n📦 LOADING STATIC DATA:');
    console.log('═══════════════════════════════════════');
    console.log('Static Fees Count:', staticFees.length);
    console.log('Static Schedules Count:', staticSchedules.length);
    console.log('\nStatic Fees:', staticFees.map(f => ({ id: f.id, name: f.name })));
    console.log('\nStatic Schedules:', staticSchedules.map(s => ({ id: s.id, feeId: s.feeId })));
    console.log('═══════════════════════════════════════\n');
    
    setFees(staticFees);
    setSchedules(staticSchedules);
    setUseStaticData(true);
    
    console.log('✅ Static data loaded successfully');
    console.log('State updated - Fees:', staticFees.length, 'Schedules:', staticSchedules.length);
  };

  const fetchSchedules = async () => {
    try {
      console.log('🔍 Fetching payment schedules for program:', program.id);
      const data = await AuthService.getPaymentSchedules({ programId: program.id });
      console.log('✅ Payment schedules fetched:', data);
      console.log('✅ Number of schedules:', data?.length || 0);
      
      if (data && data.length > 0) {
        setSchedules(data);
        setUseStaticData(false);
      } else {
        throw new Error('No schedules data');
      }
    } catch (error) {
      console.error('❌ Error fetching schedules - will use static:', error);
      throw error; // إعادة رمي الخطأ ليتم معالجته في fetchData
    }
  };

  const fetchFees = async () => {
    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 FETCHING ALL TRAINEE FEES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const response = await AuthService.getAllTraineeFees();
      
      console.log('📦 RAW API RESPONSE:');
      console.log('═══════════════════════════════════════');
      console.log(JSON.stringify(response, null, 2));
      console.log('═══════════════════════════════════════\n');
      
      console.log('📊 RESPONSE ANALYSIS:');
      console.log('- Type:', typeof response);
      console.log('- Is Array:', Array.isArray(response));
      console.log('- Keys (if object):', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      
      // معالجة البيانات حسب الـ structure المختلف
      let allFees: any[] = [];
      
      if (Array.isArray(response)) {
        console.log('✅ Response is direct array');
        allFees = response;
      } else if (response && Array.isArray((response as any).data)) {
        console.log('✅ Response has .data array');
        allFees = (response as any).data;
      } else if (response && Array.isArray((response as any).fees)) {
        console.log('✅ Response has .fees array');
        allFees = (response as any).fees;
      } else {
        console.warn('⚠️ Unexpected response structure');
      }
      
      console.log('\n📋 PROCESSED FEES ARRAY:');
      console.log('═══════════════════════════════════════');
      console.log('Total fees count:', allFees.length);
      
      if (allFees.length === 0) {
        console.log('⚠️ No fees returned from API, will use static data');
        throw new Error('No fees returned from API');
      }
      
      console.log('\n📊 ALL FEES DETAILS:');
      console.log('═══════════════════════════════════════');
      allFees.forEach((fee, index) => {
        console.log(`\nFee #${index + 1}:`);
        console.log('  - ID:', fee.id);
        console.log('  - Name:', fee.name);
        console.log('  - Amount:', fee.amount);
        console.log('  - Type:', fee.type);
        console.log('  - Program ID:', fee.programId, `(${typeof fee.programId})`);
        console.log('  - Academic Year:', fee.academicYear);
        console.log('  - Safe ID:', fee.safeId);
        console.log('  - Is Applied:', fee.isApplied);
      });
      
      // عرض جميع programIds الموجودة
      const programIds = [...new Set(allFees.map((f: any) => f.programId))];
      console.log('\n🎯 PROGRAM IDS ANALYSIS:');
      console.log('═══════════════════════════════════════');
      console.log('Unique Program IDs:', programIds);
      console.log('Looking for Program ID:', program.id, `(${typeof program.id})`);
      console.log('Match found:', programIds.includes(program.id));
      
      // فلترة الرسوم
      console.log('\n🔍 FILTERING FEES:');
      console.log('═══════════════════════════════════════');
      const programFees = allFees.filter((fee: any) => {
        const feeProgId = Number(fee.programId);
        const targetProgId = Number(program.id);
        const matches = feeProgId === targetProgId;
        
        console.log(`Fee "${fee.name}": programId ${fee.programId} ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
        return matches;
      });
      
      console.log('\n✅ FILTERING RESULTS:');
      console.log('Filtered fees count:', programFees.length);
      
      // **عرض جميع الرسوم بغض النظر عن البرنامج**
      console.log('\n📢 FINAL DECISION: SHOWING ALL FEES (NOT FILTERED)');
      console.log('Reason: For debugging and testing purposes');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      setFees(allFees as any);
      setUseStaticData(false);
    } catch (error) {
      console.error('\n❌ ERROR FETCHING FEES:');
      console.error('═══════════════════════════════════════');
      console.error(error);
      console.log('\n⚠️ API failed - will throw error to trigger static data loading');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      // لا تضع أي fees هنا - دع fetchData يلاحظ الفشل
      throw error;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddSchedule = () => {
    navigation.navigate('AddPaymentSchedule', {
      program: program,
      fees: fees,
    });
  };

  const getScheduleForFee = (feeId: number): PaymentSchedule | undefined => {
    return schedules.find(s => s.feeId === feeId);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      TUITION: 'رسوم دراسية',
      SERVICES: 'رسوم خدمات',
      TRAINING: 'رسوم تدريب',
      ADDITIONAL: 'رسوم إضافية',
    };
    return types[type] || type;
  };

  const renderFeeCard = (fee: TraineeFee) => {
    const schedule = getScheduleForFee(fee.id);
    const hasSchedule = !!schedule;

    return (
      <View key={fee.id} style={styles.feeCard}>
        <View style={styles.feeHeader}>
          <Text style={styles.feeName}>{fee.name}</Text>
          <Text style={styles.feeAmount}>{formatPrice(fee.amount)}</Text>
        </View>

        <View style={styles.feeInfo}>
          <Text style={styles.feeType}>{getFeeTypeLabel(fee.type)}</Text>
          <Text style={styles.feeYear}>العام الدراسي: {fee.academicYear}</Text>
        </View>

        {hasSchedule && schedule ? (
          <View style={styles.scheduleInfo}>
            <View style={styles.dateRow}>
              <Icon name="event" size={16} color="#1a237e" />
              <Text style={styles.dateLabel}>بداية:</Text>
              <Text style={styles.dateValue}>{formatDate(schedule.paymentStartDate)}</Text>
            </View>

            <View style={styles.dateRow}>
              <Icon name="event-busy" size={16} color="#dc2626" />
              <Text style={styles.dateLabel}>نهاية:</Text>
              <Text style={styles.dateValue}>{formatDate(schedule.paymentEndDate)}</Text>
            </View>

            <View style={styles.dateRow}>
              <Icon name="access-time" size={16} color="#f59e0b" />
              <Text style={styles.dateLabel}>فترة السماح:</Text>
              <Text style={styles.dateValue}>{schedule.gracePeriodDays} يوم</Text>
            </View>

            <View style={styles.dateRow}>
              <Icon name="error-outline" size={16} color="#7c3aed" />
              <Text style={styles.dateLabel}>الموعد النهائي:</Text>
              <Text style={styles.dateValue}>{formatDate(schedule.finalDeadline)}</Text>
            </View>

            {schedule.actionEnabled && schedule.nonPaymentActions && (
              <View style={styles.actionsContainer}>
                <Text style={styles.actionsTitle}>الإجراءات:</Text>
                <View style={styles.actionsList}>
                  {(Array.isArray(schedule.nonPaymentActions) 
                    ? schedule.nonPaymentActions 
                    : JSON.parse(schedule.nonPaymentActions as any)).map((action: string, index: number) => (
                    <View key={index} style={styles.actionTag}>
                      <Icon name="warning" size={12} color="#dc2626" />
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editButton}>
                <Icon name="edit" size={18} color="#1a237e" />
                <Text style={styles.editButtonText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton}>
                <Icon name="delete" size={18} color="#dc2626" />
                <Text style={styles.deleteButtonText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noSchedule}>
            <Icon name="event-available" size={48} color="#d1d5db" />
            <Text style={styles.noScheduleText}>لم يتم تحديد موعد سداد</Text>
            <TouchableOpacity style={styles.addScheduleButton} onPress={handleAddSchedule}>
              <Icon name="add" size={20} color="#1a237e" />
              <Text style={styles.addScheduleButtonText}>إضافة موعد</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="PaymentSchedules" />
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1a237e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>مواعيد سداد الرسوم</Text>
            <Text style={styles.headerSubtitle}>
              إدارة مواعيد سداد الرسوم والإجراءات عند عدم السداد
            </Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Program Info */}
        <View style={styles.programInfo}>
          <View style={styles.programHeader}>
            <View>
              <Text style={styles.programName}>{program.nameAr}</Text>
              <Text style={styles.programNameEn}>{program.nameEn}</Text>
            </View>
            <TouchableOpacity
              style={styles.backToProgramsButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="close" size={20} color="#1a237e" />
              <Text style={styles.backToProgramsText}>العودة للبرامج</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>عدد الرسوم:</Text>
              <Text style={styles.statValue}>{fees.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>مواعيد محددة:</Text>
              <Text style={styles.statValue}>{schedules.length}</Text>
            </View>
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            {useStaticData ? '📦 وضع البيانات التجريبية' : '🌐 متصل بالخادم'}
          </Text>
          <Text style={styles.debugText}>
            📊 الرسوم: {fees.length} | المواعيد: {schedules.length} | البرنامج: {program.id}
          </Text>
        </View>

        {/* Add Schedule Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>إضافة موعد سداد</Text>
        </TouchableOpacity>

        {/* Fees List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a237e" />
            <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
          </View>
        ) : fees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="receipt" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>لا توجد رسوم دراسية</Text>
            <Text style={styles.emptySubtitle}>
              لم يتم العثور على رسوم دراسية لهذا البرنامج
            </Text>
          </View>
        ) : (
          <View style={styles.feesList}>
            {fees.map(fee => renderFeeCard(fee))}
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
    backgroundColor: '#f8fafc',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#1a237e',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  programInfo: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  programName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'right',
    marginBottom: 4,
  },
  programNameEn: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  backToProgramsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  backToProgramsText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#93c5fd',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  feesList: {
    gap: 16,
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    flex: 1,
    textAlign: 'right',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  feeType: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  feeYear: {
    fontSize: 12,
    color: '#64748b',
  },
  scheduleInfo: {
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'right',
  },
  actionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  noSchedule: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noScheduleText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a237e',
    gap: 6,
  },
  addScheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  debugInfo: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#78350f',
    textAlign: 'center',
  },
});

export default PaymentScheduleDetailsScreen;
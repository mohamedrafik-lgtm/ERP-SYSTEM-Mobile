import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomMenu from '../components/CustomMenu';
import AuthService from '../services/AuthService';
import BranchService from '../services/BranchService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalStudents: 0,
    totalFees: 0,
    totalSafes: 0,
    activeStudents: 0,
    appliedFees: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const statsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const actionsAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    fetchStats();
    fetchBranchInfo();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Welcome section animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Stats cards staggered animation
    setTimeout(() => {
      statsAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true,
        }).start();
      });
    }, 500);

    // Action buttons staggered animation
    setTimeout(() => {
      actionsAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });
    }, 1000);
  };

  const fetchBranchInfo = async () => {
    try {
      const branch = await BranchService.getSelectedBranch();
      if (branch) {
        setBranchName(branch.name);
      }
    } catch (error) {
      console.error('Error fetching branch info:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // جلب البرامج
      const programs = await AuthService.getAllPrograms().catch(() => []);
      
      // جلب الطلاب مع pagination
      const studentsResponse = await AuthService.getTrainees({ 
        page: 1, 
        limit: 1, 
        includeDetails: false 
      }).catch(() => ({ data: [], pagination: { total: 0 } }));
      
      // جلب الرسوم
      const fees = await AuthService.getAllTraineeFees().catch(() => []);
      
      // جلب الخزائن
      const safes = await AuthService.getAllSafes().catch(() => []);

      // حساب الطلاب النشطين
      const activeStudentsResponse = await AuthService.getTrainees({ 
        page: 1, 
        limit: 1, 
        includeDetails: false,
        status: 'ACTIVE'
      }).catch(() => ({ data: [], pagination: { total: 0 } }));

      // حساب الرسوم المطبقة
      const appliedFees = fees.filter(fee => fee.isApplied).length;

      // حساب إجمالي الرصيد من الخزائن
      const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0);

      setStats({
        totalPrograms: programs.length,
        totalStudents: studentsResponse.pagination?.total || studentsResponse.data?.length || 0,
        totalFees: fees.length,
        totalSafes: safes.length,
        activeStudents: activeStudentsResponse.pagination?.total || activeStudentsResponse.data?.length || 0,
        appliedFees: appliedFees,
        totalBalance: totalBalance,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomMenu navigation={navigation} activeRouteName="Home" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>الرئيسية</Text>
          {branchName ? (
            <Text style={styles.branchIndicator}>{branchName}</Text>
          ) : null}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Animated.View 
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Animated.Image
            source={require('../../img/502585454_122235753458244801_413190920156398012_n-removebg-preview.png')}
            style={[
              styles.logo,
              {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
            resizeMode="contain"
          />
          <Animated.Text 
            style={[
              styles.greeting,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {getCurrentTime()}
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.title,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            مرحباً بك في النظام الإداري
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.subtitle,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            مركز طيبة للتدريب
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.date,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {getCurrentDate()}
          </Animated.Text>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>إحصائيات سريعة</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1a237e" />
              <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <Animated.View 
                style={[
                  styles.statCard, 
                  styles.statCardPrimary,
                  {
                    opacity: statsAnimations[0],
                    transform: [{
                      translateY: statsAnimations[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }, {
                      scale: statsAnimations[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Icon name="book" size={28} color="#1a237e" />
                </View>
                <Text style={styles.statNumber}>{stats.totalPrograms}</Text>
                <Text style={styles.statLabel}>البرامج التدريبية</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.statCard, 
                  styles.statCardSuccess,
                  {
                    opacity: statsAnimations[1],
                    transform: [{
                      translateY: statsAnimations[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }, {
                      scale: statsAnimations[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <Icon name="school" size={28} color="#059669" />
                </View>
                <Text style={styles.statNumber}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>إجمالي الطلاب</Text>
                <Text style={styles.statSubtext}>{stats.activeStudents} نشط</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.statCard, 
                  styles.statCardWarning,
                  {
                    opacity: statsAnimations[2],
                    transform: [{
                      translateY: statsAnimations[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }, {
                      scale: statsAnimations[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Icon name="account-balance-wallet" size={28} color="#d97706" />
                </View>
                <Text style={styles.statNumber}>{stats.totalFees}</Text>
                <Text style={styles.statLabel}>الرسوم المالية</Text>
                <Text style={styles.statSubtext}>{stats.appliedFees} مطبقة</Text>
              </Animated.View>

              <Animated.View 
                style={[
                  styles.statCard, 
                  styles.statCardPurple,
                  {
                    opacity: statsAnimations[3],
                    transform: [{
                      translateY: statsAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }, {
                      scale: statsAnimations[3].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: '#ede9fe' }]}>
                  <Icon name="account-balance" size={28} color="#7c3aed" />
                </View>
                <Text style={styles.statNumber}>{stats.totalSafes}</Text>
                <Text style={styles.statLabel}>الخزائن المالية</Text>
                <Text style={styles.statSubtext}>{stats.totalBalance.toLocaleString()} ج.م</Text>
              </Animated.View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>الوصول السريع</Text>
          <View style={styles.quickActions}>
            <Animated.View
              style={{
                opacity: actionsAnimations[0],
                transform: [{
                  translateX: actionsAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }, {
                  scale: actionsAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => navigation.navigate('StudentsList')}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="school" size={32} color="#fff" />
                </View>
                <Text style={styles.actionText}>الطلاب</Text>
                <Text style={styles.actionSubtext}>إدارة الطلاب</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              style={{
                opacity: actionsAnimations[1],
                transform: [{
                  translateX: actionsAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }, {
                  scale: actionsAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonSuccess]}
                onPress={() => navigation.navigate('Programs')}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="book" size={32} color="#fff" />
                </View>
                <Text style={styles.actionText}>البرامج</Text>
                <Text style={styles.actionSubtext}>البرامج التدريبية</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              style={{
                opacity: actionsAnimations[2],
                transform: [{
                  translateX: actionsAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }, {
                  scale: actionsAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => navigation.navigate('Treasury')}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="account-balance" size={32} color="#fff" />
                </View>
                <Text style={styles.actionText}>الخزائن</Text>
                <Text style={styles.actionSubtext}>إدارة الخزائن</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              style={{
                opacity: actionsAnimations[3],
                transform: [{
                  translateX: actionsAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }, {
                  scale: actionsAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }}
            >
              <TouchableOpacity 
                style={[styles.actionButton, styles.actionButtonPurple]}
                onPress={() => navigation.navigate('Fees')}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Icon name="account-balance-wallet" size={32} color="#fff" />
                </View>
                <Text style={styles.actionText}>الرسوم</Text>
                <Text style={styles.actionSubtext}>إدارة الرسوم</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Recent Activity */}
        <Animated.View 
          style={[
            styles.activitySection,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>النشاط الأخير</Text>
          <Animated.View 
            style={[
              styles.activityCard,
              {
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }]
              }
            ]}
          >
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="add" size={20} color="#1a237e" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>مرحباً بك في النظام</Text>
                <Text style={styles.activityDescription}>
                  تم تسجيل الدخول بنجاح إلى النظام الإداري لمركز طيبة للتدريب
                </Text>
                <Text style={styles.activityTime}>الآن</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* System Info */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0]
                })
              }]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.infoCard,
              {
                transform: [{
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }]
              }
            ]}
          >
            <Icon name="info" size={24} color="#1a237e" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>معلومات النظام</Text>
              <Text style={styles.infoText}>
                نظام إداري متكامل لإدارة مركز طيبة للتدريب
              </Text>
              <Text style={styles.infoVersion}>الإصدار 1.0.0</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

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
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    letterSpacing: 0.5,
  },
  branchIndicator: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 4,
    borderColor: '#f1f5f9',
  },
  greeting: {
    fontSize: 20,
    color: '#059669',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 20,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: (width - 64) / 2,
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    transform: [{ scale: 1 }],
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionsSection: {
    marginBottom: 28,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: (width - 64) / 2,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  actionSubtext: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitySection: {
    marginBottom: 28,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 4,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  activityDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    borderLeftColor: '#1a237e',
    shadowColor: '#1a237e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 10,
    fontWeight: '500',
  },
  infoVersion: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  // Action Button Variants
  actionButtonPrimary: {
    backgroundColor: '#1a237e',
    shadowColor: '#1a237e',
  },
  actionButtonSuccess: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  actionButtonDanger: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  actionButtonPurple: {
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
  },
  // Stat Card Variants
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
  },
  statCardPurple: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  // Action Icon Container
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});


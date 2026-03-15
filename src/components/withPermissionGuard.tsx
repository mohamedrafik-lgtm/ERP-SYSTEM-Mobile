import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PermissionGuard from './PermissionGuard';

/**
 * HOC لحماية الشاشات بالصلاحيات
 * يلف أي شاشة بـ PermissionGuard تلقائياً
 *
 * الاستخدام:
 * const ProtectedScreen = withPermissionGuard(MyScreen, 'ScreenName');
 */
function withPermissionGuard(
  WrappedComponent: React.ComponentType<any>,
  screenName: string,
): React.ComponentType<any> {
  const GuardedComponent = (props: any) => {
    const ResolvedComponent = (WrappedComponent as any)?.default || WrappedComponent;

    if (!ResolvedComponent || (typeof ResolvedComponent !== 'function' && typeof ResolvedComponent !== 'string')) {
      console.error(`[withPermissionGuard] Invalid component for screen "${screenName}"`, WrappedComponent);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>خطأ في تحميل الشاشة</Text>
          <Text style={styles.errorText}>تعذر عرض شاشة {screenName}</Text>
        </View>
      );
    }

    return (
      <PermissionGuard screenName={screenName}>
        <ResolvedComponent {...props} />
      </PermissionGuard>
    );
  };

  GuardedComponent.displayName = `WithPermissionGuard(${screenName})`;
  return GuardedComponent;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#b91c1c',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});

export default withPermissionGuard;

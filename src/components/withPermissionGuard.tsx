import React from 'react';
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
  const GuardedComponent = (props: any) => (
    <PermissionGuard screenName={screenName}>
      <WrappedComponent {...props} />
    </PermissionGuard>
  );

  GuardedComponent.displayName = `WithPermissionGuard(${screenName})`;
  return GuardedComponent;
}

export default withPermissionGuard;

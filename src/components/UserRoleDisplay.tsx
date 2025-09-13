import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AuthService from '../services/AuthService';
import { User, Role } from '../types/auth';

interface UserRoleDisplayProps {
  showRoles?: boolean;
  showPrimaryRoleOnly?: boolean;
  compact?: boolean;
}

const UserRoleDisplay: React.FC<UserRoleDisplayProps> = ({
  showRoles = true,
  showPrimaryRoleOnly = false,
  compact = false,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  const getRoleColor = (role: Role): string => {
    return role.color || '#1a237e';
  };

  const getRoleIcon = (role: Role): string => {
    return role.icon || 'person';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.userName}>{user.name}</Text>
        {user.primaryRole && (
          <View style={[styles.roleChip, { backgroundColor: getRoleColor(user.primaryRole) + '20' }]}>
            <Icon 
              name={getRoleIcon(user.primaryRole)} 
              size={14} 
              color={getRoleColor(user.primaryRole)} 
            />
            <Text style={[styles.roleText, { color: getRoleColor(user.primaryRole) }]}>
              {user.primaryRole.displayName}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {user.primaryRole && (
        <View style={styles.primaryRoleContainer}>
          <Text style={styles.primaryRoleLabel}>الدور الأساسي:</Text>
          <View style={[styles.roleChip, { backgroundColor: getRoleColor(user.primaryRole) + '20' }]}>
            <Icon 
              name={getRoleIcon(user.primaryRole)} 
              size={16} 
              color={getRoleColor(user.primaryRole)} 
            />
            <Text style={[styles.roleText, { color: getRoleColor(user.primaryRole) }]}>
              {user.primaryRole.displayName}
            </Text>
            <Text style={styles.rolePriority}>({user.primaryRole.priority})</Text>
          </View>
        </View>
      )}

      {showRoles && !showPrimaryRoleOnly && user.roles && user.roles.length > 0 && (
        <View style={styles.rolesContainer}>
          <Text style={styles.rolesLabel}>جميع الأدوار:</Text>
          <View style={styles.rolesGrid}>
            {user.roles.map((role) => (
              <View 
                key={role.id} 
                style={[styles.roleChip, { backgroundColor: getRoleColor(role) + '15' }]}
              >
                <Icon 
                  name={getRoleIcon(role)} 
                  size={14} 
                  color={getRoleColor(role)} 
                />
                <Text style={[styles.roleText, { color: getRoleColor(role) }]}>
                  {role.displayName}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfo: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  primaryRoleContainer: {
    marginBottom: 12,
  },
  primaryRoleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  rolesContainer: {
    marginTop: 8,
  },
  rolesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rolePriority: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 4,
  },
});

export default UserRoleDisplay;

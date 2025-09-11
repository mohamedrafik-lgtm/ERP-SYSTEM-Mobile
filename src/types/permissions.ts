export type RolesResponse = RoleWithRelations[];

export interface RoleWithRelations {
  id: string;
  name: string; // unique system name
  displayName: string; // human-friendly name
  description?: string;
  color?: string;
  icon?: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  rolePermissions: RolePermissionWithPermission[];
  _count: {
    userRoles: number;
  };
}

export interface RolePermissionWithPermission {
  roleId: string;
  permissionId: string;
  granted: boolean;
  conditions?: any;
  expiresAt?: string; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO

  permission: Permission;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  displayName: string;
  description?: string;
  category?: string;
  conditions?: any;
  isSystem: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface RoleByIdResponse {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  icon?: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions: Array<{
    roleId: string;
    permissionId: string;
    granted: boolean;
    conditions?: any;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    permission: Permission;
  }>;
  userRoles: Array<{
    userId: string;
    roleId: string;
    assignedBy?: string;
    assignedAt: string;
    expiresAt?: string;
    isActive: boolean;
    conditions?: any;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    userRoles: number;
  };
}



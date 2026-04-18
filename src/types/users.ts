export type AccountType = 'STAFF' | 'INSTRUCTOR';

export interface AllowedProgramItem {
  id: number;
  nameAr: string;
  nameEn: string;
}

export interface AllowedDistributionItem {
  id: string;
  programId: number;
  type: 'THEORY' | 'PRACTICAL';
  classroomId?: number | null;
  numberOfRooms: number;
}

export interface AllowedRoomItem {
  id: string;
  roomName: string;
  roomNumber: number;
  distributionId?: string;
  _count?: {
    assignments: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string; // /^[0-9+\-\s()]{10,15}$/
  password: string; // min 6
  roleId?: string;
  roleIds?: string[];
  accountType?: AccountType;
  hasCrmAccess?: boolean;
  allowedProgramIds?: number[];
  allowedDistributionIds?: string[];
  allowedRoomIds?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string; // same pattern
  password?: string; // optional change
  roleId?: string | null; // allow unassign
  isActive?: boolean;
  isArchived?: boolean;
  accountType?: AccountType;
  hasCrmAccess?: boolean;
  allowedProgramIds?: number[];
  allowedDistributionIds?: string[];
  allowedRoomIds?: string[];
}

export type UsersResponse = UserItem[];

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isArchived?: boolean;
  accountType?: AccountType;
  hasCrmAccess?: boolean;
  photoUrl?: string;
  allowedProgramIds?: number[];
  allowedDistributionIds?: string[];
  allowedRoomIds?: string[];
  allowedProgramsList?: AllowedProgramItem[];
  allowedDistributionsList?: AllowedDistributionItem[];
  allowedRoomsList?: AllowedRoomItem[];
  lastLoginAt?: string;
  resetCode?: string | null;
  resetCodeExpiresAt?: string | null;
  resetCodeGeneratedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles: Array<{
    userId: string;
    roleId: string;
    assignedBy?: string | null;
    assignedAt: string;
    expiresAt?: string | null;
    isActive: boolean;
    conditions?: any;
    role: {
      id: string;
      name: string;
      displayName: string;
      description?: string | null;
      color?: string | null;
      icon?: string | null;
      priority: number;
      isSystem: boolean;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }>;
  userPermissions: Array<{
    userId: string;
    permissionId: string;
    granted: boolean;
    assignedBy?: string | null;
    assignedAt: string;
    expiresAt?: string | null;
    conditions?: any;
    reason?: string | null;
    permission: {
      id: string;
      resource: string;
      action: string;
      displayName: string;
      description?: string | null;
      category?: string | null;
      conditions?: any;
      isSystem: boolean;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}



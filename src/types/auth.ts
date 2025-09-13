// Auth Types for Login Response and User Management

export interface Role {
  id: string;
  name: string;
  displayName: string;
  color?: string;
  icon?: string;
  priority: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  primaryRole: Role;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthData {
  token: string;
  user: User;
  expiresAt: number;
}

// Legacy interface for backward compatibility
export interface LegacyAuthData {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  expiresAt: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string; // /^[0-9+\-\s()]{10,15}$/
  password: string; // min 6
  roleId?: string;
}



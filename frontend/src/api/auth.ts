import http from './http';
import { ApiResponse, AuthResponse, User } from '../types';

interface LoginParams {
  username: string;
  password: string;
}

interface RegisterParams {
  username: string;
  password: string;
}

export const login = async (params: LoginParams): Promise<AuthResponse> => {
  const response = await http.post<ApiResponse<AuthResponse>>('/api/auth/login', params);
  return response.data.data as AuthResponse;
};

export const register = async (params: RegisterParams): Promise<AuthResponse> => {
  const response = await http.post<ApiResponse<AuthResponse>>('/api/auth/register', params);
  return response.data.data as AuthResponse;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await http.get<ApiResponse<User>>('/api/auth/me');
  return response.data.data as User;
};

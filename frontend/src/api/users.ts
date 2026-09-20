import { apiClient } from './client';
import { User, UserCreate } from '../types';

export const usersApi = {
  getSalesEmployees: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users/employees');
    return res.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },

  createUser: async (data: UserCreate): Promise<User> => {
    const res = await apiClient.post<User>('/users', data);
    return res.data;
  },

  updateUser: async (id: number, data: { full_name?: string; phone?: string; is_active?: boolean }): Promise<User> => {
    const res = await apiClient.patch<User>(`/users/${id}`, data);
    return res.data;
  },
};

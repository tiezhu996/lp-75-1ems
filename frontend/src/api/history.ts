import http from './http';
import { ApiResponse, RequestHistory } from '../types';

interface GetHistoryParams {
  search?: string;
  limit?: number;
}

export const getHistory = async (params?: GetHistoryParams): Promise<RequestHistory[]> => {
  const response = await http.get<ApiResponse<RequestHistory[]>>('/api/history', {
    params: params || {},
  });
  return response.data.data as RequestHistory[];
};

export const deleteHistory = async (id: string): Promise<void> => {
  await http.delete<ApiResponse<void>>(`/api/history/${id}`);
};

export const clearHistory = async (): Promise<void> => {
  await http.delete<ApiResponse<void>>('/api/history');
};

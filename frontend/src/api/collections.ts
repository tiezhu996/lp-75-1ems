import http from './http';
import { ApiResponse, Collection } from '../types';

interface CreateCollectionParams {
  name: string;
  description?: string;
}

interface UpdateCollectionParams {
  name?: string;
  description?: string;
}

export const getCollections = async (): Promise<Collection[]> => {
  const response = await http.get<ApiResponse<Collection[]>>('/api/collections');
  return response.data.data as Collection[];
};

export const createCollection = async (params: CreateCollectionParams): Promise<Collection> => {
  const response = await http.post<ApiResponse<Collection>>('/api/collections', params);
  return response.data.data as Collection;
};

export const updateCollection = async (
  id: string,
  params: UpdateCollectionParams
): Promise<Collection> => {
  const response = await http.put<ApiResponse<Collection>>(`/api/collections/${id}`, params);
  return response.data.data as Collection;
};

export const deleteCollection = async (id: string): Promise<void> => {
  await http.delete<ApiResponse<void>>(`/api/collections/${id}`);
};

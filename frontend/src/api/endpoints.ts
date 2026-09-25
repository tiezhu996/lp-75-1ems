import http from './http';
import { ApiResponse, ApiEndpoint, Header, HttpMethod } from '../types';

interface CreateEndpointParams {
  collectionId: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Header[];
  body?: string;
  description?: string;
}

interface UpdateEndpointParams {
  name?: string;
  method?: HttpMethod;
  url?: string;
  headers?: Header[];
  body?: string;
  description?: string;
}

export const getEndpoints = async (collectionId: string): Promise<ApiEndpoint[]> => {
  const response = await http.get<ApiResponse<ApiEndpoint[]>>('/api/endpoints', {
    params: { collectionId },
  });
  return response.data.data as ApiEndpoint[];
};

export const getEndpointById = async (id: string): Promise<ApiEndpoint> => {
  const response = await http.get<ApiResponse<ApiEndpoint>>(`/api/endpoints/${id}`);
  return response.data.data as ApiEndpoint;
};

export const createEndpoint = async (params: CreateEndpointParams): Promise<ApiEndpoint> => {
  const response = await http.post<ApiResponse<ApiEndpoint>>('/api/endpoints', params);
  return response.data.data as ApiEndpoint;
};

export const updateEndpoint = async (
  id: string,
  params: UpdateEndpointParams
): Promise<ApiEndpoint> => {
  const response = await http.put<ApiResponse<ApiEndpoint>>(`/api/endpoints/${id}`, params);
  return response.data.data as ApiEndpoint;
};

export const deleteEndpoint = async (id: string): Promise<void> => {
  await http.delete<ApiResponse<void>>(`/api/endpoints/${id}`);
};

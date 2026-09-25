import http from './http';
import { ApiResponse, Environment, EnvVariable } from '../types';

interface CreateEnvironmentParams {
  name: string;
  variables?: EnvVariable[];
}

interface UpdateEnvironmentParams {
  name?: string;
  variables?: EnvVariable[];
}

export const getEnvironments = async (): Promise<Environment[]> => {
  const response = await http.get<ApiResponse<Environment[]>>('/api/environments');
  return response.data.data as Environment[];
};

export const createEnvironment = async (
  params: CreateEnvironmentParams
): Promise<Environment> => {
  const response = await http.post<ApiResponse<Environment>>('/api/environments', params);
  return response.data.data as Environment;
};

export const updateEnvironment = async (
  id: string,
  params: UpdateEnvironmentParams
): Promise<Environment> => {
  const response = await http.put<ApiResponse<Environment>>(`/api/environments/${id}`, params);
  return response.data.data as Environment;
};

export const activateEnvironment = async (id: string): Promise<Environment> => {
  const response = await http.put<ApiResponse<Environment>>(`/api/environments/${id}/activate`);
  return response.data.data as Environment;
};

export const deleteEnvironment = async (id: string): Promise<void> => {
  await http.delete<ApiResponse<void>>(`/api/environments/${id}`);
};

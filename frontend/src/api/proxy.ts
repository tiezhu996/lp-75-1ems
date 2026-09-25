import http from './http';
import { ApiResponse, ProxyResponse, RequestConfig } from '../types';

export const sendRequest = async (config: RequestConfig): Promise<ProxyResponse> => {
  const response = await http.post<ApiResponse<ProxyResponse>>('/api/proxy', config);
  return response.data.data as ProxyResponse;
};

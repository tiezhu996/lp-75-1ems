import axios from 'axios';
import { message } from 'antd';
import { getToken, clearAuthData } from '../utils/auth';
import { ApiResponse } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
});

http.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    if (data.success) {
      return response;
    }
    if (data.message) {
      message.error(data.message);
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        clearAuthData();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('未授权访问，请重新登录'));
      }
      if (data && data.message) {
        message.error(data.message);
      } else if (status === 500) {
        message.error('服务器内部错误');
      } else if (status === 404) {
        message.error('接口不存在');
      } else {
        message.error(error.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时');
    } else {
      message.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default http;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getSimilar: (id) => api.get(`/courses/${id}/similar`),
  getFilterOptions: () => api.get('/courses/filters/options'),
};

export const syncAPI = {
  syncSource: (source, fullSync = false) => api.post(`/sync/${source}`, { fullSync }),
  getStatus: () => api.get('/sync/status'),
};

export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
};

export default api;


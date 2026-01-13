import axios from 'axios';
import type {
  User,
  Farrier,
  FarrierListItem,
  Horse,
  Booking,
  Review,
  RegisterFormData,
  HorseFormData,
  BookingFormData,
  FarrierSearchFilters,
  AdminStats,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 sekunder timeout
});

// Interceptor för att lägga till auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor för felhantering
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === Auth ===
export const authApi = {
  register: async (data: RegisterFormData): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  resetPassword: async (email: string, resetCode: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', {
      email,
      reset_code: resetCode,
      new_password: newPassword,
    });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },
};

// === Users ===
export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/profile');
  },
};

// === Farriers ===
export const farriersApi = {
  list: async (filters?: FarrierSearchFilters): Promise<FarrierListItem[]> => {
    const response = await api.get('/farriers/', { params: filters });
    return response.data;
  },

  get: async (id: number): Promise<Farrier> => {
    const response = await api.get(`/farriers/${id}`);
    return response.data;
  },

  updateProfile: async (data: Partial<Farrier>): Promise<Farrier> => {
    const response = await api.put('/farriers/profile', data);
    return response.data;
  },

  addService: async (data: { name: string; description?: string; price: number; duration_minutes?: number }) => {
    const response = await api.post('/farriers/services', data);
    return response.data;
  },

  updateService: async (id: number, data: { name: string; description?: string; price: number; duration_minutes?: number }) => {
    const response = await api.put(`/farriers/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: number): Promise<void> => {
    await api.delete(`/farriers/services/${id}`);
  },

  addSchedule: async (data: { day_of_week: number; start_time: string; end_time: string }) => {
    const response = await api.post('/farriers/schedules', data);
    return response.data;
  },

  updateSchedule: async (id: number, data: { day_of_week?: number; start_time?: string; end_time?: string; is_available?: boolean }) => {
    const response = await api.put(`/farriers/schedules/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (id: number): Promise<void> => {
    await api.delete(`/farriers/schedules/${id}`);
  },

  addArea: async (data: { city: string; postal_code_prefix?: string; travel_fee?: number }) => {
    const response = await api.post('/farriers/areas', data);
    return response.data;
  },

  deleteArea: async (id: number): Promise<void> => {
    await api.delete(`/farriers/areas/${id}`);
  },

  getAverageRating: async (): Promise<{ average_rating: number }> => {
    const response = await api.get('/farriers/stats/average-rating');
    return response.data;
  },
};

// === Horses ===
export const horsesApi = {
  list: async (): Promise<Horse[]> => {
    const response = await api.get('/horses/');
    return response.data;
  },

  get: async (id: number): Promise<Horse> => {
    const response = await api.get(`/horses/${id}`);
    return response.data;
  },

  create: async (data: HorseFormData): Promise<Horse> => {
    const response = await api.post('/horses/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<HorseFormData>): Promise<Horse> => {
    const response = await api.put(`/horses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/horses/${id}`);
  },
};

// === Bookings ===
export const bookingsApi = {
  list: async (status?: string): Promise<Booking[]> => {
    const response = await api.get('/bookings/', { params: { status_filter: status } });
    return response.data;
  },

  get: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (data: BookingFormData): Promise<Booking> => {
    const response = await api.post('/bookings/', data);
    return response.data;
  },

  updateStatus: async (id: number, status: string, notes?: string): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}/status`, { status, notes_from_farrier: notes });
    return response.data;
  },

  cancel: async (id: number, reason?: string): Promise<Booking> => {
    const response = await api.put(`/bookings/${id}/cancel`, null, {
      params: { cancellation_reason: reason },
    });
    return response.data;
  },
};

// === Reviews ===
export const reviewsApi = {
  listForFarrier: async (farrierId: number): Promise<Review[]> => {
    const response = await api.get(`/reviews/farrier/${farrierId}`);
    return response.data;
  },

  create: async (data: { booking_id: number; rating: number; title?: string; comment?: string; quality_rating?: number; punctuality_rating?: number; communication_rating?: number; price_rating?: number }): Promise<Review> => {
    const response = await api.post('/reviews/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Review>): Promise<Review> => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  respond: async (id: number, response_text: string): Promise<Review> => {
    const response = await api.post(`/reviews/${id}/respond`, { response: response_text });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/reviews/${id}`);
  },
};

// === Admin ===
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  listUsers: async (params?: { role?: string; is_active?: boolean; search?: string }): Promise<User[]> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  toggleUserActive: async (userId: number): Promise<void> => {
    await api.put(`/admin/users/${userId}/toggle-active`);
  },

  verifyUser: async (userId: number): Promise<void> => {
    await api.put(`/admin/users/${userId}/verify`);
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  listAllBookings: async (status?: string): Promise<Booking[]> => {
    const response = await api.get('/admin/bookings', { params: { status_filter: status } });
    return response.data;
  },

  listPendingFarriers: async () => {
    const response = await api.get('/admin/farriers/pending-verification');
    return response.data;
  },
};

export default api;


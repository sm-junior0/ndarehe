import axios from 'axios';

// API utility for consistent backend calls

const API_BASE_URL = 'https://ndarehe.onrender.com/api';
const LOCAL_PAYMENT_API_URL = 'https://ndarehe.onrender.com/api';

// const API_BASE_URL = 'http://localhost:5000/api';
// const LOCAL_PAYMENT_API_URL = 'http://localhost:5000/api'; 

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = 60000 // 30 second default timeout
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const token = getAuthToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
};

const localPaymentApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = 60000
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const token = getAuthToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    };

    const response = await fetch(`${LOCAL_PAYMENT_API_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string, signal?: AbortSignal) => {
  return apiRequest<ApiResponse<{ user: any; token: string }>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    signal, // Pass the signal through
  });
},

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    return apiRequest<ApiResponse<{ user: any; token: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Accept 401 responses as successful logout
      if (response.status === 401 || response.ok) {
        return { success: true };
      }

      throw new Error('Logout failed');
    } catch (error) {
      // Treat all errors as successful logout
      return { success: true };
    }
  },

 verifyEmail: async (token: string) => {
  return apiRequest<ApiResponse<any>>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
},

  resendVerification: async (email?: string) => {
    // If email is not provided, get it from the current user
    let targetEmail = email;

    if (!targetEmail) {
      try {
        const userResponse = await authApi.getCurrentUser();
        if (userResponse.success && userResponse.data.user) {
          targetEmail = userResponse.data.user.email;
        }
      } catch (error) {
        console.error('Failed to get current user email:', error);
      }
    }

    return apiRequest<ApiResponse<any>>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail }),
    });
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    return apiRequest<ApiResponse<{ user: any }>>('/auth/me');
  },
};

// User API calls
export const userApi = {
  getProfile: async () => {
    return apiRequest<ApiResponse<{ user: any }>>('/users/profile');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest<ApiResponse<{ user: any }>>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  // Notifications
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const qs = searchParams.toString();
    return apiRequest<ApiResponse<{ notifications: any[]; pagination: any }>>(
      `/users/notifications${qs ? `?${qs}` : ''}`
    );
  },
  getUnreadNotificationsCount: async () => {
    return apiRequest<ApiResponse<{ count: number }>>('/users/notifications/unread-count');
  },
  markNotificationRead: async (id: string) => {
    return apiRequest<ApiResponse<{ notification: any }>>(`/users/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
  markAllNotificationsRead: async () => {
    return apiRequest<ApiResponse<any>>('/users/notifications/read-all', {
      method: 'PUT',
    });
  },
};

// Accommodations API calls
export const accommodationsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/accommodations?${queryString}` : '/accommodations';

    return apiRequest<ApiResponse<{ accommodations: any[]; pagination: any }>>(endpoint);
  },

  getById: async (id: string) => {
    return apiRequest<ApiResponse<{ accommodation: any }>>(`/accommodations/${id}`);
  },
};

// Tours/Experiences API calls
export const toursApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/tours?${queryString}` : '/tours';

    return apiRequest<ApiResponse<{ tours: any[]; pagination: any }>>(endpoint);
  },

  getById: async (id: string) => {
    return apiRequest<ApiResponse<{ tour: any }>>(`/tours/${id}`);
  },
};

// Transportation API calls
export const transportationApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    vehicleType?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/transportation?${queryString}` : '/transportation';

    return apiRequest<ApiResponse<{ transportation: any[]; pagination: any }>>(endpoint);
  },

  getById: async (id: string) => {
    return apiRequest<ApiResponse<{ transportation: any }>>(`/transportation/${id}`);
  },
};

// Bookings API calls
export const bookingsApi = {
  create: async (bookingData: {
    serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
    serviceId: string;
    startDate: string;
    endDate?: string;
    numberOfPeople: number;
    specialRequests?: string;
  }) => {
    return apiRequest<ApiResponse<{ booking: any }>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';

    return apiRequest<ApiResponse<{ bookings: any[]; pagination: any }>>(endpoint);
  },

  getById: async (id: string) => {
    return apiRequest<ApiResponse<{ booking: any }>>(`/users/bookings/${id}`);
  },

  cancel: async (id: string) => {
    return apiRequest<ApiResponse<any>>(`/bookings/${id}/cancel`, {
      method: 'PUT',
    });
  },
};

// Payments API calls
export const paymentsApi = {
  create: async (paymentData: {
    bookingIds: string[];
    amount: number;
    method: string;
    currency?: string;
  }) => {
    return apiRequest<ApiResponse<{ payment: any }>>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
  // Single booking payment helper aligned with backend
  createSingle: async (paymentData: {
    bookingId: string;
    amount: number;
    method: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH' | 'PAYPAL';
    currency?: string;
  }) => {
    return apiRequest<ApiResponse<{ payment: any }>>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/payments?${queryString}` : '/payments';

    return apiRequest<ApiResponse<{ payments: any[]; pagination: any }>>(endpoint);
  },
};

// Stripe Checkout wrappers - Using LOCAL backend for payments
export const stripeApi = {
  init: async (payload: { bookingId: string; amount: number; currency: string; customer: { email: string; name: string } }) => {
    console.log('[Stripe API] 🚀 Starting payment initialization (LOCAL ONLY)');
    console.log('[Stripe API] Using LOCAL backend URL:', LOCAL_PAYMENT_API_URL);
    const response = await localPaymentApiRequest<{ success: boolean; link?: string; tx_ref?: string; message?: string }>(
      '/payments/stripe',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    console.log('[Stripe API] ✅ Init response from local backend:', response);
    return response;
  },
  verifyJson: async (tx_ref: string) => {
    console.log('[Stripe API] 🔍 Verifying via LOCAL backend for tx_ref:', tx_ref);
    const response = await localPaymentApiRequest<{ success: boolean; paid: boolean; bookingId?: string | null; message?: string }>(
      `/payments/stripe/verify-json?tx_ref=${encodeURIComponent(tx_ref)}`
    );
    console.log('[Stripe API] ✅ Verify response from local backend:', response);
    return response;
  },
};

// Trip Plans API calls
export const tripPlansApi = {
  create: async (tripPlanData: {
    arrivalDate: string;
    departureDate: string;
    tripType: string;
    numberOfPeople: number;
    budget?: number;
    specialRequests?: string;
  }) => {
    return apiRequest<ApiResponse<{ tripPlan: any }>>('/trip-plans', {
      method: 'POST',
      body: JSON.stringify(tripPlanData),
    });
  },
};

// Reviews API calls
export const reviewsApi = {
  create: async (reviewData: {
    serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
    serviceId: string;
    rating: number;
    comment: string;
  }) => {
    return apiRequest<ApiResponse<{ review: any }>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  getByService: async (serviceType: string, serviceId: string) => {
    return apiRequest<ApiResponse<{ reviews: any[] }>>(`/reviews/service/${serviceType}/${serviceId}`);
  },
};

export { ApiError };

// Admin API calls
export const adminApi = {
  getDashboard: async () => {
    return apiRequest<ApiResponse<{ stats: any; recentBookings: any[] }>>('/admin/dashboard');
  },
  getActivity: async (params?: { limit?: number; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.page) searchParams.append('page', String(params.page));
    const qs = searchParams.toString();
    return apiRequest<ApiResponse<{ activity: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(`/admin/activity${qs ? `?${qs}` : ''}`);
  },
  createUser: async (payload: { firstName: string; lastName: string; email: string; role: 'USER' | 'ADMIN' | 'PROVIDER'; password?: string; phone?: string; isVerified?: boolean; isActive?: boolean; }) => {
    return apiRequest<ApiResponse<{ user: any }>>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  // Booking management
  getBookings: async (token: string, params?: { page?: number; limit?: number; status?: string; serviceType?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.serviceType) searchParams.append('serviceType', params.serviceType);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return axios.get(`${API_BASE_URL}/admin/bookings${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateBookingStatus: async (token: string, bookingId: string, status: string) => {
    return axios.put(`${API_BASE_URL}/admin/bookings/${bookingId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // User management
  getUsers: async (token: string, params?: { page?: number; limit?: number; search?: string; role?: string; isVerified?: boolean; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.isVerified !== undefined) searchParams.append('isVerified', String(params.isVerified));
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    const qs = searchParams.toString();
    return axios.get(`${API_BASE_URL}/admin/users${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateUserStatus: async (token: string, userId: string, data: { isActive?: boolean; isVerified?: boolean; role?: string }) => {
    return axios.put(`${API_BASE_URL}/admin/users/${userId}/status`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteUser: async (token: string, userId: string) => {
    return axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Accommodation management
  getAccommodations: async (token: string, params?: { page?: number; limit?: number; search?: string; type?: string; category?: string; isVerified?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.isVerified !== undefined) searchParams.append('isVerified', String(params.isVerified));
    const qs = searchParams.toString();
    return axios.get(`${API_BASE_URL}/admin/accommodations${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createAccommodation: async (token: string, data: any) => {
    return axios.post(`${API_BASE_URL}/accommodations`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateAccommodation: async (token: string, accommodationId: string, data: any) => {
    return axios.put(`${API_BASE_URL}/accommodations/${accommodationId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteAccommodation: async (token: string, accommodationId: string) => {
    return axios.delete(`${API_BASE_URL}/accommodations/${accommodationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  verifyAccommodation: async (token: string, accommodationId: string, isVerified: boolean) => {
    return axios.put(`${API_BASE_URL}/admin/accommodations/${accommodationId}/verify`, { isVerified }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Locations for accommodation creation
  getLocations: async (token: string) => {
    return axios.get(`${API_BASE_URL}/admin/locations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Transportation management
  getTransportation: async (token: string, params?: { page?: number; limit?: number; search?: string; type?: string; vehicleType?: string; isVerified?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.vehicleType) searchParams.append('vehicleType', params.vehicleType);
    if (params?.isVerified !== undefined) searchParams.append('isVerified', String(params.isVerified));
    const qs = searchParams.toString();
    return axios.get(`${API_BASE_URL}/admin/transportation${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createTransportation: async (token: string, data: any) => {
    return axios.post(`${API_BASE_URL}/transportation`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateTransportation: async (token: string, transportationId: string, data: any) => {
    return axios.put(`${API_BASE_URL}/transportation/${transportationId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteTransportation: async (token: string, transportationId: string) => {
    return axios.delete(`${API_BASE_URL}/transportation/${transportationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  verifyTransportation: async (token: string, transportationId: string, isVerified: boolean) => {
    return axios.put(`${API_BASE_URL}/admin/transportation/${transportationId}/verify`, { isVerified }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Tour management
  getTours: async (token: string, params?: { page?: number; limit?: number; search?: string; type?: string; category?: string; isVerified?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.isVerified !== undefined) searchParams.append('isVerified', String(params.isVerified));
    const qs = searchParams.toString();
    return axios.get(`${API_BASE_URL}/admin/tours${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createTour: async (token: string, data: any) => {
    return axios.post(`${API_BASE_URL}/tours`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateTour: async (token: string, tourId: string, data: any) => {
    return axios.put(`${API_BASE_URL}/tours/${tourId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteTour: async (token: string, tourId: string) => {
    return axios.delete(`${API_BASE_URL}/tours/${tourId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  verifyTour: async (token: string, tourId: string, isVerified: boolean) => {
    return axios.put(`${API_BASE_URL}/admin/tours/${tourId}/verify`, { isVerified }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Report management
  getRevenueReport: async (token: string, params: { startDate: string; endDate: string; groupBy?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.groupBy) searchParams.append('groupBy', params.groupBy);
    return axios.get(`${API_BASE_URL}/admin/reports/revenue?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getBookingsReport: async (token: string, params: { startDate: string; endDate: string; groupBy?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.groupBy) searchParams.append('groupBy', params.groupBy);
    return axios.get(`${API_BASE_URL}/admin/reports/bookings?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getActivityReport: async (token: string, params: { startDate: string; endDate: string; groupBy?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.groupBy) searchParams.append('groupBy', params.groupBy);
    return axios.get(`${API_BASE_URL}/admin/reports/activity?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // System Settings management
  getSettings: async (token: string) => {
    return axios.get(`${API_BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateSetting: async (token: string, key: string, data: { value: string; description?: string }) => {
    return axios.put(`${API_BASE_URL}/admin/settings/${key}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  bulkUpdateSettings: async (token: string, settings: Array<{ key: string; value: string; description?: string }>) => {
    return axios.put(`${API_BASE_URL}/admin/settings`, { settings }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createSetting: async (token: string, data: { key: string; value: string; description?: string }) => {
    return axios.post(`${API_BASE_URL}/admin/settings`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Analytics
  getAnalytics: async (token: string, period: string = '30d') => {
    return axios.get(`${API_BASE_URL}/admin/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Help and Support
  getHelpArticles: async (token: string, category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    return axios.get(`${API_BASE_URL}/admin/help/articles?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getHelpArticle: async (token: string, id: string) => {
    return axios.get(`${API_BASE_URL}/admin/help/articles/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createHelpArticle: async (token: string, data: { title: string; content: string; categoryId: string; tags?: string[]; order?: number; isPublished?: boolean }) => {
    return axios.post(`${API_BASE_URL}/admin/help/articles`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateHelpArticle: async (token: string, id: string, data: { title: string; content: string; categoryId: string; tags?: string[]; order?: number; isPublished?: boolean }) => {
    return axios.put(`${API_BASE_URL}/admin/help/articles/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  deleteHelpArticle: async (token: string, id: string) => {
    return axios.delete(`${API_BASE_URL}/admin/help/articles/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getHelpCategories: async (token: string) => {
    return axios.get(`${API_BASE_URL}/admin/help/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  createHelpCategory: async (token: string, data: { name: string; description?: string; order?: number; icon?: string }) => {
    return axios.post(`${API_BASE_URL}/admin/help/categories`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSystemDiagnostics: async (token: string) => {
    return axios.get(`${API_BASE_URL}/admin/help/diagnostics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  submitSupportTicket: async (token: string, data: { subject: string; description: string; priority?: string; category?: string }) => {
    return axios.post(`${API_BASE_URL}/admin/help/tickets`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSupportTickets: async (token: string, status?: string, priority?: string, category?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (priority && priority !== 'all') params.append('priority', priority);
    if (category && category !== 'all') params.append('category', category);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return axios.get(`${API_BASE_URL}/admin/help/tickets?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};

// API utility for consistent backend calls

const API_BASE_URL = 'http://localhost:5000/api';

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
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return handleResponse<T>(response);
};

// Auth API calls
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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

  verifyEmail: async (token: string) => {
    return apiRequest<ApiResponse<any>>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification: async (email: string) => {
    return apiRequest<ApiResponse<any>>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
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
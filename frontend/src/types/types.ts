// src/types.ts
export interface AccommodationDetails {
  name: string;
  type: string;
  category?: string;
  rating?: number;
  images: string[];
  location: {
    city: string;
  };
}

export interface TransportationDetails {
  name: string;
  images: string[];
  location: {
    city: string;
  };
}

export interface TourDetails {
  name: string;
  images: string[];
  location: {
    city: string;
  };
}

export interface Booking {
  id: string;
  serviceType: 'ACCOMMODATION' | 'TOUR' | 'TRANSPORTATION' | string;
  serviceName: string;
  startDate: string;
  endDate?: string;
  numberOfPeople: number;
  totalAmount: number;
  currency: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | string;
  isConfirmed?: boolean;
  isCancelled?: boolean;
  createdAt: string;
  location: string;
  image: string;
  specialRequests?: string;
  accommodation?: AccommodationDetails;
  transportation?: TransportationDetails;
  tour?: TourDetails;
}
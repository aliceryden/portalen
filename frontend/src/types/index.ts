// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'horse_owner' | 'farrier' | 'admin';
  address?: string;
  city?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  is_verified: boolean;
  profile_image?: string;
  created_at: string;
}

// Farrier types
export interface FarrierService {
  id: number;
  farrier_id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface FarrierSchedule {
  id: number;
  farrier_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface FarrierArea {
  id: number;
  farrier_id: number;
  city: string;
  postal_code_prefix?: string;
  travel_fee: number;
  created_at: string;
}

export interface Farrier {
  id: number;
  user_id: number;
  business_name?: string;
  description?: string;
  experience_years: number;
  certifications?: string;
  travel_radius_km: number;
  base_latitude?: number;
  base_longitude?: number;
  average_rating: number;
  total_reviews: number;
  is_available: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
  user_phone?: string;
  user_profile_image?: string;
  user_city?: string;
  services: FarrierService[];
  schedules: FarrierSchedule[];
  areas: FarrierArea[];
}

export interface FarrierListItem {
  id: number;
  user_id: number;
  business_name?: string;
  description?: string;
  experience_years: number;
  average_rating: number;
  total_reviews: number;
  travel_radius_km: number;
  base_latitude?: number;
  base_longitude?: number;
  is_available: boolean;
  is_verified: boolean;
  user_first_name?: string;
  user_last_name?: string;
  user_city?: string;
  user_profile_image?: string;
  min_price?: number;
  max_price?: number;
  distance_km?: number;
}

// Horse types
export interface Horse {
  id: number;
  owner_id: number;
  name: string;
  breed?: string;
  birth_date?: string;
  gender?: string;
  height_cm?: number;
  passport_number?: string;
  chip_number?: string;
  shoe_size?: string;
  special_needs?: string;
  last_farrier_visit?: string;
  stable_name?: string;
  stable_address?: string;
  stable_city?: string;
  stable_latitude?: string;
  stable_longitude?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Booking types
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: number;
  horse_owner_id: number;
  farrier_id: number;
  horse_id: number;
  service_type: string;
  scheduled_date: string;
  duration_minutes: number;
  location_address?: string;
  location_city?: string;
  location_latitude?: string;
  location_longitude?: string;
  service_price: number;
  travel_fee: number;
  total_price: number;
  status: BookingStatus;
  notes_from_owner?: string;
  notes_from_farrier?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  horse_name?: string;
  farrier_name?: string;
  farrier_email?: string;
  farrier_phone?: string;
  owner_name?: string;
  has_review: boolean;
}

// Review types
export interface Review {
  id: number;
  booking_id: number;
  author_id: number;
  farrier_id: number;
  rating: number;
  quality_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  price_rating?: number;
  title?: string;
  comment?: string;
  is_visible: boolean;
  is_verified: boolean;
  farrier_response?: string;
  farrier_responded_at?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_image?: string;
}

// Form types
export interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'horse_owner' | 'farrier';
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface HorseFormData {
  name: string;
  birth_date?: string;
  birth_year?: string;
  birth_month?: string;
  birth_day?: string;
  gender?: string;
  height_cm?: number;
  passport_number?: string;
  chip_number?: string;
  shoe_size?: string;
  special_needs?: string;
  stable_name?: string;
  stable_address?: string;
  stable_city?: string;
  image_url?: string;
}

export interface BookingFormData {
  farrier_id: number;
  horse_id: number;
  service_type: string;
  scheduled_date: string;
  duration_minutes: number;
  location_address?: string;
  location_city?: string;
  service_price: number;
  travel_fee: number;
  notes_from_owner?: string;
}

// Search filters
export interface FarrierSearchFilters {
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  city?: string;
  min_rating?: number;
  max_price?: number;
  service_type?: string;
}

// Admin stats
export interface AdminStats {
  total_users: number;
  total_horse_owners: number;
  total_farriers: number;
  total_horses: number;
  total_bookings: number;
  total_reviews: number;
  bookings_by_status: Record<string, number>;
  recent_bookings: number;
  new_users_last_30_days: number;
  average_rating: number;
  total_revenue: number;
}


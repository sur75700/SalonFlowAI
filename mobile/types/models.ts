export type SummaryData = {
  total_clients: number;
  total_services: number;
  total_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  today_appointments: number;
};

export type ClientItem = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type ServiceItem = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
};

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export type AppointmentItem = {
  id: string;
  client_id: string;
  client_name: string;
  service_id?: string | null;
  service_name?: string | null;
  starts_at: string;
  ends_at?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type AnalyticsTotals = {
  total_revenue_snapshot: number;
  completed_revenue: number;
  scheduled_pipeline: number;
  cancelled_value: number;
  avg_completed_booking_value: number;
};

export type AnalyticsTopService = {
  service_name: string;
  bookings_count: number;
  revenue: number;
};

export type AnalyticsRevenuePoint = {
  date: string;
  completed_revenue: number;
};

export type AnalyticsData = {
  currency: string;
  totals: AnalyticsTotals;
  top_services: AnalyticsTopService[];
  revenue_last_7_days: AnalyticsRevenuePoint[];
};

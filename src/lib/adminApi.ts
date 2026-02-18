import { api, ApiError } from "./api";

// ── Admin Auth ────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  user: AdminUser;
}

export const adminAuthApi = {
  login: (email: string, password: string) =>
    api.post<AdminLoginResponse>("/api/admin/auth/login", { email, password }),

  me: () => api.get<{ user: AdminUser }>("/api/admin/auth/me"),

  logout: () => api.post("/api/admin/auth/logout"),
};

// ── Pharmacy Management (CRUD via /api/admin/pharmacies) ──────────────────

export interface AdminPharmacy {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  opening_hours: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string | null;
  latitude: string | null;
  longitude: string | null;
  rating: string | null;
  total_reviews: number;
  total_searches: number;
  total_inquiries: number;
  accepts_medical_aid: boolean;
  has_delivery: boolean;
  is_24_hours: boolean;
  parking_available: boolean;
  special_services: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  chain_name: string | null;
}

export interface CreatePharmacyPayload {
  name: string;
  address: string;
  suburb?: string;
  phone?: string;
  email: string;
  whatsapp_number?: string;
  opening_hours?: string;
  contact_name: string;
}

export const adminPharmacyApi = {
  list: () => api.get<{ pharmacies: AdminPharmacy[] }>("/api/admin/pharmacies"),
  get: (id: string) => api.get<{ pharmacy: AdminPharmacy }>(`/api/admin/pharmacies/${id}`),
  create: (payload: CreatePharmacyPayload) =>
    api.post<{ pharmacy: AdminPharmacy }>("/api/admin/pharmacies", payload),
  update: (id: string, payload: Partial<AdminPharmacy>) =>
    api.put<{ pharmacy: AdminPharmacy }>(`/api/admin/pharmacies/${id}`, payload),
  delete: (id: string) => api.delete(`/api/admin/pharmacies/${id}`),
  resendCredentials: (id: string) =>
    api.post<{ email_sent: boolean; user_email: string }>(`/api/admin/pharmacies/${id}/resend-credentials`),
};

// ── Pharmacy User Management (via /api/admin/users) ───────────────────────

export interface PharmacyManagedUser {
  id: string;
  email: string;
  name: string | null;
  pharmacy_id: string | null;
  pharmacy_name?: string;
  role: string;
  created_at: string;
  is_active: boolean;
  must_change_password?: boolean;
}

export interface CreatePharmacyUserPayload {
  email: string;
  name?: string;
  pharmacy_id: string;
  role?: string;
}

export const adminPharmacyUserApi = {
  list: (pharmacyId?: string) => {
    const params = pharmacyId ? `?pharmacy_id=${pharmacyId}` : "";
    return api.get<{ users: PharmacyManagedUser[] }>(`/api/admin/users${params}`);
  },
  create: (payload: CreatePharmacyUserPayload) =>
    api.post<{ user: PharmacyManagedUser }>("/api/admin/users", payload),
  resetPassword: (id: string) =>
    api.post<{ email_sent: boolean }>(`/api/admin/users/${id}/reset-password`),
  delete: (id: string) => api.delete(`/api/admin/users/${id}`),
};

// ── Medicine Database (Full CRUD via /api/medicines) ──────────────────────

export interface AdminMedicine {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  dosage_form: string | null;
  strength: string | null;
  description: string | null;
  requires_prescription: boolean;
  created_at: string;
}

export interface CreateMedicinePayload {
  name: string;
  generic_name?: string;
  category?: string;
  dosage_form?: string;
  strength?: string;
  description?: string;
  requires_prescription?: boolean;
}

export const adminMedicineApi = {
  list: (search?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", String(limit));
    return api.get<{ medicines: AdminMedicine[] }>(`/api/medicines?${params}`);
  },
  get: (id: string) => api.get<{ medicine: AdminMedicine }>(`/api/medicines/${id}`),
  create: (payload: CreateMedicinePayload) =>
    api.post<{ medicine: AdminMedicine }>("/api/medicines", payload),
  update: (id: string, payload: Partial<CreateMedicinePayload>) =>
    api.put<{ medicine: AdminMedicine }>(`/api/medicines/${id}`, payload),
  delete: (id: string) => api.delete(`/api/medicines/${id}`),
};

// ── Analytics (via /api/pharmacy/analytics) ───────────────────────────────

export interface AdminOverviewStats {
  total_pharmacies: number;
  total_users: number;
  total_medicines: number;
  total_searches: number;
  active_pharmacies: number;
  recent_signups: number;
}

export interface TrendingMedicine {
  medicine_id: string;
  medicine_name: string;
  search_count: number;
}

export interface RecentInquiry {
  id: string;
  query: string;
  user_location?: string;
  created_at: string;
}

export const adminAnalyticsApi = {
  dashboard: () =>
    api.get<{
      overview: AdminOverviewStats;
      trending_medicines: TrendingMedicine[];
      recent_inquiries: RecentInquiry[];
    }>("/api/admin/analytics"),
};

// ── System Settings (JWT, Email, Twilio, OCR, OpenRouter) ─────────────────

export interface SystemSettings {
  jwt?: { secret_key?: string; algorithm?: string; expiry_minutes?: number };
  email?: { smtp_host?: string; smtp_port?: number; smtp_user?: string; smtp_password?: string; from_email?: string };
  twilio?: { account_sid?: string; auth_token?: string; whatsapp_from?: string };
  ocr?: { provider?: string; api_key?: string };
  openrouter?: { api_key?: string; model?: string };
}

export const adminSettingsApi = {
  get: () => api.get<{ settings: SystemSettings }>("/api/admin/settings"),
  update: (payload: Partial<SystemSettings>) =>
    api.put<{ settings: SystemSettings }>("/api/admin/settings", payload),
};

export { ApiError };

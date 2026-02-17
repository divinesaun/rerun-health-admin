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

// ── Pharmacy Management ───────────────────────────────────────────────────

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
}

export interface CreatePharmacyPayload {
  name: string;
  address: string;
  suburb?: string;
  city?: string;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
  opening_hours?: string;
  admin_email: string;
  admin_password: string;
  admin_name?: string;
}

export const adminPharmacyApi = {
  list: () => api.get<{ pharmacies: AdminPharmacy[] }>("/api/admin/pharmacies"),
  get: (id: string) => api.get<{ pharmacy: AdminPharmacy }>(`/api/admin/pharmacies/${id}`),
  create: (payload: CreatePharmacyPayload) =>
    api.post<{ pharmacy: AdminPharmacy }>("/api/admin/pharmacies", payload),
  update: (id: string, payload: Partial<AdminPharmacy>) =>
    api.put<{ pharmacy: AdminPharmacy }>(`/api/admin/pharmacies/${id}`, payload),
  delete: (id: string) => api.delete(`/api/admin/pharmacies/${id}`),
};

// ── User Management ───────────────────────────────────────────────────────

export interface AdminManagedUser {
  id: string;
  email: string;
  name: string | null;
  pharmacy_id: string | null;
  pharmacy_name?: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

export const adminUserApi = {
  list: () => api.get<{ users: AdminManagedUser[] }>("/api/admin/users"),
  get: (id: string) => api.get<{ user: AdminManagedUser }>(`/api/admin/users/${id}`),
  update: (id: string, payload: Partial<AdminManagedUser>) =>
    api.put<{ user: AdminManagedUser }>(`/api/admin/users/${id}`, payload),
  deactivate: (id: string) => api.post(`/api/admin/users/${id}/deactivate`),
};

// ── Medicine Database ─────────────────────────────────────────────────────

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
    return api.get<{ medicines: AdminMedicine[] }>(`/api/admin/medicines?${params}`);
  },
  create: (payload: CreateMedicinePayload) =>
    api.post<{ medicine: AdminMedicine }>("/api/admin/medicines", payload),
  update: (id: string, payload: Partial<CreateMedicinePayload>) =>
    api.put<{ medicine: AdminMedicine }>(`/api/admin/medicines/${id}`, payload),
  delete: (id: string) => api.delete(`/api/admin/medicines/${id}`),
};

// ── Admin Analytics ───────────────────────────────────────────────────────

export interface AdminAnalytics {
  total_pharmacies: number;
  total_users: number;
  total_medicines: number;
  total_searches: number;
  active_pharmacies: number;
  recent_signups: number;
}

export const adminAnalyticsApi = {
  overview: () => api.get<{ analytics: AdminAnalytics }>("/api/admin/analytics"),
  searchTrends: () => api.get<{ trends: unknown[] }>("/api/admin/analytics/trends"),
};

// ── Admin Settings ────────────────────────────────────────────────────────

export const adminSettingsApi = {
  get: () => api.get<{ settings: Record<string, unknown> }>("/api/admin/settings"),
  update: (payload: Record<string, unknown>) =>
    api.put<{ settings: Record<string, unknown> }>("/api/admin/settings", payload),
};

export { ApiError };

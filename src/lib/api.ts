const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://rrerun-health-backend.vercel.app").replace(/\/$/, "");

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem("access_token");
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, isFormData = false } = options;
    const token = this.getToken();

    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (!isFormData) {
      requestHeaders["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(response.status, error.detail || "Request failed");
    }

    return response.json();
  }

  get<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  put<T = unknown>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  delete<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  upload<T = unknown>(endpoint: string, formData: FormData) {
    return this.request<T>(endpoint, { method: "POST", body: formData, isFormData: true });
  }
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const api = new ApiClient(API_BASE_URL);

// ── Auth ──────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  must_change_password: boolean;
  user: PharmacyUser;
}

export interface PharmacyUser {
  id: string;
  email: string;
  name: string | null;
  pharmacy_id: string;
  role: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/pharmacy/auth/login", { email, password }),

  me: () => api.get<{ user: PharmacyUser }>("/api/pharmacy/auth/me"),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<{ message: string }>("/api/pharmacy/auth/change-password", payload),

  logout: () => api.post("/api/pharmacy/auth/logout"),
};

// ── Inventory ─────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  price: number;
  in_stock: boolean;
  quantity_available: string;
  times_searched: number;
  last_search_date: string | null;
  last_updated: string;
  medicines?: {
    name: string;
    category: string | null;
    dosage_forms: string | null;
  };
}

export interface InventoryCreatePayload {
  medicine_id?: string;
  medicine_name?: string;
  category?: string;
  price: number;
  in_stock: boolean;
  quantity_available?: string;
}

export interface InventoryUpdatePayload {
  price?: number;
  in_stock?: boolean;
  quantity_available?: string;
}

export const inventoryApi = {
  list: () => api.get<{ inventory: InventoryItem[] }>("/api/pharmacy/inventory"),

  add: (payload: InventoryCreatePayload) =>
    api.post<{ item: InventoryItem }>("/api/pharmacy/inventory", payload),

  update: (id: string, payload: InventoryUpdatePayload) =>
    api.put<{ item: InventoryItem }>(`/api/pharmacy/inventory/${id}`, payload),

  delete: (id: string) => api.delete(`/api/pharmacy/inventory/${id}`),

  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload<{ success: string[]; errors: string[] }>("/api/pharmacy/inventory/bulk-upload", formData);
  },

  searchMedicines: (q: string) =>
    api.get<{ medicines: MedicineRecord[] }>(`/api/pharmacy/medicines/search?q=${encodeURIComponent(q)}`),

  fixCsv: (rawCsv: string) =>
    api.post<{ corrected_csv: string }>("/api/pharmacy/inventory/fix-csv", { raw_csv: rawCsv }),
};

// ── Medicines ─────────────────────────────────────────────────────────────

export interface MedicineRecord {
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

export const medicineApi = {
  list: (search?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", String(limit));
    return api.get<{ medicines: MedicineRecord[] }>(`/api/medicines?${params}`);
  },

  get: (id: string) => api.get<{ medicine: MedicineRecord }>(`/api/medicines/${id}`),

  alternatives: (id: string) =>
    api.get<{ alternatives: MedicineRecord[] }>(`/api/medicines/${id}/alternatives`),

  availability: (id: string) => api.get<{ availability: unknown[] }>(`/api/medicines/${id}/availability`),
};

// ── Analytics ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  dashboard: () =>
    api.get<{ overview: Record<string, unknown>; trending_medicines: unknown[]; recent_inquiries: unknown[] }>(
      "/api/pharmacy/analytics"
    ),

  trending: () => api.get<{ trending: unknown[] }>("/api/pharmacy/analytics/trending"),

  inquiries: () => api.get<{ inquiries: unknown[] }>("/api/pharmacy/inquiries"),
};

// ── Pharmacy Profile ──────────────────────────────────────────────────────

export interface PharmacyProfile {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  whatsapp_number: string | null;
  opening_hours: string | Record<string, unknown> | null;
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

export const profileApi = {
  get: () => api.get<{ pharmacy: PharmacyProfile }>("/api/pharmacy/profile"),

  update: (payload: Partial<PharmacyProfile>) =>
    api.put<{ pharmacy: PharmacyProfile }>("/api/pharmacy/profile", payload),
};

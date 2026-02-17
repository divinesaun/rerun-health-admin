import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDesktopSidebar, AdminMobileSidebar } from "@/components/AdminSidebar";
import { AdminTabType } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  Pill,
  Search as SearchIcon,
  TrendingUp,
  Plus,
  Settings,
  ShieldCheck,
  Activity,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  MessageSquare,
  ScanLine,
  Brain,
  KeyRound,
  Save,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminPharmacyApi,
  adminPharmacyUserApi,
  adminMedicineApi,
  adminAnalyticsApi,
  adminSettingsApi,
  type AdminPharmacy,
  type PharmacyManagedUser,
  type AdminMedicine,
  type TrendingMedicine,
  type SystemSettings,
} from "@/lib/adminApi";

const AdminDashboard = () => {
  const [tab, setTab] = useState<AdminTabType>("overview");
  const navigate = useNavigate();
  const { logout: authLogout, user } = useAuth();

  const handleLogout = () => {
    authLogout();
    navigate("/admin/login");
  };

  const adminName = user?.name || "Admin";
  const adminEmail = user?.email || "";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminDesktopSidebar
        activeTab={tab}
        onTabChange={setTab}
        onLogout={handleLogout}
        adminName={adminName}
        adminEmail={adminEmail}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:h-16 md:px-6">
          <AdminMobileSidebar
            activeTab={tab}
            onTabChange={setTab}
            onLogout={handleLogout}
            adminName={adminName}
            adminEmail={adminEmail}
          />
          <div className="flex-1" />
          <Badge variant="outline" className="gap-1.5 text-xs">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </Badge>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {adminName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {tab === "overview" && "Dashboard Overview"}
              {tab === "pharmacies" && "Pharmacy Management"}
              {tab === "users" && "User Management"}
              {tab === "medicines" && "Medicine Database"}
              {tab === "analytics" && "Platform Analytics"}
              {tab === "settings" && "System Settings"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tab === "overview" && "Platform health and key metrics at a glance"}
              {tab === "pharmacies" && "Register and manage pharmacy accounts"}
              {tab === "users" && "Manage pharmacy staff and reset passwords"}
              {tab === "medicines" && "Curate the master medicine database"}
              {tab === "analytics" && "Search trends and platform usage data"}
              {tab === "settings" && "Configure JWT, email, Twilio, OCR & OpenRouter"}
            </p>
          </div>

          {tab === "overview" && <OverviewTab onNavigate={setTab} />}
          {tab === "pharmacies" && <PharmaciesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "medicines" && <MedicinesTab />}
          {tab === "analytics" && <AdminAnalyticsTab />}
          {tab === "settings" && <AdminSettingsTab />}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          <p>RERUN Health Admin — System Management Portal</p>
        </footer>
      </div>
    </div>
  );
};

// ── Loading / Error helpers ──────────────────────────────────────────────

function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <XCircle className="h-8 w-8 mb-3 text-destructive/60" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({ onNavigate }: { onNavigate: (tab: AdminTabType) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminAnalyticsApi.dashboard(),
  });

  const overview = data?.overview;

  const stats = [
    { title: "Total Pharmacies", value: overview?.total_pharmacies, icon: Building2, description: "registered pharmacies" },
    { title: "Total Users", value: overview?.total_users, icon: Users, description: "pharmacy staff accounts" },
    { title: "Medicine Database", value: overview?.total_medicines, icon: Pill, description: "medicines catalogued" },
    { title: "Total Searches", value: overview?.total_searches, icon: SearchIcon, description: "user medicine searches" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stat.value ?? "—")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("pharmacies")}>
              <Plus className="h-4 w-4" /> Register Pharmacy
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("medicines")}>
              <Plus className="h-4 w-4" /> Add Medicine
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("users")}>
              <Users className="h-4 w-4" /> Manage Users
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("analytics")}>
              <TrendingUp className="h-4 w-4" /> View Trends
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trending Medicines</CardTitle>
            <CardDescription>Most searched this period</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading trends..." />
            ) : data?.trending_medicines?.length ? (
              <ul className="space-y-2">
                {data.trending_medicines.slice(0, 5).map((t: TrendingMedicine, i: number) => (
                  <li key={t.medicine_id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      <span className="font-medium text-foreground">{t.medicine_name}</span>
                    </span>
                    <span className="text-muted-foreground">{t.search_count} searches</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No trending data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Pharmacies Tab ────────────────────────────────────────────────────────

function PharmaciesTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "pharmacies"],
    queryFn: () => adminPharmacyApi.list(),
  });

  const pharmacies = (data?.pharmacies ?? []).filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search pharmacies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Register Pharmacy
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading pharmacies..." />
      ) : error ? (
        <ErrorState message="Failed to load pharmacies" onRetry={() => refetch()} />
      ) : pharmacies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search ? "No pharmacies match your search" : "No pharmacies registered yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pharmacy Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pharmacies.map((p: AdminPharmacy) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[p.suburb, p.city].filter(Boolean).join(", ") || p.address}
                  </TableCell>
                  <TableCell>
                    {p.verified ? (
                      <Badge variant="default" className="gap-1 bg-primary/10 text-primary border-0">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "pharmacy-users"],
    queryFn: () => adminPharmacyUserApi.list(),
  });

  const users = (data?.users ?? []).filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading users..." />
      ) : error ? (
        <ErrorState message="Failed to load users" onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search ? "No users match your search" : "No pharmacy users yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: PharmacyManagedUser) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.pharmacy_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                      {u.role.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.is_active ? "text-primary border-primary/30" : "text-destructive border-destructive/30"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Medicines Tab ─────────────────────────────────────────────────────────

function MedicinesTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "medicines", search],
    queryFn: () => adminMedicineApi.list(search || undefined),
  });

  const medicines = data?.medicines ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Medicine
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading medicines..." />
      ) : error ? (
        <ErrorState message="Failed to load medicines" onRetry={() => refetch()} />
      ) : medicines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search ? "No medicines match your search" : "No medicines in database"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((m: AdminMedicine) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.generic_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.category || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.dosage_form || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.strength || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={m.requires_prescription ? "destructive" : "secondary"} className="text-xs">
                      {m.requires_prescription ? "Required" : "OTC"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────

function AdminAnalyticsTab() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => adminAnalyticsApi.dashboard(),
  });

  const overview = data?.overview;
  const trending = data?.trending_medicines ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Pharmacies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (overview?.active_pharmacies ?? "—")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">updated inventory recently</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (overview?.total_searches ?? "—")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">all-time medicine searches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (overview?.recent_signups ?? "—")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">recent pharmacy registrations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trending Medicines</CardTitle>
          <CardDescription>Most searched medicines across all pharmacies</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading trends..." />
          ) : error ? (
            <ErrorState message="Failed to load analytics" onRetry={() => refetch()} />
          ) : trending.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-right">Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trending.slice(0, 10).map((t, i) => (
                  <TableRow key={t.medicine_id}>
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{t.medicine_name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{t.search_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No trending data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Settings Tab (JWT, Email, Twilio, OCR, OpenRouter) ────────────────────

function AdminSettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminSettingsApi.get(),
  });

  const [settings, setSettings] = useState<SystemSettings>({});
  const [initialized, setInitialized] = useState(false);

  if (data?.settings && !initialized) {
    setSettings(data.settings);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (payload: Partial<SystemSettings>) => adminSettingsApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast({ title: "Settings saved", description: "System configuration updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handleSave = () => mutation.mutate(settings);

  const updateField = (section: keyof SystemSettings, key: string, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), [key]: value },
    }));
  };

  if (isLoading) return <LoadingState message="Loading settings..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending} className="gap-1.5">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* JWT */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">JWT Configuration</CardTitle>
            </div>
            <CardDescription>Token signing and expiry settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Algorithm</Label>
              <Input value={settings.jwt?.algorithm ?? ""} onChange={(e) => updateField("jwt", "algorithm", e.target.value)} placeholder="HS256" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Expiry (minutes)</Label>
              <Input type="number" value={settings.jwt?.expiry_minutes ?? ""} onChange={(e) => updateField("jwt", "expiry_minutes", Number(e.target.value))} placeholder="60" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Email / SMTP */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Email (SMTP)</CardTitle>
            </div>
            <CardDescription>Outgoing email configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">SMTP Host</Label>
                <Input value={settings.email?.smtp_host ?? ""} onChange={(e) => updateField("email", "smtp_host", e.target.value)} placeholder="smtp.gmail.com" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">SMTP Port</Label>
                <Input type="number" value={settings.email?.smtp_port ?? ""} onChange={(e) => updateField("email", "smtp_port", Number(e.target.value))} placeholder="587" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">SMTP User</Label>
              <Input value={settings.email?.smtp_user ?? ""} onChange={(e) => updateField("email", "smtp_user", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">SMTP Password</Label>
              <Input type="password" value={settings.email?.smtp_password ?? ""} onChange={(e) => updateField("email", "smtp_password", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">From Email</Label>
              <Input value={settings.email?.from_email ?? ""} onChange={(e) => updateField("email", "from_email", e.target.value)} placeholder="noreply@rerunhealth.co.zw" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Twilio / WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Twilio (WhatsApp)</CardTitle>
            </div>
            <CardDescription>WhatsApp messaging via Twilio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Account SID</Label>
              <Input value={settings.twilio?.account_sid ?? ""} onChange={(e) => updateField("twilio", "account_sid", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Auth Token</Label>
              <Input type="password" value={settings.twilio?.auth_token ?? ""} onChange={(e) => updateField("twilio", "auth_token", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">WhatsApp From Number</Label>
              <Input value={settings.twilio?.whatsapp_from ?? ""} onChange={(e) => updateField("twilio", "whatsapp_from", e.target.value)} placeholder="+263..." className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* OCR */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">OCR Service</CardTitle>
            </div>
            <CardDescription>Prescription and document scanning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Provider</Label>
              <Input value={settings.ocr?.provider ?? ""} onChange={(e) => updateField("ocr", "provider", e.target.value)} placeholder="google_vision" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">API Key</Label>
              <Input type="password" value={settings.ocr?.api_key ?? ""} onChange={(e) => updateField("ocr", "api_key", e.target.value)} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* OpenRouter */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">OpenRouter (AI)</CardTitle>
            </div>
            <CardDescription>AI model routing for medicine suggestions and search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">API Key</Label>
                <Input type="password" value={settings.openrouter?.api_key ?? ""} onChange={(e) => updateField("openrouter", "api_key", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Model</Label>
                <Input value={settings.openrouter?.model ?? ""} onChange={(e) => updateField("openrouter", "model", e.target.value)} placeholder="openai/gpt-4o" className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;

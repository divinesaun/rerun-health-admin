import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Trash2,
  Download,
  FileJson,
  FileSpreadsheet,
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
import { RegisterPharmacyDialog } from "@/components/admin/RegisterPharmacyDialog";
import { AddMedicineDialog } from "@/components/admin/AddMedicineDialog";
import { UserActionsDropdown } from "@/components/admin/UserActionsDropdown";
import { PharmacyActionsDropdown } from "@/components/admin/PharmacyActionsDropdown";
import { MedicineActionsDropdown } from "@/components/admin/MedicineActionsDropdown";
import { AddPharmacyUserDialog } from "@/components/admin/AddPharmacyUserDialog";

const AdminDashboard = () => {
  const [tab, setTab] = useState<AdminTabType>("overview");
  const navigate = useNavigate();
  const { logout: authLogout, user } = useAuth();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

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

        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
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

function exportData(items: Record<string, unknown>[], format: "json" | "csv", filename: string) {
  let content: string;
  let mimeType: string;
  if (format === "json") {
    content = JSON.stringify(items, null, 2);
    mimeType = "application/json";
  } else {
    if (items.length === 0) return;
    const keys = Object.keys(items[0]);
    const rows = [keys.join(","), ...items.map((item) => keys.map((k) => `"${String(item[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    content = rows.join("\n");
    mimeType = "text/csv";
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

function PharmaciesTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "pharmacies"],
    queryFn: () => adminPharmacyApi.list(),
  });

  const pharmacies = (data?.pharmacies ?? []).filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "verified" && !p.verified) return false;
    if (statusFilter === "pending" && p.verified) return false;
    return true;
  });

  const allSelected = pharmacies.length > 0 && pharmacies.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pharmacies.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    setDeleting(true);
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try { await adminPharmacyApi.delete(id); ok++; } catch { fail++; }
    }
    setDeleting(false);
    setConfirmDelete(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacies"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    toast({ title: "Batch delete", description: `${ok} deleted${fail > 0 ? `, ${fail} failed` : ""}` });
  };

  const handleExport = (format: "json" | "csv") => {
    const items = pharmacies.filter((p) => (someSelected ? selected.has(p.id) : true));
    exportData(items.map(({ id, name, address, suburb, city, phone, email, whatsapp_number, verified, created_at, rating }) => ({ id, name, address, suburb, city, phone, email, whatsapp_number, verified, rating, created_at })), format, "pharmacies");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search pharmacies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "verified" | "pending")}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2">
                <FileJson className="h-4 w-4" /> Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <RegisterPharmacyDialog />
        </div>
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
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
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
                <TableRow key={p.id} className={selected.has(p.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                  </TableCell>
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
                    <PharmacyActionsDropdown pharmacy={p} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} pharmacy{selected.size !== 1 ? "ies" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected pharmacies and all associated users, inventory, and inquiries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "pharmacy-users"],
    queryFn: () => adminPharmacyUserApi.list(),
  });

  const users = (data?.users ?? []).filter((u) => {
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;
    return true;
  });

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    setDeleting(true);
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try { await adminPharmacyUserApi.delete(id); ok++; } catch { fail++; }
    }
    setDeleting(false);
    setConfirmDelete(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacy-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacies"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    toast({ title: "Batch delete", description: `${ok} deleted${fail > 0 ? `, ${fail} failed` : ""}` });
  };

  const handleExport = (format: "json" | "csv") => {
    const items = users.filter((u) => (someSelected ? selected.has(u.id) : true));
    exportData(items.map(({ id, name, email, pharmacy_name, role, is_active, created_at }) => ({ id, name, email, pharmacy_name, role, is_active, created_at })), format, "pharmacy_users");
  };

  const roles = [...new Set((data?.users ?? []).map((u) => u.role))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2">
                <FileJson className="h-4 w-4" /> Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddPharmacyUserDialog />
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
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
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
                <TableRow key={u.id} className={selected.has(u.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleOne(u.id)} />
                  </TableCell>
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
                    <UserActionsDropdown user={u} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} user{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected users and their associated pharmacies, inventory, and inquiries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Medicines Tab ─────────────────────────────────────────────────────────

function MedicinesTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [rxFilter, setRxFilter] = useState<"all" | "otc" | "rx">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "medicines", search],
    queryFn: () => adminMedicineApi.list(search || undefined, 200),
  });

  const allMedicines = data?.medicines ?? [];
  const categories = [...new Set(allMedicines.map((m) => m.category).filter(Boolean))] as string[];

  const medicines = allMedicines.filter((m) => {
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (rxFilter === "rx" && !m.requires_prescription) return false;
    if (rxFilter === "otc" && m.requires_prescription) return false;
    return true;
  });

  const allSelected = medicines.length > 0 && medicines.every((m) => selected.has(m.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(medicines.map((m) => m.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    setDeleting(true);
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      try { await adminMedicineApi.delete(id); ok++; } catch { fail++; }
    }
    setDeleting(false);
    setConfirmDelete(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    toast({ title: "Batch delete", description: `${ok} deleted${fail > 0 ? `, ${fail} failed` : ""}` });
  };

  const handleExport = (format: "json" | "csv") => {
    const items = medicines.filter((m) => (someSelected ? selected.has(m.id) : true));
    exportData(
      items.map(({ id, name, generic_name, category, dosage_form, strength, requires_prescription, created_at }) => ({
        id, name, generic_name, category, dosage_form, strength, requires_prescription, created_at,
      })),
      format,
      "medicines"
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value as "all" | "otc" | "rx")}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All Types</option>
            <option value="otc">OTC Only</option>
            <option value="rx">Prescription Only</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2">
                <FileJson className="h-4 w-4" /> Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddMedicineDialog />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading medicines..." />
      ) : error ? (
        <ErrorState message="Failed to load medicines" onRetry={() => refetch()} />
      ) : medicines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{search || categoryFilter !== "all" || rxFilter !== "all" ? "No medicines match your filters" : "No medicines in database"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
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
                <TableRow key={m.id} className={selected.has(m.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggleOne(m.id)} />
                  </TableCell>
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
                    <MedicineActionsDropdown medicine={m} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} medicine{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected medicines from the database. Pharmacies with these medicines in inventory will be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">New Registrations</CardTitle>
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

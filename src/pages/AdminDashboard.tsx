import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDesktopSidebar, AdminMobileSidebar } from "@/components/AdminSidebar";
import { AdminTabType } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
              {tab === "users" && "Manage pharmacy staff and admin users"}
              {tab === "medicines" && "Maintain the master medicine database"}
              {tab === "analytics" && "Search trends and platform usage data"}
              {tab === "settings" && "Configure system-wide settings"}
            </p>
          </div>

          {tab === "overview" && <OverviewTab onNavigate={setTab} />}
          {tab === "pharmacies" && <PharmaciesTab />}
          {tab === "users" && <UsersTab />}
          {tab === "medicines" && <MedicinesTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "settings" && <SettingsTab />}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          <p>RERUN Health Admin — System Management Portal</p>
        </footer>
      </div>
    </div>
  );
};

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({ onNavigate }: { onNavigate: (tab: AdminTabType) => void }) {
  const stats = [
    { title: "Total Pharmacies", value: "—", icon: Building2, description: "registered pharmacies" },
    { title: "Total Users", value: "—", icon: Users, description: "pharmacy staff accounts" },
    { title: "Medicine Database", value: "—", icon: Pill, description: "medicines catalogued" },
    { title: "Total Searches", value: "—", icon: SearchIcon, description: "user medicine searches" },
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
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Activity data will appear here</p>
              <p className="text-xs">once connected to the backend</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Pharmacies Tab ────────────────────────────────────────────────────────

function PharmaciesTab() {
  const [search, setSearch] = useState("");

  const placeholderPharmacies = [
    { id: "1", name: "HealthPlus Pharmacy", city: "Harare", suburb: "Avondale", verified: true, created_at: "2024-12-01" },
    { id: "2", name: "MediCare Pharmacy", city: "Bulawayo", suburb: "Hillside", verified: true, created_at: "2025-01-10" },
    { id: "3", name: "QuickMeds", city: "Harare", suburb: "Borrowdale", verified: false, created_at: "2025-02-05" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pharmacies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Register Pharmacy
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pharmacy Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholderPharmacies.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {p.suburb}, {p.city}
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
                <TableCell className="text-muted-foreground text-sm">{p.created_at}</TableCell>
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
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");

  const placeholderUsers = [
    { id: "1", name: "John Moyo", email: "john@healthplus.co.zw", pharmacy: "HealthPlus Pharmacy", role: "pharmacy_admin", active: true },
    { id: "2", name: "Sarah Ncube", email: "sarah@medicare.co.zw", pharmacy: "MediCare Pharmacy", role: "pharmacy_staff", active: true },
    { id: "3", name: "Admin User", email: "admin@rerunhealth.co.zw", pharmacy: "—", role: "admin", active: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
            {placeholderUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.pharmacy}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {u.role.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={u.active ? "text-primary border-primary/30" : "text-destructive border-destructive/30"}>
                    {u.active ? "Active" : "Inactive"}
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
    </div>
  );
}

// ── Medicines Tab ─────────────────────────────────────────────────────────

function MedicinesTab() {
  const [search, setSearch] = useState("");

  const placeholderMedicines = [
    { id: "1", name: "Paracetamol 500mg", category: "Pain Relief", dosage_form: "Tablet", prescription: false },
    { id: "2", name: "Amoxicillin 250mg", category: "Antibiotics", dosage_form: "Capsule", prescription: true },
    { id: "3", name: "Metformin 500mg", category: "Diabetes", dosage_form: "Tablet", prescription: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Medicine
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Prescription</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholderMedicines.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.category}</TableCell>
                <TableCell className="text-muted-foreground">{m.dosage_form}</TableCell>
                <TableCell>
                  <Badge variant={m.prescription ? "destructive" : "secondary"} className="text-xs">
                    {m.prescription ? "Required" : "OTC"}
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
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Pharmacies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">updated inventory this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Search Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">medicine searches this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">—</div>
            <p className="text-xs text-muted-foreground mt-1">pharmacies this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Trends</CardTitle>
          <CardDescription>Most searched medicines across all pharmacies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Trend data will appear here</p>
            <p className="text-xs">once connected to the backend</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────

function SettingsTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Settings</CardTitle>
          <CardDescription>Configure system-wide options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <Input defaultValue="RERUN Health AI" className="mt-1.5" />
          </div>
          <div>
            <Label>Support Email</Label>
            <Input defaultValue="support@rerunhealth.co.zw" className="mt-1.5" />
          </div>
          <div>
            <Label>Default Currency</Label>
            <Input defaultValue="USD" className="mt-1.5" />
          </div>
          <Button className="gap-1.5">
            <Settings className="h-4 w-4" /> Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Account</CardTitle>
          <CardDescription>Manage your admin profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Change Password</Label>
            <Input type="password" placeholder="Current password" className="mt-1.5" />
          </div>
          <div>
            <Input type="password" placeholder="New password" />
          </div>
          <div>
            <Input type="password" placeholder="Confirm new password" />
          </div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;

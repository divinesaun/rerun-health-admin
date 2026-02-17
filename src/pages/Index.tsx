import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar, MobileSidebar } from "@/components/AppSidebar";
import QuickAddForm from "@/components/QuickAddForm";
import BulkUpload from "@/components/BulkUpload";
import InventoryTable from "@/components/InventoryTable";
import AnalyticsTab from "@/components/AnalyticsTab";
import AlertsTab from "@/components/AlertsTab";
import { Medicine, TabType } from "@/types/pharmacy";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  Settings,
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Plus,
  Save,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  inventoryApi,
  profileApi,
  authApi,
  type InventoryItem,
  type PharmacyProfile,
} from "@/lib/api";

function inventoryToMedicine(item: InventoryItem): Medicine {
  return {
    id: item.id,
    name: item.medicines?.name ?? "Unknown",
    genericName: item.medicines?.dosage_forms ?? undefined,
    price: item.price,
    inStock: item.in_stock,
    quantity: item.quantity_available ?? "0",
    searches: item.times_searched ?? 0,
    updatedAt: new Date(item.last_updated),
  };
}

const Index = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacy, setPharmacy] = useState<PharmacyProfile | null>(null);
  const [tab, setTab] = useState<TabType>("inventory");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout: authLogout, user, setToken } = useAuth();

  // ── Fetch data on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [invRes, profileRes] = await Promise.all([
          inventoryApi.list(),
          profileApi.get(),
        ]);
        if (invRes.inventory) {
          setMedicines(invRes.inventory.map(inventoryToMedicine));
        }
        if (profileRes.pharmacy) {
          setPharmacy(profileRes.pharmacy);
        }
      } catch {
        // Backend may be down — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pharmacyName = pharmacy
    ? `${pharmacy.name}${pharmacy.suburb ? ` · ${pharmacy.suburb}` : ""}`
    : "Your Pharmacy";

  const outOfStockCount = medicines.filter((m) => !m.inStock).length;
  const inStockCount = medicines.filter((m) => m.inStock).length;

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleAdd = useCallback(async (data: Omit<Medicine, "id" | "searches" | "updatedAt">) => {
    try {
      const searchRes = await inventoryApi.searchMedicines(data.name);
      const match = searchRes.medicines?.[0];
      if (match) {
        const res = await inventoryApi.add({
          medicine_id: match.id,
          price: data.price,
          in_stock: data.inStock,
          quantity_available: data.quantity,
        });
        const newMed: Medicine = {
          id: res.item.id,
          name: match.name,
          genericName: match.generic_name ?? undefined,
          price: data.price,
          inStock: data.inStock,
          quantity: data.quantity,
          searches: 0,
          updatedAt: new Date(),
        };
        setMedicines((prev) => [newMed, ...prev]);
        toast({ title: "Medicine added", description: `${data.name} has been added to inventory.` });
      } else {
        toast({ title: "Not found", description: `${data.name} was not found in the master database.`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add medicine. Try again.", variant: "destructive" });
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m))
    );
    try {
      await inventoryApi.update(id, {
        price: updates.price,
        in_stock: updates.inStock,
        quantity_available: updates.quantity,
      });
    } catch {
      // Optimistic update
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Medicine removed", description: "Item has been removed from inventory." });
    try {
      await inventoryApi.delete(id);
    } catch {
      // Optimistic delete
    }
  }, []);

  const handleRestock = useCallback((id: string) => {
    handleUpdate(id, { inStock: true, quantity: "10+" });
    toast({ title: "Restocked", description: "Medicine has been marked as in stock." });
  }, [handleUpdate]);

  const handleLogout = () => {
    authLogout();
    navigate("/login");
  };

  const handleExportCSV = () => {
    if (!medicines.length) return;
    const header = "medicine_name,price,in_stock,quantity_available";
    const rows = medicines.map((m) => `${m.name},${m.price.toFixed(2)},${m.inStock},${m.quantity}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${medicines.length} medicines exported to CSV.` });
  };

  const [inventorySubTab, setInventorySubTab] = useState<string>("overview");

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "PH";

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        activeTab={tab}
        onTabChange={setTab}
        onLogout={handleLogout}
        pharmacyName={pharmacy?.name}
        userEmail={user?.email}
        alertCount={outOfStockCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:h-16 md:px-6">
          <MobileSidebar
            activeTab={tab}
            onTabChange={setTab}
            onLogout={handleLogout}
            pharmacyName={pharmacy?.name}
            userEmail={user?.email}
            alertCount={outOfStockCount}
          />
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTab("settings")}>
            <Settings className="h-4 w-4" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          {/* Page title */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {tab === "inventory" && "Inventory"}
                {tab === "analytics" && "Analytics"}
                {tab === "alerts" && "Alerts"}
                {tab === "settings" && "Settings"}
              </h1>
              <p className="text-sm text-muted-foreground">{pharmacyName}</p>
            </div>
            {tab === "inventory" && medicines.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading your dashboard...</p>
            </div>
          )}

          {/* Tab content */}
          {!loading && tab === "inventory" && (
            <>
              {medicines.length === 0 ? (
                <EmptyInventory onManage={() => setInventorySubTab("manage")} />
              ) : (
                <div>
                  {/* Summary cards */}
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Medicines</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{medicines.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">in your inventory</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{inStockCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {medicines.length > 0
                            ? `${Math.round((inStockCount / medicines.length) * 100)}% available`
                            : "—"}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{outOfStockCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {outOfStockCount > 0 ? "needs attention" : "all stocked"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Tabs value={inventorySubTab} onValueChange={setInventorySubTab}>
                    <TabsList className="h-10 w-auto">
                      <TabsTrigger value="overview">Inventory</TabsTrigger>
                      <TabsTrigger value="manage">Add / Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
                    </TabsContent>

                    <TabsContent value="manage" className="mt-6">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <QuickAddForm onAdd={handleAdd} />
                        <BulkUpload />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
          )}

          {!loading && tab === "analytics" && <AnalyticsTab medicines={medicines} />}

          {!loading && tab === "alerts" && <AlertsTab medicines={medicines} onRestock={handleRestock} />}

          {!loading && tab === "settings" && (
            <SettingsPanel pharmacy={pharmacy} setPharmacy={setPharmacy} user={user} setToken={setToken} />
          )}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          <p>RERUN Health — Connecting Zimbabweans to Medicine</p>
        </footer>
      </div>
    </div>
  );
};

// ── Empty Inventory Onboarding ───────────────────────────────────────────
function EmptyInventory({ onManage }: { onManage: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Package className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">No medicines yet</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Add your first medicine to start showing up in customer searches.
        You can add one at a time or upload your full inventory via CSV.
      </p>
      <div className="flex gap-3">
        <Button onClick={onManage} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
        <Button variant="outline" onClick={onManage} className="gap-1.5">
          <Download className="h-4 w-4" />
          Upload CSV
        </Button>
      </div>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────
function SettingsPanel({
  pharmacy,
  setPharmacy,
  user,
  setToken,
}: {
  pharmacy: PharmacyProfile | null;
  setPharmacy: (p: PharmacyProfile) => void;
  user: { id: string; email: string; name: string | null; pharmacy_id: string; role: string } | null;
  setToken: (t: string) => void;
}) {
  // Profile form
  const [name, setName] = useState(pharmacy?.name ?? "");
  const [address, setAddress] = useState(pharmacy?.address ?? "");
  const [suburb, setSuburb] = useState(pharmacy?.suburb ?? "");
  const [phone, setPhone] = useState(pharmacy?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(pharmacy?.whatsapp_number ?? "");
  const [hours, setHours] = useState(pharmacy?.opening_hours ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (pharmacy) {
      setName(pharmacy.name);
      setAddress(pharmacy.address);
      setSuburb(pharmacy.suburb ?? "");
      setPhone(pharmacy.phone ?? "");
      setWhatsapp(pharmacy.whatsapp_number ?? "");
      setHours(pharmacy.opening_hours ?? "");
    }
  }, [pharmacy]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await profileApi.update({
        name: name || undefined,
        address: address || undefined,
        suburb: suburb || undefined,
        phone: phone || undefined,
        whatsapp_number: whatsapp || undefined,
        opening_hours: hours || undefined,
      });
      setPharmacy(res.pharmacy);
      toast({ title: "Profile updated", description: "Your pharmacy details have been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!curPass || !newPass || !confirmPass) {
      toast({ title: "Error", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (newPass !== confirmPass) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPass.length < 8 || !/\d/.test(newPass)) {
      toast({ title: "Error", description: "Password must be 8+ chars with a number.", variant: "destructive" });
      return;
    }
    setSavingPass(true);
    try {
      const res = await authApi.changePassword({
        current_password: curPass,
        new_password: newPass,
        confirm_new_password: confirmPass,
      });
      setToken(res.access_token);
      setCurPass("");
      setNewPass("");
      setConfirmPass("");
      toast({ title: "Password changed", description: "Your password has been updated." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Pharmacy Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pharmacy Profile</CardTitle>
          <CardDescription>Update your pharmacy details visible to customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pharmacy Name</Label>
            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Suburb</Label>
              <Input className="mt-1.5" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263..." />
            </div>
          </div>
          <div>
            <Label>WhatsApp Number</Label>
            <Input className="mt-1.5" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+263..." />
          </div>
          <div>
            <Label>Opening Hours</Label>
            <Input className="mt-1.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon-Fri 8am-6pm, Sat 8am-1pm" />
          </div>
          {pharmacy?.verified && (
            <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
          )}
          <Button className="w-full gap-1.5" onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account & Security */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Your login details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{user?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role ?? "manager"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input className="mt-1.5" type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input className="mt-1.5" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 8 chars, include a number" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input className="mt-1.5" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
            </div>
            <Button variant="outline" className="w-full gap-1.5" onClick={handleChangePassword} disabled={savingPass}>
              {savingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {savingPass ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Index;

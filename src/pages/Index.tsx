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
import { Medicine, TabType } from "@/types/pharmacy";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Plus,
  Save,
  KeyRound,
  Upload,
  Globe,
  MapPin,
  Star,
  Search,
  MessageSquare,
  BookOpen,
  FileText,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { OpeningHoursPicker } from "@/components/OpeningHoursPicker";
import { WhatsAppInput } from "@/components/WhatsAppInput";
import { useAuth } from "@/contexts/AuthContext";
import {
  inventoryApi,
  profileApi,
  authApi,
  analyticsApi,
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
  const [tab, setTab] = useState<TabType>("dashboard");
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
  const handleAdd = useCallback(async (data: Omit<Medicine, "id" | "searches" | "updatedAt">, medicineId?: string) => {
    try {
      let medId = medicineId;
      if (!medId) {
        const searchRes = await inventoryApi.searchMedicines(data.name);
        const match = searchRes.medicines?.[0];
        if (!match) {
          toast({ title: "Not found", description: `${data.name} was not found in the master database.`, variant: "destructive" });
          return;
        }
        medId = match.id;
      }
      const res = await inventoryApi.add({
        medicine_id: medId,
        price: data.price,
        in_stock: data.inStock,
        quantity_available: data.quantity,
      });
      const newMed: Medicine = {
        id: res.item.id,
        name: data.name,
        genericName: data.genericName,
        price: data.price,
        inStock: data.inStock,
        quantity: data.quantity,
        searches: 0,
        updatedAt: new Date(),
      };
      setMedicines((prev) => [newMed, ...prev]);
      toast({ title: "Medicine added", description: `${data.name} has been added to inventory.` });
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

  const PAGE_TITLES: Record<TabType, string> = {
    dashboard: "Dashboard",
    inventory: "Inventory",
    profile: "Profile & Settings",
    analytics: "Analytics",
    inquiries: "Customer Inquiries",
    account: "Account",
    help: "Help & Support",
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <AppSidebar
        activeTab={tab}
        onTabChange={setTab}
        onLogout={handleLogout}
        pharmacyName={pharmacy?.name}
        userEmail={user?.email}
        alertCount={outOfStockCount}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:h-16 md:px-6 shrink-0">
          <MobileSidebar
            activeTab={tab}
            onTabChange={setTab}
            onLogout={handleLogout}
            pharmacyName={pharmacy?.name}
            userEmail={user?.email}
            alertCount={outOfStockCount}
          />
          <div className="flex-1" />
          <p className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]">{pharmacyName}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0">
            {initials}
          </div>
        </header>

        {/* Main content — scrollable */}
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading your dashboard...</p>
            </div>
          )}

          {/* ── Dashboard Home ── */}
          {!loading && tab === "dashboard" && (
            <DashboardHome
              medicines={medicines}
              pharmacy={pharmacy}
              inStockCount={inStockCount}
              outOfStockCount={outOfStockCount}
              onNavigate={setTab}
              onRestock={handleRestock}
            />
          )}

          {/* ── Inventory ── */}
          {!loading && tab === "inventory" && (
            <>
              {medicines.length === 0 && inventorySubTab !== "manage" ? (
                <EmptyInventory onManage={() => setInventorySubTab("manage")} />
              ) : (
                <div>
                  {medicines.length > 0 && (
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
                            {medicines.length > 0 ? `${Math.round((inStockCount / medicines.length) * 100)}% available` : "—"}
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
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <Tabs value={inventorySubTab} onValueChange={setInventorySubTab} className="w-auto">
                      <TabsList className="h-10">
                        <TabsTrigger value="overview">Inventory</TabsTrigger>
                        <TabsTrigger value="manage">Add / Upload</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {inventorySubTab === "overview" && medicines.length > 0 && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    )}
                  </div>

                  {inventorySubTab === "overview" && (
                    medicines.length === 0 ? (
                      <EmptyInventory onManage={() => setInventorySubTab("manage")} />
                    ) : (
                      <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
                    )
                  )}

                  {inventorySubTab === "manage" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <QuickAddForm onAdd={handleAdd} />
                      <BulkUpload />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Profile & Settings ── */}
          {!loading && tab === "profile" && (
            <ProfilePanel pharmacy={pharmacy} setPharmacy={setPharmacy} />
          )}

          {/* ── Analytics ── */}
          {!loading && tab === "analytics" && <AnalyticsTab medicines={medicines} />}

          {/* ── Customer Inquiries ── */}
          {!loading && tab === "inquiries" && <InquiriesPanel />}

          {/* ── Account ── */}
          {!loading && tab === "account" && (
            <AccountPanel user={user} setToken={setToken} />
          )}

          {/* ── Help & Support ── */}
          {!loading && tab === "help" && <HelpPanel />}
        </main>
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
      <div className="flex flex-wrap gap-3">
        <Button onClick={onManage} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
        <Button variant="outline" onClick={onManage} className="gap-1.5">
          <Upload className="h-4 w-4" />
          Upload CSV
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
          const csv = "medicine_name,price,in_stock,quantity_available\nParacetamol 500mg,1.50,true,In Stock\nAmoxicillin 250mg,5.00,false,0";
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "inventory_template.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>
    </div>
  );
}

// ── Dashboard Home ────────────────────────────────────────────────────────
function DashboardHome({
  medicines,
  pharmacy,
  inStockCount,
  outOfStockCount,
  onNavigate,
  onRestock,
}: {
  medicines: Medicine[];
  pharmacy: PharmacyProfile | null;
  inStockCount: number;
  outOfStockCount: number;
  onNavigate: (tab: TabType) => void;
  onRestock: (id: string) => void;
}) {
  const totalSearches = medicines.reduce((s, m) => s + m.searches, 0);
  const topMedicines = [...medicines].sort((a, b) => b.searches - a.searches).slice(0, 5);
  const lowStock = medicines.filter((m) => !m.inStock).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Highlight cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("inventory")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medicines</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medicines.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{inStockCount} in stock</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("analytics")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacy?.total_searches ?? totalSearches}</div>
            <p className="text-xs text-muted-foreground mt-1">across inventory</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("inquiries")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacy?.total_inquiries ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">customer contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pharmacy?.rating ?? "—"}</div>
            <p className="text-xs text-muted-foreground mt-1">{pharmacy?.total_reviews ?? 0} reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks for your pharmacy</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("inventory")}>
            <Plus className="h-4 w-4" /> Add Medicine
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("inventory")}>
            <Upload className="h-4 w-4" /> Bulk Upload CSV
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("profile")}>
            <Star className="h-4 w-4" /> Update Profile
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate("inquiries")}>
            <MessageSquare className="h-4 w-4" /> View Inquiries
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most searched */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Searched</CardTitle>
            <CardDescription>Top medicines by customer searches</CardDescription>
          </CardHeader>
          <CardContent>
            {topMedicines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No search data yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {topMedicines.map((m, i) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                      <span className="font-medium text-foreground">{m.name}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={m.inStock ? "default" : "destructive"} className="text-xs">{m.inStock ? "In Stock" : "Out"}</Badge>
                      <span className="text-muted-foreground">{m.searches} searches</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Stock alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Stock Alerts</CardTitle>
                <CardDescription>Items that need attention</CardDescription>
              </div>
              {outOfStockCount > 0 && (
                <Badge variant="destructive">{outOfStockCount} out of stock</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">All stock levels look good!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map((m) => (
                  <div key={m.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Out of Stock · {m.searches} searches recently</p>
                    </div>
                    <Button size="sm" variant="outline" className="self-start" onClick={() => onRestock(m.id)}>
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Profile & Settings Panel ──────────────────────────────────────────────
function ProfilePanel({
  pharmacy,
  setPharmacy,
}: {
  pharmacy: PharmacyProfile | null;
  setPharmacy: (p: PharmacyProfile) => void;
}) {
  const [name, setName] = useState(pharmacy?.name ?? "");
  const [address, setAddress] = useState(pharmacy?.address ?? "");
  const [suburb, setSuburb] = useState(pharmacy?.suburb ?? "");
  const [city, setCity] = useState(pharmacy?.city ?? "");
  const [phone, setPhone] = useState(pharmacy?.phone ?? "");
  const [pharmacyEmail, setPharmacyEmail] = useState(pharmacy?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(pharmacy?.whatsapp_number ?? "");
  const [hours, setHours] = useState(() => {
    const oh = pharmacy?.opening_hours;
    if (!oh) return "";
    if (typeof oh === "object") return JSON.stringify(oh);
    return String(oh);
  });
  const [chainName, setChainName] = useState(pharmacy?.chain_name ?? "");
  const [latitude, setLatitude] = useState(pharmacy?.latitude ?? "");
  const [longitude, setLongitude] = useState(pharmacy?.longitude ?? "");
  const [acceptsMedicalAid, setAcceptsMedicalAid] = useState(pharmacy?.accepts_medical_aid ?? false);
  const [hasDelivery, setHasDelivery] = useState(pharmacy?.has_delivery ?? false);
  const [is24Hours, setIs24Hours] = useState(pharmacy?.is_24_hours ?? false);
  const [parkingAvailable, setParkingAvailable] = useState(pharmacy?.parking_available ?? false);
  const [specialServices, setSpecialServices] = useState(pharmacy?.special_services ?? "");
  const [website, setWebsite] = useState(pharmacy?.website ?? "");
  const [facebook, setFacebook] = useState(pharmacy?.facebook ?? "");
  const [instagram, setInstagram] = useState(pharmacy?.instagram ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (pharmacy) {
      setName(pharmacy.name);
      setAddress(pharmacy.address);
      setSuburb(pharmacy.suburb ?? "");
      setCity(pharmacy.city ?? "");
      setPhone(pharmacy.phone ?? "");
      setPharmacyEmail(pharmacy.email ?? "");
      setWhatsapp(pharmacy.whatsapp_number ?? "");
      setHours(pharmacy.opening_hours ? (typeof pharmacy.opening_hours === "object" ? JSON.stringify(pharmacy.opening_hours) : String(pharmacy.opening_hours)) : "");
      setChainName(pharmacy.chain_name ?? "");
      setLatitude(pharmacy.latitude ?? "");
      setLongitude(pharmacy.longitude ?? "");
      setAcceptsMedicalAid(pharmacy.accepts_medical_aid ?? false);
      setHasDelivery(pharmacy.has_delivery ?? false);
      setIs24Hours(pharmacy.is_24_hours ?? false);
      setParkingAvailable(pharmacy.parking_available ?? false);
      setSpecialServices(pharmacy.special_services ?? "");
      setWebsite(pharmacy.website ?? "");
      setFacebook(pharmacy.facebook ?? "");
      setInstagram(pharmacy.instagram ?? "");
    }
  }, [pharmacy]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await profileApi.update({
        name: name || undefined, address: address || undefined, suburb: suburb || undefined,
        city: city || undefined, phone: phone || undefined, email: pharmacyEmail || undefined,
        whatsapp_number: whatsapp || undefined, opening_hours: hours || undefined,
        chain_name: chainName || undefined, latitude: latitude || undefined, longitude: longitude || undefined,
        accepts_medical_aid: acceptsMedicalAid, has_delivery: hasDelivery, is_24_hours: is24Hours,
        parking_available: parkingAvailable, special_services: specialServices || undefined,
        website: website || undefined, facebook: facebook || undefined, instagram: instagram || undefined,
      });
      setPharmacy(res.pharmacy);
      toast({ title: "Profile updated", description: "Your pharmacy details have been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      {/* Overview badges */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            {pharmacy?.verified ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{pharmacy?.verified ? "Verified" : "Not Verified"}</p>
              <p className="text-xs text-muted-foreground">Since {fmtDate(pharmacy?.created_at)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <Star className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">{pharmacy?.rating ?? "0.00"}</p>
              <p className="text-xs text-muted-foreground">{pharmacy?.total_reviews ?? 0} reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <Search className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">{pharmacy?.total_searches ?? 0}</p>
              <p className="text-xs text-muted-foreground">Searches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <MessageSquare className="h-5 w-5 text-violet-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">{pharmacy?.total_inquiries ?? 0}</p>
              <p className="text-xs text-muted-foreground">Inquiries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
            <CardDescription>Name, location, and identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Pharmacy Name</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Chain / Group Name</Label><Input className="mt-1.5" value={chainName} onChange={(e) => setChainName(e.target.value)} placeholder="e.g. Pick n Pay Pharmacy" /></div>
            <div><Label>Address</Label><Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Suburb</Label><Input className="mt-1.5" value={suburb} onChange={(e) => setSuburb(e.target.value)} /></div>
              <div><Label>City</Label><Input className="mt-1.5" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Harare" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
            <CardDescription>How customers can reach your pharmacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Phone</Label><div className="mt-1.5"><WhatsAppInput value={phone} onChange={setPhone} placeholder="77 123 4567" /></div></div>
            <div><Label>WhatsApp Number</Label><div className="mt-1.5"><WhatsAppInput value={whatsapp} onChange={setWhatsapp} placeholder="77 123 4567" /></div></div>
            <div><Label>Email</Label><Input className="mt-1.5" type="email" value={pharmacyEmail} onChange={(e) => setPharmacyEmail(e.target.value)} placeholder="info@pharmacy.co.zw" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Hours & Location */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Opening Hours</CardTitle>
            <CardDescription>Tap a day to toggle open/closed, then set times</CardDescription>
          </CardHeader>
          <CardContent>
            <OpeningHoursPicker value={hours} onChange={setHours} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Map Coordinates</CardTitle>
            <CardDescription>Used to show your pharmacy on the map and calculate distance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Latitude</Label><Input className="mt-1.5" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-17.8252" /></div>
              <div><Label>Longitude</Label><Input className="mt-1.5" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="31.0522" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What You Offer</CardTitle>
            <CardDescription>Helps customers find the right pharmacy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Accepts Medical Aid", sub: "Medical aid / insurance payments", val: acceptsMedicalAid, set: setAcceptsMedicalAid },
              { label: "Delivery Service", sub: "Deliver medicines to customers", val: hasDelivery, set: setHasDelivery },
              { label: "Open 24 Hours", sub: "Operates around the clock", val: is24Hours, set: setIs24Hours },
              { label: "Parking Available", sub: "On-site or nearby parking", val: parkingAvailable, set: setParkingAvailable },
            ].map((s, i) => (
              <div key={i}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-3">
                  <div><p className="text-sm font-medium">{s.label}</p><p className="text-xs text-muted-foreground">{s.sub}</p></div>
                  <Switch checked={s.val} onCheckedChange={s.set} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Special Services</CardTitle>
              <CardDescription>Additional services your pharmacy offers</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea value={specialServices} onChange={(e) => setSpecialServices(e.target.value)} placeholder="e.g. Blood pressure testing, vaccinations, compounding, diabetic care..." rows={4} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Online Presence</CardTitle>
              <CardDescription>Website and social media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Website</Label><Input className="mt-1.5" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.pharmacy.co.zw" /></div>
              <div><Label>Facebook</Label><Input className="mt-1.5" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/yourpharmacy" /></div>
              <div><Label>Instagram</Label><Input className="mt-1.5" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/yourpharmacy" /></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="lg" className="gap-2" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {savingProfile ? "Saving..." : "Save Pharmacy Profile"}
        </Button>
      </div>
    </div>
  );
}

// ── Inquiries Panel ───────────────────────────────────────────────────────
function InquiriesPanel() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState<{ id?: string; message?: string; created_at?: string }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.inquiries();
        setInquiries((res.inquiries ?? []) as typeof inquiries);
      } catch { /* no data yet */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-sm">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.filter((i) => {
              if (!i.created_at) return false;
              const d = new Date(i.created_at);
              const now = new Date();
              return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
            }).length}</div>
            <p className="text-xs text-muted-foreground mt-1">last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.filter((i) => {
              if (!i.created_at) return false;
              return new Date(i.created_at).toDateString() === new Date().toDateString();
            }).length}</div>
            <p className="text-xs text-muted-foreground mt-1">so far today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Inquiries</CardTitle>
          <CardDescription>Customer contacts about your pharmacy</CardDescription>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No inquiries yet</p>
              <p className="text-xs mt-1">Customers will appear here when they contact your pharmacy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.slice(0, 20).map((inq, i) => (
                <div key={inq.id ?? i} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inq.message ?? "Customer inquiry"}</p>
                    {inq.created_at && <p className="text-xs text-muted-foreground mt-0.5">{new Date(inq.created_at).toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Account Panel ─────────────────────────────────────────────────────────
function AccountPanel({
  user,
  setToken,
}: {
  user: { id: string; email: string; name: string | null; pharmacy_id: string; role: string } | null;
  setToken: (t: string) => void;
}) {
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

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
        current_password: curPass, new_password: newPass, confirm_new_password: confirmPass,
      });
      if ((res as any).access_token) setToken((res as any).access_token);
      setCurPass(""); setNewPass(""); setConfirmPass("");
      toast({ title: "Password changed", description: "Your password has been updated." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Profile</CardTitle>
            <CardDescription>Your personal login and role information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Login Email</span>
              <span className="text-sm font-medium">{user?.email ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{user?.name ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role ?? "manager"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</CardTitle>
            <CardDescription>Update your login password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Current Password</Label><Input className="mt-1.5" type="password" autoComplete="off" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="Enter current password" /></div>
            <div><Label>New Password</Label><Input className="mt-1.5" type="password" autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 8 chars, include a number" /></div>
            <div><Label>Confirm New Password</Label><Input className="mt-1.5" type="password" autoComplete="new-password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Re-enter new password" /></div>
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

// ── Help & Support Panel ──────────────────────────────────────────────────
function HelpPanel() {
  const guides = [
    { icon: Plus, title: "Add your first medicine", desc: "Search the master list, set price & stock status, and add to inventory." },
    { icon: Upload, title: "Bulk upload inventory (CSV)", desc: "Download the template, fill in your medicines, upload and review before confirming." },
    { icon: Star, title: "Update your profile", desc: "Set opening hours, contact details, services, and location to appear in search." },
    { icon: MessageSquare, title: "Respond to inquiries", desc: "View customer contacts in the Inquiries tab and follow up." },
  ];

  const faqs = [
    { q: "How does RERUN Health work?", a: "Customers search for medicines via WhatsApp. We show them pharmacies with stock, prices, and location." },
    { q: "How do customers find my pharmacy?", a: "By searching for medicines you have in stock. Complete your profile to rank higher in results." },
    { q: "What if a medicine is out of stock?", a: "Mark it as out of stock in your inventory. It will still show in results but ranked lower." },
    { q: "How to improve my ranking?", a: "Keep inventory updated, set competitive prices, add opening hours, and get good customer ratings." },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Getting Started</CardTitle>
          <CardDescription>Follow these steps to set up your pharmacy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {guides.map((g, i) => (
              <div key={i} className="flex gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <g.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {faqs.map((f, i) => (
            <div key={i}>
              {i > 0 && <Separator />}
              <div className="py-3">
                <p className="text-sm font-medium">{f.q}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.a}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Support</CardTitle>
          <CardDescription>Get help from the RERUN Health team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href="mailto:support@rerun.health" className="text-primary hover:underline">support@rerun.health</a>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reply to any system email for support</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Index;

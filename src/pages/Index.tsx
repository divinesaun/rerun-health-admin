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
  Upload,
  Globe,
  MapPin,
  Star,
  Search,
  MessageSquare,
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
              {medicines.length === 0 && inventorySubTab !== "manage" ? (
                <EmptyInventory onManage={() => setInventorySubTab("manage")} />
              ) : (
                <div>
                  {/* Summary cards */}
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
                  )}

                  <Tabs value={inventorySubTab} onValueChange={setInventorySubTab}>
                    <TabsList className="h-10 w-auto">
                      <TabsTrigger value="overview">Inventory</TabsTrigger>
                      <TabsTrigger value="manage">Add / Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      {medicines.length === 0 ? (
                        <EmptyInventory onManage={() => setInventorySubTab("manage")} />
                      ) : (
                        <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
                      )}
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
  // Basic details
  const [name, setName] = useState(pharmacy?.name ?? "");
  const [address, setAddress] = useState(pharmacy?.address ?? "");
  const [suburb, setSuburb] = useState(pharmacy?.suburb ?? "");
  const [city, setCity] = useState(pharmacy?.city ?? "");
  const [phone, setPhone] = useState(pharmacy?.phone ?? "");
  const [pharmacyEmail, setPharmacyEmail] = useState(pharmacy?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(pharmacy?.whatsapp_number ?? "");
  const [hours, setHours] = useState(pharmacy?.opening_hours ?? "");
  const [chainName, setChainName] = useState(pharmacy?.chain_name ?? "");

  // Location
  const [latitude, setLatitude] = useState(pharmacy?.latitude ?? "");
  const [longitude, setLongitude] = useState(pharmacy?.longitude ?? "");

  // Services & features
  const [acceptsMedicalAid, setAcceptsMedicalAid] = useState(pharmacy?.accepts_medical_aid ?? false);
  const [hasDelivery, setHasDelivery] = useState(pharmacy?.has_delivery ?? false);
  const [is24Hours, setIs24Hours] = useState(pharmacy?.is_24_hours ?? false);
  const [parkingAvailable, setParkingAvailable] = useState(pharmacy?.parking_available ?? false);
  const [specialServices, setSpecialServices] = useState(pharmacy?.special_services ?? "");

  // Online presence
  const [website, setWebsite] = useState(pharmacy?.website ?? "");
  const [facebook, setFacebook] = useState(pharmacy?.facebook ?? "");
  const [instagram, setInstagram] = useState(pharmacy?.instagram ?? "");

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
      setCity(pharmacy.city ?? "");
      setPhone(pharmacy.phone ?? "");
      setPharmacyEmail(pharmacy.email ?? "");
      setWhatsapp(pharmacy.whatsapp_number ?? "");
      setHours(pharmacy.opening_hours ?? "");
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
        name: name || undefined,
        address: address || undefined,
        suburb: suburb || undefined,
        city: city || undefined,
        phone: phone || undefined,
        email: pharmacyEmail || undefined,
        whatsapp_number: whatsapp || undefined,
        opening_hours: hours || undefined,
        chain_name: chainName || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        accepts_medical_aid: acceptsMedicalAid,
        has_delivery: hasDelivery,
        is_24_hours: is24Hours,
        parking_available: parkingAvailable,
        special_services: specialServices || undefined,
        website: website || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
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
      if ((res as any).access_token) {
        setToken((res as any).access_token);
      }
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

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="space-y-8">
      {/* ── Section: Overview ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Overview</h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              {pharmacy?.verified ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              )}
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
      </section>

      {/* ── Section: Pharmacy Profile ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pharmacy Profile</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>Name, location, and contact details shown to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pharmacy Name</Label>
                <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Chain / Group Name</Label>
                <Input className="mt-1.5" value={chainName} onChange={(e) => setChainName(e.target.value)} placeholder="e.g. Pick n Pay Pharmacy" />
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
                  <Label>City</Label>
                  <Input className="mt-1.5" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Harare" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Details</CardTitle>
              <CardDescription>How customers can reach your pharmacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone</Label>
                <div className="mt-1.5">
                  <WhatsAppInput value={phone} onChange={setPhone} placeholder="77 123 4567" />
                </div>
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <div className="mt-1.5">
                  <WhatsAppInput value={whatsapp} onChange={setWhatsapp} placeholder="77 123 4567" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" type="email" value={pharmacyEmail} onChange={(e) => setPharmacyEmail(e.target.value)} placeholder="info@pharmacy.co.zw" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section: Hours & Location ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Hours & Location</h3>
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
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Map Coordinates
              </CardTitle>
              <CardDescription>Used to show your pharmacy on the map and calculate distance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Latitude</Label>
                  <Input className="mt-1.5" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-17.8252" />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input className="mt-1.5" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="31.0522" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Section: Services & Features ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Services & Features</h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What You Offer</CardTitle>
              <CardDescription>Helps customers find the right pharmacy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Accepts Medical Aid</p>
                  <p className="text-xs text-muted-foreground">Medical aid / insurance payments</p>
                </div>
                <Switch checked={acceptsMedicalAid} onCheckedChange={setAcceptsMedicalAid} />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Delivery Service</p>
                  <p className="text-xs text-muted-foreground">Deliver medicines to customers</p>
                </div>
                <Switch checked={hasDelivery} onCheckedChange={setHasDelivery} />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Open 24 Hours</p>
                  <p className="text-xs text-muted-foreground">Operates around the clock</p>
                </div>
                <Switch checked={is24Hours} onCheckedChange={setIs24Hours} />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Parking Available</p>
                  <p className="text-xs text-muted-foreground">On-site or nearby parking</p>
                </div>
                <Switch checked={parkingAvailable} onCheckedChange={setParkingAvailable} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Special Services</CardTitle>
                <CardDescription>Additional services your pharmacy offers</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={specialServices}
                  onChange={(e) => setSpecialServices(e.target.value)}
                  placeholder="e.g. Blood pressure testing, vaccinations, compounding, diabetic care..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Online Presence
                </CardTitle>
                <CardDescription>Website and social media links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Website</Label>
                  <Input className="mt-1.5" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.pharmacy.co.zw" />
                </div>
                <div>
                  <Label>Facebook</Label>
                  <Input className="mt-1.5" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/yourpharmacy" />
                </div>
                <div>
                  <Label>Instagram</Label>
                  <Input className="mt-1.5" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/yourpharmacy" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Save Pharmacy Profile */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2" onClick={handleSaveProfile} disabled={savingProfile}>
          {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {savingProfile ? "Saving..." : "Save Pharmacy Profile"}
        </Button>
      </div>

      <Separator />

      {/* ── Section: User Account ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">User Account</h3>
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
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Change Password
              </CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete="off"
                  value={curPass}
                  onChange={(e) => setCurPass(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 8 chars, include a number"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  className="mt-1.5"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              <Button variant="outline" className="w-full gap-1.5" onClick={handleChangePassword} disabled={savingPass}>
                {savingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {savingPass ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default Index;

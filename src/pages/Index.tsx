import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/AppSidebar";
import MethodSelector from "@/components/MethodSelector";
import QuickAddForm from "@/components/QuickAddForm";
import BulkUpload from "@/components/BulkUpload";
import InventoryTable from "@/components/InventoryTable";
import AnalyticsTab from "@/components/AnalyticsTab";
import AlertsTab from "@/components/AlertsTab";
import { Medicine, TabType } from "@/types/pharmacy";
import { INITIAL_MEDICINES } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { Download, Search, Settings } from "lucide-react";

const Index = () => {
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [tab, setTab] = useState<TabType>("inventory");
  const navigate = useNavigate();

  const inStockCount = medicines.filter((m) => m.inStock).length;

  const handleAdd = useCallback((data: Omit<Medicine, "id" | "searches" | "updatedAt">) => {
    const newMed: Medicine = {
      ...data,
      id: crypto.randomUUID(),
      searches: 0,
      updatedAt: new Date(),
    };
    setMedicines((prev) => [newMed, ...prev]);
    toast({ title: "Medicine added", description: `${data.name} has been added to inventory.` });
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Medicine>) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date() } : m))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Medicine removed", description: "Item has been removed from inventory." });
  }, []);

  const handleRestock = useCallback((id: string) => {
    handleUpdate(id, { inStock: true, quantity: "10+" });
    toast({ title: "Restocked", description: "Medicine has been marked as in stock." });
  }, [handleUpdate]);

  const handleLogout = () => {
    navigate("/login");
  };

  // Sub-tabs for the inventory view (matching shadcn-admin's Overview/Analytics/Reports/Notifications)
  const inventorySubTabs = ["overview", "manage"] as const;
  const [inventorySubTab, setInventorySubTab] = useState<string>("overview");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar activeTab={tab} onTabChange={setTab} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex-1" />
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="h-9 w-[240px] pl-8 text-sm" readOnly />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTab("settings")}>
            <Settings className="h-4 w-4" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            HP
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-6 py-6">
          {/* Page title */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {tab === "inventory" && "Dashboard"}
                {tab === "analytics" && "Analytics"}
                {tab === "alerts" && "Alerts"}
                {tab === "settings" && "Settings"}
              </h1>
              <p className="text-sm text-muted-foreground">
                HealthPlus Pharmacy · Avondale, Harare 🇿🇼
              </p>
            </div>
            <Button variant="default" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Tab content */}
          {tab === "inventory" && (
            <div>
              <Tabs value={inventorySubTab} onValueChange={setInventorySubTab} className="mb-6">
                <TabsList className="h-10 w-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="manage">Manage</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    <AnalyticsTab medicines={medicines} />
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="mt-6">
                  <div className="space-y-6">
                    <MethodSelector />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <QuickAddForm onAdd={handleAdd} />
                      <BulkUpload />
                    </div>
                    <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {tab === "analytics" && <AnalyticsTab medicines={medicines} />}

          {tab === "alerts" && <AlertsTab medicines={medicines} onRestock={handleRestock} />}

          {tab === "settings" && (
            <div className="rounded-lg border bg-card p-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
              <p className="text-sm text-muted-foreground">
                Settings page coming soon. Manage your pharmacy profile, notification preferences, and account details here.
              </p>
            </div>
          )}
        </main>

        <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
          <p>🇿🇼 RERUN Health AI — Connecting Zimbabweans to Medicine</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;

import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardHeader from "@/components/DashboardHeader";
import MethodSelector from "@/components/MethodSelector";
import QuickAddForm from "@/components/QuickAddForm";
import BulkUpload from "@/components/BulkUpload";
import InventoryTable from "@/components/InventoryTable";
import AnalyticsTab from "@/components/AnalyticsTab";
import AlertsTab from "@/components/AlertsTab";
import { Medicine, TabType } from "@/types/pharmacy";
import { INITIAL_MEDICINES } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [tab, setTab] = useState<TabType>("inventory");

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        totalMedicines={medicines.length}
        inStockCount={inStockCount}
        onSettingsClick={() => setTab("settings")}
      />

      <div className="sticky top-[65px] z-40 border-b bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)}>
            <TabsList className="h-12 w-full justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="inventory" className="gap-1.5 data-[state=active]:bg-accent data-[state=active]:shadow-sm">
                📦 Inventory
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 data-[state=active]:bg-accent data-[state=active]:shadow-sm">
                📊 Analytics
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-1.5 data-[state=active]:bg-accent data-[state=active]:shadow-sm">
                🔔 Alerts
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-accent data-[state=active]:shadow-sm">
                ⚙️ Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab === "inventory" && (
          <div className="space-y-6 animate-fade-in">
            <MethodSelector />
            <div className="grid gap-6 lg:grid-cols-2">
              <QuickAddForm onAdd={handleAdd} />
              <BulkUpload />
            </div>
            <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
          </div>
        )}
        {tab === "analytics" && (
          <div className="animate-fade-in">
            <AnalyticsTab medicines={medicines} />
          </div>
        )}
        {tab === "alerts" && (
          <div className="animate-fade-in">
            <AlertsTab medicines={medicines} onRestock={handleRestock} />
          </div>
        )}
        {tab === "settings" && (
          <div className="animate-fade-in">
            <div className="rounded-xl border bg-card p-8 shadow-md">
              <h2 className="text-lg font-bold text-foreground mb-2">⚙️ Settings</h2>
              <p className="text-muted-foreground text-sm">Settings page coming soon. Manage your pharmacy profile, notification preferences, and account details here.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>🇿🇼 RERUN Health AI — Connecting Zimbabweans to Medicine</p>
        <p className="mt-1">HealthPlus Pharmacy · Avondale, Harare</p>
      </footer>
    </div>
  );
};

export default Index;

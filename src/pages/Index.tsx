import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { Download } from "lucide-react";

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

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Page title row like shadcn-admin */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">HealthPlus Pharmacy · Avondale, Harare 🇿🇼</p>
          </div>
          <Button variant="default" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Tabs styled like shadcn-admin */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)}>
          <TabsList className="mb-6 h-10 w-auto">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="space-y-6">
              <MethodSelector />
              <div className="grid gap-6 lg:grid-cols-2">
                <QuickAddForm onAdd={handleAdd} />
                <BulkUpload />
              </div>
              <InventoryTable medicines={medicines} onUpdate={handleUpdate} onDelete={handleDelete} />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab medicines={medicines} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab medicines={medicines} onRestock={handleRestock} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border bg-card p-8">
              <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
              <p className="text-sm text-muted-foreground">Settings page coming soon. Manage your pharmacy profile, notification preferences, and account details here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>🇿🇼 RERUN Health AI — Connecting Zimbabweans to Medicine</p>
        <p className="mt-1">HealthPlus Pharmacy · Avondale, Harare</p>
      </footer>
    </div>
  );
};

export default Index;

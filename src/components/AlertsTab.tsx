import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { Medicine } from "@/types/pharmacy";

interface AlertsTabProps {
  medicines: Medicine[];
  onRestock: (id: string) => void;
}

const AlertsTab = ({ medicines, onRestock }: AlertsTabProps) => {
  const outOfStock = medicines.filter((m) => !m.inStock);
  const limitedStock = medicines.filter((m) => m.inStock && (m.quantity === "1-5" || m.quantity === "5"));
  const highDemand = medicines.filter((m) => m.searches >= 15).slice(0, 5);

  const summaryCards = [
    { label: "Out of Stock", count: outOfStock.length, icon: XCircle, change: "Requires immediate attention" },
    { label: "Limited Stock", count: limitedStock.length, icon: AlertTriangle, change: "Consider reordering soon" },
    { label: "High Demand", count: highDemand.length, icon: TrendingUp, change: "Frequently searched items" },
  ];

  const alerts = [
    ...outOfStock.map((m) => ({ ...m, severity: "critical" as const })),
    ...limitedStock.map((m) => ({ ...m, severity: "warning" as const })),
  ].sort((a, b) => b.searches - a.searches);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{c.count}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Stock Alerts</CardTitle>
          <CardDescription>Items that need attention</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">All stock levels look good!</p>
              <p className="text-xs mt-1">No alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.severity === "critical" ? "Out of Stock" : "Limited Stock"} · {m.searches} searches recently
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onClick={() => onRestock(m.id)}
                  >
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsTab;

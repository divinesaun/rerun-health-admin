import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    { label: "Out of Stock", count: outOfStock.length, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Limited Stock", count: limitedStock.length, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "High Demand", count: highDemand.length, icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10" },
  ];

  const alerts = [
    ...outOfStock.map((m) => ({ ...m, severity: "critical" as const })),
    ...limitedStock.map((m) => ({ ...m, severity: "warning" as const })),
  ].sort((a, b) => b.searches - a.searches);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${c.bg}`}>
                <c.icon className={`h-6 w-6 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.count}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">🔔 Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-lg">🎉 All stock levels look good!</p>
              <p className="text-sm">No alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col gap-2 rounded-lg border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
                    m.severity === "critical" ? "border-l-destructive bg-destructive/5" : "border-l-warning bg-warning/5"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {m.severity === "critical" ? (
                        <span className="text-destructive font-semibold">❌ {m.name}</span>
                      ) : (
                        <span className="text-warning font-semibold">⚠️ {m.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.severity === "critical" ? "Out of Stock" : "Limited Stock"} · 🔍 Searched {m.searches} times recently
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

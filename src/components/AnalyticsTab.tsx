import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, BarChart3, Star } from "lucide-react";
import { Medicine } from "@/types/pharmacy";

interface AnalyticsTabProps {
  medicines: Medicine[];
}

const metrics = [
  { label: "Total Searches", value: "327", change: "+20.1% from last month", icon: TrendingUp },
  { label: "Customer Inquiries", value: "54", change: "+12 since last week", icon: Users },
  { label: "Conversion Rate", value: "16.5%", change: "+2.3% from last month", icon: BarChart3 },
  { label: "Rating", value: "4.8", change: "+0.2 from last month", icon: Star },
];

const AnalyticsTab = ({ medicines }: AnalyticsTabProps) => {
  const topMedicines = [...medicines].sort((a, b) => b.searches - a.searches).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{m.label === "Rating" ? `⭐ ${m.value}` : m.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{m.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Most Searched Medicines</CardTitle>
          <CardDescription>Top performing medicines by search volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMedicines.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  {m.genericName && <p className="text-xs text-muted-foreground truncate">{m.genericName}</p>}
                </div>
                <span className="text-sm text-muted-foreground">{m.searches} searches</span>
                <span className="text-sm font-medium text-foreground">${m.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;

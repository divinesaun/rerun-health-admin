import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, BarChart3, Star } from "lucide-react";
import { Medicine } from "@/types/pharmacy";

interface AnalyticsTabProps {
  medicines: Medicine[];
}

const metrics = [
  { label: "Total Searches", value: "327", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "Customer Inquiries", value: "54", icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
  { label: "Conversion Rate", value: "16.5%", icon: BarChart3, color: "text-[hsl(var(--chart-purple))]", bg: "bg-[hsl(var(--chart-purple))]/10" },
  { label: "Rating", value: "4.8", icon: Star, color: "text-warning", bg: "bg-warning/10" },
];

const AnalyticsTab = ({ medicines }: AnalyticsTabProps) => {
  const topMedicines = [...medicines].sort((a, b) => b.searches - a.searches).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Card key={m.label} className="shadow-md animate-count-up" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${m.bg}`}>
                <m.icon className={`h-6 w-6 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{m.label === "Rating" ? `⭐ ${m.value}` : m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🔥 Most Searched Medicines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topMedicines.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{m.name}</p>
                  {m.genericName && <p className="text-xs text-muted-foreground">{m.genericName}</p>}
                </div>
                <Badge variant="secondary">{m.searches} searches</Badge>
                <span className="font-semibold text-foreground">${m.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;

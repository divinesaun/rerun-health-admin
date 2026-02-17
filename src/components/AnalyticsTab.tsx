import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Package, Search, Loader2 } from "lucide-react";
import { Medicine } from "@/types/pharmacy";
import { analyticsApi } from "@/lib/api";

interface AnalyticsTabProps {
  medicines: Medicine[];
}

const AnalyticsTab = ({ medicines }: AnalyticsTabProps) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Record<string, unknown>>({});
  const [trending, setTrending] = useState<{ name?: string; times_searched?: number }[]>([]);
  const [inquiries, setInquiries] = useState<{ id?: string; message?: string; created_at?: string }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.dashboard();
        setOverview(res.overview ?? {});
        setTrending((res.trending_medicines ?? []) as typeof trending);
        setInquiries((res.recent_inquiries ?? []) as typeof inquiries);
      } catch {
        // Backend may not have analytics data yet
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalSearches = medicines.reduce((s, m) => s + m.searches, 0);
  const inStockCount = medicines.filter((m) => m.inStock).length;
  const topMedicines = [...medicines].sort((a, b) => b.searches - a.searches).slice(0, 8);

  const metricCards = [
    { label: "Total Medicines", value: String(medicines.length), sub: `${inStockCount} in stock`, icon: Package },
    { label: "Total Searches", value: String(totalSearches), sub: "across your inventory", icon: Search },
    { label: "Top Searched", value: topMedicines[0]?.name ?? "—", sub: topMedicines[0] ? `${topMedicines[0].searches} searches` : "no data", icon: TrendingUp },
    { label: "Inquiries", value: String(inquiries.length), sub: "customer contacts", icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-sm">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground truncate">{m.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most searched medicines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Most Searched</CardTitle>
            <CardDescription>Your top medicines by customer search volume</CardDescription>
          </CardHeader>
          <CardContent>
            {topMedicines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No search data yet.</p>
            ) : (
              <div className="space-y-3">
                {topMedicines.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    </div>
                    <Badge variant={m.inStock ? "default" : "destructive"} className="text-[10px] shrink-0">
                      {m.inStock ? "In Stock" : "Out"}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{m.searches} hits</span>
                    <span className="text-sm font-medium text-foreground w-16 text-right">${m.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Inquiries</CardTitle>
            <CardDescription>Latest customer contacts about your pharmacy</CardDescription>
          </CardHeader>
          <CardContent>
            {inquiries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No inquiries yet. Customers will appear here when they contact your pharmacy.</p>
            ) : (
              <div className="space-y-3">
                {inquiries.slice(0, 8).map((inq, i) => (
                  <div key={inq.id ?? i} className="rounded-md border p-3">
                    <p className="text-sm text-foreground">{inq.message ?? "Customer inquiry"}</p>
                    {inq.created_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(inq.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsTab;

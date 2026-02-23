import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Package, Search, Loader2, DollarSign } from "lucide-react";
import { Medicine } from "@/types/pharmacy";
import { analyticsApi } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff", "#e0e7ff"];
const STOCK_COLORS = ["#22c55e", "#ef4444"];

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
  const outOfStockCount = medicines.length - inStockCount;
  const topMedicines = useMemo(
    () => [...medicines].sort((a, b) => b.searches - a.searches).slice(0, 8),
    [medicines]
  );
  const avgPrice = medicines.length > 0
    ? (medicines.reduce((s, m) => s + m.price, 0) / medicines.length).toFixed(2)
    : "0.00";

  // Bar chart data for top searched
  const barData = useMemo(
    () => topMedicines.map((m) => ({ name: m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name, searches: m.searches, fullName: m.name })),
    [topMedicines]
  );

  // Pie chart data for stock status
  const stockPieData = useMemo(
    () => [
      { name: "In Stock", value: inStockCount },
      { name: "Out of Stock", value: outOfStockCount },
    ],
    [inStockCount, outOfStockCount]
  );

  // Price distribution for area chart
  const priceDistribution = useMemo(() => {
    const sorted = [...medicines].sort((a, b) => a.price - b.price);
    const buckets: { range: string; count: number }[] = [];
    const ranges = [[0, 2], [2, 5], [5, 10], [10, 20], [20, 50], [50, Infinity]];
    for (const [lo, hi] of ranges) {
      const label = hi === Infinity ? `$${lo}+` : `$${lo}-${hi}`;
      buckets.push({ range: label, count: sorted.filter((m) => m.price >= lo && m.price < hi).length });
    }
    return buckets;
  }, [medicines]);

  const metricCards = [
    { label: "Total Medicines", value: String(medicines.length), sub: `${inStockCount} in stock`, icon: Package },
    { label: "Total Searches", value: String(totalSearches), sub: "across your inventory", icon: Search },
    { label: "Avg. Price", value: `$${avgPrice}`, sub: "across all medicines", icon: DollarSign },
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
        {/* Bar Chart: Top Searched Medicines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Searched Medicines</CardTitle>
            <CardDescription>Customer search volume by medicine</CardDescription>
          </CardHeader>
          <CardContent>
            {topMedicines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No search data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, _name: string, props: { payload?: { fullName?: string } }) => [value, props?.payload?.fullName ?? "Searches"]}
                  />
                  <Bar dataKey="searches" radius={[4, 4, 0, 0]}>
                    {barData.map((_entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart: Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Status</CardTitle>
            <CardDescription>In stock vs out of stock breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {medicines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No inventory data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stockPieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stockPieData.map((_entry, i) => (
                      <Cell key={i} fill={STOCK_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart: Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Price Distribution</CardTitle>
            <CardDescription>Number of medicines by price range</CardDescription>
          </CardHeader>
          <CardContent>
            {medicines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No pricing data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={priceDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
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
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
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

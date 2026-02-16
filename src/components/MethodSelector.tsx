import { Card, CardContent } from "@/components/ui/card";
import { Zap, BarChart3, Edit3 } from "lucide-react";

const methods = [
  { icon: Zap, label: "Quick Add", desc: "Add one at a time" },
  { icon: BarChart3, label: "Bulk Upload", desc: "Upload CSV file" },
  { icon: Edit3, label: "Inline Edit", desc: "Edit in table" },
];

const MethodSelector = () => (
  <Card className="gradient-green border-2 border-primary/20">
    <CardContent className="p-6">
      <h2 className="mb-1 text-lg font-bold text-foreground">Choose How to Manage Inventory</h2>
      <p className="mb-4 text-sm text-muted-foreground">All methods update the same inventory in real-time!</p>
      <div className="flex flex-wrap gap-3">
        {methods.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md"
          >
            <m.icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default MethodSelector;

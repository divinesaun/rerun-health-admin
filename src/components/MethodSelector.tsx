import { Card, CardContent } from "@/components/ui/card";
import { Zap, BarChart3, Edit3 } from "lucide-react";

const methods = [
  { icon: Zap, label: "Quick Add", desc: "Add one at a time" },
  { icon: BarChart3, label: "Bulk Upload", desc: "Upload CSV file" },
  { icon: Edit3, label: "Inline Edit", desc: "Edit in table" },
];

const MethodSelector = () => (
  <Card>
    <CardContent className="p-5">
      <h2 className="mb-1 text-sm font-semibold text-foreground">Choose How to Manage Inventory</h2>
      <p className="mb-3 text-xs text-muted-foreground">All methods update the same inventory in real-time.</p>
      <div className="flex flex-wrap gap-2">
        {methods.map((m) => (
          <div
            key={m.label}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <m.icon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{m.label}</p>
              <p className="text-[11px] text-muted-foreground">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default MethodSelector;

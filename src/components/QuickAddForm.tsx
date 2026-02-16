import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, CheckCircle2, Lightbulb } from "lucide-react";
import { Medicine } from "@/types/pharmacy";
import { MEDICINE_SUGGESTIONS, QUANTITY_OPTIONS } from "@/data/mockData";

interface QuickAddFormProps {
  onAdd: (medicine: Omit<Medicine, "id" | "searches" | "updatedAt">) => void;
}

const QuickAddForm = ({ onAdd }: QuickAddFormProps) => {
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [quantity, setQuantity] = useState("10+");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = MEDICINE_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(name.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!price || parseFloat(price) <= 0) newErrors.price = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onAdd({ name: name.trim(), genericName: genericName.trim() || undefined, price: parseFloat(price), inStock, quantity });
    setSuccess(true);
    setName("");
    setGenericName("");
    setPrice("");
    setInStock(true);
    setQuantity("10+");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-primary" />
          Quick Add Medicine
          <Badge variant="outline" className="ml-auto text-xs">Method 1</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-primary/30 bg-accent animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-accent-foreground">Medicine added to inventory!</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-foreground">Medicine Name *</label>
          <Input
            ref={inputRef}
            placeholder="e.g., Paracetamol 500mg"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true); setErrors((p) => ({ ...p, name: false })); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={errors.name ? "border-destructive" : ""}
          />
          {showSuggestions && name.length > 1 && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-card shadow-lg">
              {filtered.map((s) => (
                <button
                  key={s}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onMouseDown={() => { setName(s); setShowSuggestions(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Generic Name <span className="text-muted-foreground">(optional)</span></label>
          <Input placeholder="e.g., Acetaminophen" value={genericName} onChange={(e) => setGenericName(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Price (USD) *</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 2.50"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: false })); }}
            className={errors.price ? "border-destructive" : ""}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Stock Status *</label>
          <div className="flex gap-3 mt-1">
            <button
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${inStock ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}
              onClick={() => setInStock(true)}
            >
              ✅ In Stock
            </button>
            <button
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${!inStock ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:border-destructive/40"}`}
              onClick={() => setInStock(false)}
            >
              ❌ Out of Stock
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Quantity Available</label>
          <Select value={quantity} onValueChange={setQuantity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUANTITY_OPTIONS.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full gradient-btn-green text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-shadow" onClick={handleSubmit}>
          ✅ Add to Inventory
        </Button>

        <div className="flex items-start gap-2 rounded-lg bg-accent/50 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-xs text-muted-foreground">Start typing for suggestions from the medicine database</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAddForm;

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, CheckCircle2 } from "lucide-react";
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Quick Add Medicine</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Add a single medicine to your inventory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-primary/30 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription>Medicine added to inventory!</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Label htmlFor="med-name">Medicine Name</Label>
          <Input
            id="med-name"
            ref={inputRef}
            placeholder="e.g., Paracetamol 500mg"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true); setErrors((p) => ({ ...p, name: false })); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={`mt-1.5 ${errors.name ? "border-destructive" : ""}`}
          />
          {showSuggestions && name.length > 1 && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              {filtered.map((s) => (
                <button
                  key={s}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  onMouseDown={() => { setName(s); setShowSuggestions(false); }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="generic-name">Generic Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="generic-name" placeholder="e.g., Acetaminophen" value={genericName} onChange={(e) => setGenericName(e.target.value)} className="mt-1.5" />
        </div>

        <div>
          <Label htmlFor="med-price">Price (USD)</Label>
          <Input
            id="med-price"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 2.50"
            value={price}
            onChange={(e) => { setPrice(e.target.value); setErrors((p) => ({ ...p, price: false })); }}
            className={`mt-1.5 ${errors.price ? "border-destructive" : ""}`}
          />
        </div>

        <div>
          <Label>Stock Status</Label>
          <div className="flex gap-2 mt-1.5">
            <button
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${inStock ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}
              onClick={() => setInStock(true)}
            >
              In Stock
            </button>
            <button
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${!inStock ? "border-destructive bg-destructive/10 text-foreground" : "border-border text-muted-foreground hover:bg-accent"}`}
              onClick={() => setInStock(false)}
            >
              Out of Stock
            </button>
          </div>
        </div>

        <div>
          <Label>Quantity Available</Label>
          <Select value={quantity} onValueChange={setQuantity}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUANTITY_OPTIONS.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Add to Inventory
        </Button>

        <p className="text-xs text-muted-foreground">
          💡 Start typing for suggestions from the medicine database
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickAddForm;

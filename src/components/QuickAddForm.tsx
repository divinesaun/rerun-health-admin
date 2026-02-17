import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, CheckCircle2, Loader2 } from "lucide-react";
import { Medicine } from "@/types/pharmacy";
import { QUANTITY_OPTIONS } from "@/data/mockData";
import { inventoryApi, type MedicineRecord } from "@/lib/api";

interface QuickAddFormProps {
  onAdd: (medicine: Omit<Medicine, "id" | "searches" | "updatedAt">, medicineId: string) => void;
}

const QuickAddForm = ({ onAdd }: QuickAddFormProps) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [quantity, setQuantity] = useState("10+");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<MedicineRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (name.length < 2) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await inventoryApi.searchMedicines(name);
        setSuggestions(res.medicines ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [name]);

  const handleSelect = (med: MedicineRecord) => {
    setName(med.name);
    setSelectedMedicine(med);
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!selectedMedicine) newErrors.name = true;
    if (!price || parseFloat(price) <= 0) newErrors.price = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (!selectedMedicine && name.trim()) {
        // Show helpful message
      }
      return;
    }
    setErrors({});
    onAdd(
      {
        name: selectedMedicine!.name,
        genericName: selectedMedicine!.generic_name ?? undefined,
        price: parseFloat(price),
        inStock,
        quantity,
      },
      selectedMedicine!.id
    );
    setSuccess(true);
    setName("");
    setPrice("");
    setInStock(true);
    setQuantity("10+");
    setSelectedMedicine(null);
    setSuggestions([]);
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
          <div className="relative">
            <Input
              id="med-name"
              ref={inputRef}
              placeholder="e.g., Paracetamol 500mg"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSelectedMedicine(null);
                setShowSuggestions(true);
                setErrors((p) => ({ ...p, name: false }));
              }}
              onFocus={() => name.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={`mt-1.5 ${errors.name ? "border-destructive" : ""}`}
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {showSuggestions && name.length >= 2 && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  onMouseDown={() => handleSelect(s)}
                >
                  <span className="font-medium">{s.name}</span>
                  {s.generic_name && (
                    <span className="text-xs text-muted-foreground ml-2">({s.generic_name})</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {showSuggestions && name.length >= 2 && !searching && suggestions.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md p-3">
              <p className="text-sm text-muted-foreground">No medicines found matching "{name}"</p>
            </div>
          )}
          {errors.name && !selectedMedicine && name.trim() && (
            <p className="mt-1 text-xs text-destructive">Please select a medicine from the suggestions</p>
          )}
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

        <Button className="w-full" onClick={handleSubmit} disabled={!selectedMedicine}>
          Add to Inventory
        </Button>

        <p className="text-xs text-muted-foreground">
          💡 Start typing to search the medicine database
        </p>
      </CardContent>
    </Card>
  );
};

export default QuickAddForm;

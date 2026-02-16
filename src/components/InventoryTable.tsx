import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Trash2, ArrowUpDown } from "lucide-react";
import { Medicine } from "@/types/pharmacy";
import { formatDistanceToNow } from "date-fns";

interface InventoryTableProps {
  medicines: Medicine[];
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onDelete: (id: string) => void;
}

type SortKey = "name" | "price" | "searches" | "updatedAt";

const InventoryTable = ({ medicines, onUpdate, onDelete }: InventoryTableProps) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("searches");
  const [sortAsc, setSortAsc] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.genericName && m.genericName.toLowerCase().includes(search.toLowerCase()))
    );
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (aVal instanceof Date && bVal instanceof Date) return sortAsc ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return list;
  }, [medicines, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const confirmDelete = () => {
    if (deleteId) { onDelete(deleteId); setDeleteId(null); }
  };

  const savePrice = (id: string) => {
    const num = parseFloat(priceValue);
    if (!isNaN(num) && num > 0) onUpdate(id, { price: num });
    setEditingPrice(null);
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button className="flex items-center gap-1 font-medium hover:text-foreground transition-colors" onClick={() => handleSort(sortKeyName)}>
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Your Inventory</CardTitle>
            <Badge variant="secondary" className="font-normal">{medicines.length} medicines</Badge>
          </div>
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Medicine" sortKeyName="name" /></TableHead>
                <TableHead><SortHeader label="Price" sortKeyName="price" /></TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell"><SortHeader label="Searches" sortKeyName="searches" /></TableHead>
                <TableHead className="hidden lg:table-cell"><SortHeader label="Updated" sortKeyName="updatedAt" /></TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {search ? "No medicines match your search" : "No medicines in inventory yet. Add some above!"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{m.name}</p>
                        {m.genericName && <p className="text-xs text-muted-foreground">{m.genericName}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingPrice === m.id ? (
                        <Input
                          type="number"
                          className="h-8 w-20"
                          value={priceValue}
                          onChange={(e) => setPriceValue(e.target.value)}
                          onBlur={() => savePrice(m.id)}
                          onKeyDown={(e) => e.key === "Enter" && savePrice(m.id)}
                          autoFocus
                        />
                      ) : (
                        <button
                          className="rounded px-1.5 py-0.5 font-medium text-foreground hover:bg-accent transition-colors text-sm"
                          onClick={() => { setEditingPrice(m.id); setPriceValue(m.price.toFixed(2)); }}
                        >
                          ${m.price.toFixed(2)}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onUpdate(m.id, { inStock: !m.inStock })}
                      >
                        <Badge variant={m.inStock ? "default" : "destructive"} className="cursor-pointer">
                          {m.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{m.searches}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(m.updatedAt, { addSuffix: true })}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to remove this medicine from your inventory? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InventoryTable;

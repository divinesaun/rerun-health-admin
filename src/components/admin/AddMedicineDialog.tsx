import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Pill, Table2, FormInput, Trash2 } from "lucide-react";
import { adminMedicineApi } from "@/lib/adminApi";

const medicineSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200, "Name too long"),
  generic_name: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  dosage_form: z.string().trim().max(50).optional().or(z.literal("")),
  strength: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  requires_prescription: z.boolean().default(false),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

interface TableRow {
  name: string;
  generic_name: string;
  category: string;
  dosage_form: string;
  strength: string;
  requires_prescription: boolean;
}

const EMPTY_ROW: TableRow = { name: "", generic_name: "", category: "", dosage_form: "", strength: "", requires_prescription: false };

export function AddMedicineDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"form" | "table">("form");
  const queryClient = useQueryClient();

  // ── Form mode ──
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      generic_name: "",
      category: "",
      dosage_form: "",
      strength: "",
      description: "",
      requires_prescription: false,
    },
  });

  const requiresPrescription = watch("requires_prescription");

  const mutation = useMutation({
    mutationFn: (data: MedicineFormData) =>
      adminMedicineApi.create({
        name: data.name,
        generic_name: data.generic_name || undefined,
        category: data.category || undefined,
        dosage_form: data.dosage_form || undefined,
        strength: data.strength || undefined,
        description: data.description || undefined,
        requires_prescription: data.requires_prescription,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      toast({ title: "Medicine added", description: "Medicine added to the database." });
      reset();
      setOpen(false);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to add medicine.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // ── Table mode ──
  const [tableRows, setTableRows] = useState<TableRow[]>([{ ...EMPTY_ROW }]);
  const [tableSubmitting, setTableSubmitting] = useState(false);

  const updateTableCell = (rowIdx: number, key: keyof TableRow, value: string | boolean) => {
    setTableRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)));
  };

  const addTableRow = () => setTableRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeTableRow = (idx: number) => {
    setTableRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleTableSubmit = async () => {
    const validRows = tableRows.filter((r) => r.name.trim().length >= 2);
    if (validRows.length === 0) {
      toast({ title: "Error", description: "At least one medicine name is required (min 2 chars).", variant: "destructive" });
      return;
    }
    setTableSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    for (const row of validRows) {
      try {
        await adminMedicineApi.create({
          name: row.name,
          generic_name: row.generic_name || undefined,
          category: row.category || undefined,
          dosage_form: row.dosage_form || undefined,
          strength: row.strength || undefined,
          requires_prescription: row.requires_prescription,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    setTableSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    if (successCount > 0) {
      toast({ title: "Medicines added", description: `${successCount} added${failCount > 0 ? `, ${failCount} failed` : ""}.` });
    }
    if (failCount > 0 && successCount === 0) {
      toast({ title: "Error", description: "All entries failed to add.", variant: "destructive" });
    }
    setTableRows([{ ...EMPTY_ROW }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${mode === "table" ? "max-w-3xl" : "max-w-md"}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Add Medicine
          </DialogTitle>
          <DialogDescription>
            Add a new medicine to the master database.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 mt-1">
          <button
            type="button"
            onClick={() => setMode("form")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === "form" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FormInput className="h-3.5 w-3.5" /> Form
          </button>
          <button
            type="button"
            onClick={() => setMode("table")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Table2 className="h-3.5 w-3.5" /> Table (Batch)
          </button>
        </div>

        {mode === "form" ? (
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3 mt-2">
            <FieldRow label="Medicine Name *" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Paracetamol 500mg" />
            </FieldRow>

            <FieldRow label="Generic Name" error={errors.generic_name?.message}>
              <Input {...register("generic_name")} placeholder="Acetaminophen" />
            </FieldRow>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Category" error={errors.category?.message}>
                <Input {...register("category")} placeholder="Pain Relief" />
              </FieldRow>
              <FieldRow label="Dosage Form" error={errors.dosage_form?.message}>
                <Input {...register("dosage_form")} placeholder="Tablet" />
              </FieldRow>
            </div>

            <FieldRow label="Strength" error={errors.strength?.message}>
              <Input {...register("strength")} placeholder="500mg" />
            </FieldRow>

            <FieldRow label="Description" error={errors.description?.message}>
              <Input {...register("description")} placeholder="Optional description..." />
            </FieldRow>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label className="text-sm">Requires Prescription</Label>
              <Switch
                checked={requiresPrescription}
                onCheckedChange={(checked) => setValue("requires_prescription", checked)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="gap-1.5">
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Medicine
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-2 py-1.5 text-left font-medium">Name *</th>
                    <th className="px-2 py-1.5 text-left font-medium">Generic</th>
                    <th className="px-2 py-1.5 text-left font-medium">Category</th>
                    <th className="px-2 py-1.5 text-left font-medium">Form</th>
                    <th className="px-2 py-1.5 text-left font-medium">Strength</th>
                    <th className="px-2 py-1.5 text-left font-medium w-12">Rx</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-b-0 group">
                      <td className="px-1 py-0.5">
                        <input className="w-full min-w-[120px] bg-transparent text-xs px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none" value={row.name} onChange={(e) => updateTableCell(ri, "name", e.target.value)} placeholder="Paracetamol 500mg" />
                      </td>
                      <td className="px-1 py-0.5">
                        <input className="w-full min-w-[90px] bg-transparent text-xs px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none" value={row.generic_name} onChange={(e) => updateTableCell(ri, "generic_name", e.target.value)} placeholder="Acetaminophen" />
                      </td>
                      <td className="px-1 py-0.5">
                        <input className="w-full min-w-[80px] bg-transparent text-xs px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none" value={row.category} onChange={(e) => updateTableCell(ri, "category", e.target.value)} placeholder="Pain Relief" />
                      </td>
                      <td className="px-1 py-0.5">
                        <input className="w-full min-w-[60px] bg-transparent text-xs px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none" value={row.dosage_form} onChange={(e) => updateTableCell(ri, "dosage_form", e.target.value)} placeholder="Tablet" />
                      </td>
                      <td className="px-1 py-0.5">
                        <input className="w-full min-w-[50px] bg-transparent text-xs px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none" value={row.strength} onChange={(e) => updateTableCell(ri, "strength", e.target.value)} placeholder="500mg" />
                      </td>
                      <td className="px-1 py-0.5 text-center">
                        <input type="checkbox" checked={row.requires_prescription} onChange={(e) => updateTableCell(ri, "requires_prescription", e.target.checked)} className="h-3.5 w-3.5 rounded border-border" />
                      </td>
                      <td className="px-1 py-0.5">
                        <button onClick={() => removeTableRow(ri)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1" title="Remove row">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addTableRow} className="gap-1.5 w-full">
              <Plus className="h-3.5 w-3.5" /> Add Row
            </Button>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTableSubmit} disabled={tableSubmitting} className="gap-1.5">
                {tableSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add {tableRows.filter((r) => r.name.trim().length >= 2).length} Medicine{tableRows.filter((r) => r.name.trim().length >= 2).length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

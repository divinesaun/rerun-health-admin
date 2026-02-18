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
import { Plus, Loader2, Pill } from "lucide-react";
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

export function AddMedicineDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Add Medicine
          </DialogTitle>
          <DialogDescription>
            Add a new medicine to the master database.
          </DialogDescription>
        </DialogHeader>

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

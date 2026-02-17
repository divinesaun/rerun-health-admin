import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminMedicineApi, type AdminMedicine } from "@/lib/adminApi";

const editSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(200),
  generic_name: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  dosage_form: z.string().trim().max(50).optional().or(z.literal("")),
  strength: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  requires_prescription: z.boolean(),
});

type EditFormData = z.infer<typeof editSchema>;

interface Props {
  medicine: AdminMedicine;
}

export function MedicineActionsDropdown({ medicine }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "medicines"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: medicine.name,
      generic_name: medicine.generic_name ?? "",
      category: medicine.category ?? "",
      dosage_form: medicine.dosage_form ?? "",
      strength: medicine.strength ?? "",
      description: medicine.description ?? "",
      requires_prescription: medicine.requires_prescription,
    },
  });

  const requiresPrescription = watch("requires_prescription");

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      adminMedicineApi.update(medicine.id, {
        name: data.name,
        generic_name: data.generic_name || undefined,
        category: data.category || undefined,
        dosage_form: data.dosage_form || undefined,
        strength: data.strength || undefined,
        description: data.description || undefined,
        requires_prescription: data.requires_prescription,
      }),
    onSuccess: () => {
      toast({ title: "Medicine updated", description: `${medicine.name} has been updated.` });
      setEditOpen(false);
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Failed to update.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminMedicineApi.delete(medicine.id),
    onSuccess: () => {
      toast({ title: "Medicine deleted", description: `${medicine.name} has been removed.` });
      setDeleteOpen(false);
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed to delete.", variant: "destructive" });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { reset(); setEditOpen(true); }} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update details for {medicine.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} className="space-y-3 mt-2">
            <Field label="Medicine Name *" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Generic Name" error={errors.generic_name?.message}>
              <Input {...register("generic_name")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category" error={errors.category?.message}>
                <Input {...register("category")} />
              </Field>
              <Field label="Dosage Form" error={errors.dosage_form?.message}>
                <Input {...register("dosage_form")} />
              </Field>
            </div>
            <Field label="Strength" error={errors.strength?.message}>
              <Input {...register("strength")} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <Input {...register("description")} />
            </Field>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label className="text-sm">Requires Prescription</Label>
              <Switch
                checked={requiresPrescription}
                onCheckedChange={(checked) => setValue("requires_prescription", checked)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editMutation.isPending} className="gap-1.5">
                {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{medicine.name}</span>? This will remove it from the master database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

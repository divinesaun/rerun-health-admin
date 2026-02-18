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
import { toast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Mail,
} from "lucide-react";
import { adminPharmacyApi, type AdminPharmacy } from "@/lib/adminApi";
import { OpeningHoursPicker } from "@/components/OpeningHoursPicker";
import { WhatsAppInput } from "@/components/WhatsAppInput";

const editSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(100),
  address: z.string().trim().min(3, "Address required").max(255),
  suburb: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).regex(/^(\+?\d[\d\s-]{6,18})?$/, "Invalid phone").optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  whatsapp_number: z.string().trim().max(20).regex(/^(\+?\d[\d\s-]{6,18})?$/, "Invalid number").optional().or(z.literal("")),
  opening_hours: z.string().trim().max(100).optional().or(z.literal("")),
});

type EditFormData = z.infer<typeof editSchema>;

interface Props {
  pharmacy: AdminPharmacy;
}

export function PharmacyActionsDropdown({ pharmacy }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacies"] });
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
      name: pharmacy.name,
      address: pharmacy.address,
      suburb: pharmacy.suburb ?? "",
      city: pharmacy.city ?? "",
      phone: pharmacy.phone ?? "",
      email: pharmacy.email ?? "",
      whatsapp_number: pharmacy.whatsapp_number ?? "",
      opening_hours: pharmacy.opening_hours ?? "",
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      adminPharmacyApi.update(pharmacy.id, {
        ...data,
        suburb: data.suburb || null,
        city: data.city || null,
        phone: data.phone || null,
        email: data.email || null,
        whatsapp_number: data.whatsapp_number || null,
        opening_hours: data.opening_hours || null,
      }),
    onSuccess: () => {
      toast({ title: "Pharmacy updated", description: `${pharmacy.name} has been updated.` });
      setEditOpen(false);
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Failed to update.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminPharmacyApi.delete(pharmacy.id),
    onSuccess: () => {
      toast({ title: "Pharmacy deleted", description: `${pharmacy.name} has been removed.` });
      setDeleteOpen(false);
      invalidate();
    },
    onError: (err) => {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed to delete.", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => adminPharmacyApi.update(pharmacy.id, { verified: !pharmacy.verified }),
    onSuccess: () => {
      toast({ title: pharmacy.verified ? "Verification removed" : "Pharmacy verified", description: `${pharmacy.name} status updated.` });
      invalidate();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update verification.", variant: "destructive" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => adminPharmacyApi.resendCredentials(pharmacy.id),
    onSuccess: (data) => {
      toast({
        title: "Credentials sent",
        description: `New one-time password emailed to ${data.user_email || pharmacy.email}.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resend credentials.",
        variant: "destructive",
      });
    },
  });

  const isProcessing = verifyMutation.isPending || resendMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { reset(); setEditOpen(true); }} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => verifyMutation.mutate()} className="gap-2">
            {pharmacy.verified ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {pharmacy.verified ? "Unverify" : "Verify"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => resendMutation.mutate()}
            className="gap-2"
            disabled={resendMutation.isPending}
          >
            <Mail className="h-3.5 w-3.5" />
            Resend Credentials
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pharmacy</DialogTitle>
            <DialogDescription>Update details for {pharmacy.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => editMutation.mutate(d))} className="space-y-3 mt-2">
            <Field label="Name *" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field label="Address *" error={errors.address?.message}>
              <Input {...register("address")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Suburb" error={errors.suburb?.message}>
                <Input {...register("suburb")} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input {...register("city")} />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone?.message}>
              <WhatsAppInput
                value={watch("phone") ?? ""}
                onChange={(v) => setValue("phone", v)}
                placeholder="77 123 4567"
              />
            </Field>
            <Field label="WhatsApp" error={errors.whatsapp_number?.message}>
              <WhatsAppInput
                value={watch("whatsapp_number") ?? ""}
                onChange={(v) => setValue("whatsapp_number", v)}
                placeholder="77 123 4567"
              />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input {...register("email")} />
            </Field>
            <Field label="Opening Hours" error={errors.opening_hours?.message}>
              <OpeningHoursPicker
                value={watch("opening_hours") ?? ""}
                onChange={(v) => setValue("opening_hours", v)}
              />
            </Field>


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
            <AlertDialogTitle>Delete Pharmacy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{pharmacy.name}</span>? This action cannot be undone and will remove all associated data.
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

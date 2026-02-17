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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Building2 } from "lucide-react";
import { adminPharmacyApi } from "@/lib/adminApi";

const pharmacySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  address: z.string().trim().min(3, "Address is required").max(255, "Address too long"),
  suburb: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+?\d[\d\s-]{6,18})?$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  whatsapp_number: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+?\d[\d\s-]{6,18})?$/, "Invalid WhatsApp number")
    .optional()
    .or(z.literal("")),
  opening_hours: z.string().trim().max(100).optional().or(z.literal("")),
  admin_email: z.string().trim().email("Invalid admin email").max(255, "Email too long"),
  admin_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/\d/, "Password must contain a number"),
  admin_name: z.string().trim().max(100).optional().or(z.literal("")),
});

type PharmacyFormData = z.infer<typeof pharmacySchema>;

export function RegisterPharmacyDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PharmacyFormData>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: {
      name: "",
      address: "",
      suburb: "",
      city: "",
      phone: "",
      email: "",
      whatsapp_number: "",
      opening_hours: "",
      admin_email: "",
      admin_password: "",
      admin_name: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PharmacyFormData) =>
      adminPharmacyApi.create({
        name: data.name,
        address: data.address,
        suburb: data.suburb || undefined,
        city: data.city || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        whatsapp_number: data.whatsapp_number || undefined,
        opening_hours: data.opening_hours || undefined,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_name: data.admin_name || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pharmacies"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      toast({ title: "Pharmacy registered", description: "Pharmacy and admin account created successfully." });
      reset();
      setOpen(false);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to register pharmacy.";
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Register Pharmacy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Register New Pharmacy
          </DialogTitle>
          <DialogDescription>
            Create a new pharmacy and its initial admin account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 mt-2">
          {/* Pharmacy Details */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pharmacy Details</p>

            <FieldRow label="Pharmacy Name *" error={errors.name?.message}>
              <Input {...register("name")} placeholder="HealthPlus Pharmacy" />
            </FieldRow>

            <FieldRow label="Address *" error={errors.address?.message}>
              <Input {...register("address")} placeholder="123 Main St, Harare" />
            </FieldRow>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Suburb" error={errors.suburb?.message}>
                <Input {...register("suburb")} placeholder="Avondale" />
              </FieldRow>
              <FieldRow label="City" error={errors.city?.message}>
                <Input {...register("city")} placeholder="Harare" />
              </FieldRow>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="+263 4 123 4567" />
              </FieldRow>
              <FieldRow label="WhatsApp" error={errors.whatsapp_number?.message}>
                <Input {...register("whatsapp_number")} placeholder="+263 77 123 4567" />
              </FieldRow>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Email" error={errors.email?.message}>
                <Input {...register("email")} placeholder="info@pharmacy.co.zw" />
              </FieldRow>
              <FieldRow label="Opening Hours" error={errors.opening_hours?.message}>
                <Input {...register("opening_hours")} placeholder="Mon-Fri 8am-6pm" />
              </FieldRow>
            </div>
          </div>

          <Separator />

          {/* Admin Account */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Account</p>

            <FieldRow label="Admin Name" error={errors.admin_name?.message}>
              <Input {...register("admin_name")} placeholder="John Moyo" />
            </FieldRow>

            <FieldRow label="Admin Email *" error={errors.admin_email?.message}>
              <Input {...register("admin_email")} type="email" placeholder="admin@pharmacy.co.zw" />
            </FieldRow>

            <FieldRow label="Admin Password *" error={errors.admin_password?.message}>
              <Input {...register("admin_password")} type="password" placeholder="Min 8 chars with a number" />
            </FieldRow>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-1.5">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register Pharmacy
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

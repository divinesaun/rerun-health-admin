import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, UserPlus } from "lucide-react";
import { adminPharmacyUserApi, adminPharmacyApi } from "@/lib/adminApi";

const userSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/\d/, "Must contain a number"),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  pharmacy_id: z.string().min(1, "Please select a pharmacy"),
  role: z.string().default("staff"),
});

type UserFormData = z.infer<typeof userSchema>;

export function AddPharmacyUserDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pharmacyData } = useQuery({
    queryKey: ["admin", "pharmacies"],
    queryFn: () => adminPharmacyApi.list(),
  });

  const pharmacies = pharmacyData?.pharmacies ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: "", password: "", name: "", pharmacy_id: "", role: "staff" },
  });

  const mutation = useMutation({
    mutationFn: (data: UserFormData) =>
      adminPharmacyUserApi.create({
        email: data.email,
        password: data.password,
        name: data.name || undefined,
        pharmacy_id: data.pharmacy_id,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pharmacy-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
      toast({ title: "User created", description: "Pharmacy user account created." });
      reset();
      setOpen(false);
    },
    onError: (err) => {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create user.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Pharmacy User
          </DialogTitle>
          <DialogDescription>
            Create a new staff account for a pharmacy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3 mt-2">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} placeholder="John Moyo" />
          </Field>

          <Field label="Email *" error={errors.email?.message}>
            <Input {...register("email")} type="email" placeholder="staff@pharmacy.co.zw" />
          </Field>

          <Field label="Password *" error={errors.password?.message}>
            <Input {...register("password")} type="password" placeholder="Min 8 chars with a number" />
          </Field>

          <Field label="Pharmacy *" error={errors.pharmacy_id?.message}>
            <Select value={watch("pharmacy_id")} onValueChange={(v) => setValue("pharmacy_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select pharmacy" />
              </SelectTrigger>
              <SelectContent>
                {pharmacies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Role" error={errors.role?.message}>
            <Select value={watch("role")} onValueChange={(v) => setValue("role", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-1.5">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

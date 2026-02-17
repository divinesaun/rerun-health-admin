import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  KeyRound,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { adminPharmacyUserApi, type PharmacyManagedUser } from "@/lib/adminApi";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/\d/, "Password must contain a number");

interface UserActionsDropdownProps {
  user: PharmacyManagedUser;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacy-users"] });
  };

  const resetMutation = useMutation({
    mutationFn: (password: string) =>
      adminPharmacyUserApi.resetPassword(user.id, { new_password: password }),
    onSuccess: () => {
      toast({ title: "Password reset", description: `Password reset for ${user.email}.` });
      setResetOpen(false);
      setNewPassword("");
      setPasswordError("");
      invalidateUsers();
    },
    onError: (err) => {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Failed to reset password.",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminPharmacyUserApi.activate(user.id),
    onSuccess: () => {
      toast({ title: "User activated", description: `${user.email} has been activated.` });
      invalidateUsers();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate user.", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => adminPharmacyUserApi.deactivate(user.id),
    onSuccess: () => {
      toast({ title: "User deactivated", description: `${user.email} has been deactivated.` });
      invalidateUsers();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate user.", variant: "destructive" });
    },
  });

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      setPasswordError(result.error.errors[0].message);
      return;
    }
    setPasswordError("");
    resetMutation.mutate(newPassword);
  };

  const isProcessing =
    activateMutation.isPending || deactivateMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setResetOpen(true)} className="gap-2">
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.is_active ? (
            <DropdownMenuItem
              onClick={() => deactivateMutation.mutate()}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <UserX className="h-3.5 w-3.5" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => activateMutation.mutate()} className="gap-2">
              <UserCheck className="h-3.5 w-3.5" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-medium text-foreground">{user.email}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetSubmit} className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Min 8 chars with a number"
                className="mt-1"
              />
              {passwordError && (
                <p className="mt-1 text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetOpen(false);
                  setNewPassword("");
                  setPasswordError("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetMutation.isPending} className="gap-1.5">
                {resetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

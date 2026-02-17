import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  KeyRound,
  Trash2,
  Loader2,
} from "lucide-react";
import { adminPharmacyUserApi, type PharmacyManagedUser } from "@/lib/adminApi";

interface UserActionsDropdownProps {
  user: PharmacyManagedUser;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "pharmacy-users"] });
  };

  const resetMutation = useMutation({
    mutationFn: () => adminPharmacyUserApi.resetPassword(user.id),
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: `A new one-time password has been emailed to ${user.email}.`,
      });
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

  const deleteMutation = useMutation({
    mutationFn: () => adminPharmacyUserApi.delete(user.id),
    onSuccess: () => {
      toast({ title: "User removed", description: `${user.email} has been removed.` });
      setDeleteOpen(false);
      invalidateUsers();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove user.", variant: "destructive" });
    },
  });

  const isProcessing = resetMutation.isPending || deleteMutation.isPending;

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
          <DropdownMenuItem
            onClick={() => resetMutation.mutate()}
            className="gap-2"
            disabled={resetMutation.isPending}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-medium text-foreground">{user.email}</span>?
              This action cannot be undone.
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

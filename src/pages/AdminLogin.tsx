import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(email, password);
      toast({ title: "Welcome, Admin", description: "You have been logged in." });
      navigate("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials.";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-background px-4 overflow-hidden">
      <div className="w-full max-w-sm space-y-4 sm:space-y-6">
        <div className="text-center">
          <img src="/favicon.ico" alt="RERUN Health" className="mx-auto h-10 w-10" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">RERUN Health</h1>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@rerunhealth.co.zw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <a href="/login" className="text-primary hover:underline">
            Go to Pharmacy Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

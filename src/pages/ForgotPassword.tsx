import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    // TODO: Replace with your FastAPI password reset endpoint
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-background px-4 overflow-hidden">
      <div className="w-full max-w-sm space-y-4 sm:space-y-6">
        <div className="text-center">
          <img src="/favicon.ico" alt="RERUN Health" className="mx-auto h-10 w-10" />
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">RERUN Health</h1>
          <p className="text-sm text-muted-foreground">Reset your password</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Forgot password</CardTitle>
            <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@healthplus.co.zw"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!sent && (
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              <ArrowLeft className="mr-1 inline h-3 w-3" />
              Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

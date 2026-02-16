import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Package, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  totalMedicines: number;
  inStockCount: number;
  onSettingsClick: () => void;
}

const DashboardHeader = ({ totalMedicines, inStockCount, onSettingsClick }: DashboardHeaderProps) => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💊</span>
          <div>
            <h1 className="text-lg font-bold text-foreground">RERUN Health AI</h1>
            <p className="text-xs text-muted-foreground">HealthPlus Pharmacy — Avondale, Harare</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{totalMedicines}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5">
            <span className="text-sm">✅</span>
            <span className="text-sm font-medium text-foreground">{inStockCount}</span>
            <span className="text-xs text-muted-foreground">In Stock</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">327</span>
            <span className="text-xs text-muted-foreground">Searches</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : "destructive"} className="hidden gap-1 sm:flex">
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? "Online" : "Offline"}
          </Badge>
          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

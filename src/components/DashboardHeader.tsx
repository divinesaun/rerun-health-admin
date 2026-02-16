import { Button } from "@/components/ui/button";
import { Settings, Wifi, WifiOff, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💊</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">RERUN Health AI</span>
            <span className="text-[11px] text-muted-foreground leading-tight">HealthPlus Pharmacy</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 w-[200px] pl-8 text-sm lg:w-[260px]"
              readOnly
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {!online && (
            <div className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1">
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-medium text-destructive">Offline</span>
            </div>
          )}

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onSettingsClick}>
            <Settings className="h-4 w-4" />
          </Button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            HP
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

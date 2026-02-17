import { useState } from "react";
import {
  Package,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TabType } from "@/types/pharmacy";

interface AppSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  pharmacyName?: string;
  userEmail?: string;
  alertCount?: number;
}

const mainNav: { title: string; value: TabType; icon: React.ElementType }[] = [
  { title: "Inventory", value: "inventory", icon: Package },
  { title: "Analytics", value: "analytics", icon: BarChart3 },
  { title: "Alerts", value: "alerts", icon: Bell },
  { title: "Settings", value: "settings", icon: Settings },
];

function SidebarNav({
  activeTab,
  onTabChange,
  onLogout,
  collapsed = false,
  pharmacyName = "Your Pharmacy",
  userEmail = "",
  alertCount = 0,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  collapsed?: boolean;
  pharmacyName?: string;
  userEmail?: string;
  alertCount?: number;
}) {
  const initials = pharmacyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            General
          </p>
        )}
        <ul className="space-y-1">
          {mainNav.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <li key={item.title}>
                <button
                  onClick={() => onTabChange(item.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                  {item.value === "alerts" && alertCount > 0 && !collapsed && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                  {item.value === "alerts" && alertCount > 0 && collapsed && (
                    <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-2">
        <button
          onClick={onLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>

        {!collapsed && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{pharmacyName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Desktop sidebar
export function AppSidebar({ activeTab, onTabChange, onLogout, pharmacyName, userEmail, alertCount }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r bg-background transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className={cn("flex h-16 items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">RERUN Health</p>
              <p className="text-[10px] text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <SidebarNav activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} collapsed={collapsed} pharmacyName={pharmacyName} userEmail={userEmail} alertCount={alertCount} />
    </aside>
  );
}

// Mobile sidebar (Sheet overlay)
export function MobileSidebar({ activeTab, onTabChange, onLogout, pharmacyName, userEmail, alertCount }: AppSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab);
    setOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">RERUN Health AI</p>
              <p className="text-[10px] text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
        </div>
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} pharmacyName={pharmacyName} userEmail={userEmail} alertCount={alertCount} />
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Store,
  BarChart3,
  MessageSquare,
  User,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Menu,
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

const mainNav: { title: string; value: TabType; icon: React.ElementType; badge?: "alert" }[] = [
  { title: "Dashboard", value: "dashboard", icon: LayoutDashboard },
  { title: "Inventory", value: "inventory", icon: Package, badge: "alert" },
  { title: "Profile & Settings", value: "profile", icon: Store },
  { title: "Analytics", value: "analytics", icon: BarChart3 },
  { title: "Inquiries", value: "inquiries", icon: MessageSquare },
  { title: "Account", value: "account", icon: User },
  { title: "Help & Support", value: "help", icon: HelpCircle },
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
  return (
    <>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {mainNav.map((item) => {
            const isActive = activeTab === item.value;
            return (
              <li key={item.value}>
                <button
                  onClick={() => onTabChange(item.value)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                  {item.badge === "alert" && alertCount > 0 && !collapsed && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                  {item.badge === "alert" && alertCount > 0 && collapsed && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
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
              <img src="/favicon.ico" alt="Logo" className="h-8 w-8 shrink-0 rounded-full" />
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
      <div className={cn("flex h-14 items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="h-7 w-7" />
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
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="h-7 w-7" />
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">RERUN Health</p>
              <p className="text-[10px] text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
        </div>
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} pharmacyName={pharmacyName} userEmail={userEmail} alertCount={alertCount} />
      </SheetContent>
    </Sheet>
  );
}

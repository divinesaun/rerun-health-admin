import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TabType } from "@/types/pharmacy";

interface AppSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}

const navItems: { title: string; value: TabType; icon: React.ElementType }[] = [
  { title: "Dashboard", value: "inventory", icon: LayoutDashboard },
  { title: "Inventory", value: "inventory", icon: Package },
  { title: "Analytics", value: "analytics", icon: BarChart3 },
  { title: "Alerts", value: "alerts", icon: Bell },
  { title: "Settings", value: "settings", icon: Settings },
];

const mainNav = navItems.filter((_, i) => i > 0);
const dashboardItem = navItems[0];

export function AppSidebar({ activeTab, onTabChange, onLogout }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-lg">💊</span>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">RERUN Health AI</p>
              <p className="text-[10px] text-muted-foreground">Pharmacy Dashboard</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="mb-2">
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
                    {item.value === "alerts" && !collapsed && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                        3
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
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
                HP
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">HealthPlus</p>
                <p className="truncate text-xs text-muted-foreground">admin@healthplus.co.zw</p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

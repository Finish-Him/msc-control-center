import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Terminal,
  Container,
  Github,
  Radio,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  LogOut,
  Plug,
  FolderOpen,
  Brain,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Painel",        path: "/" },
  { icon: Terminal,        label: "Terminal SSH",  path: "/terminal" },
  { icon: Container,       label: "Docker",        path: "/docker" },
  { icon: Github,          label: "GitHub",        path: "/github" },
  { icon: Radio,           label: "Gradio Apps",   path: "/gradio" },
  { icon: Plug,            label: "Integrações",   path: "/integrations" },
  { icon: FolderOpen,      label: "Arquivos VPS",  path: "/files" },
  { icon: Brain,           label: "HF Spaces",     path: "/spaces" },
  { icon: Monitor,         label: "Dev Local",     path: "/local" },
  { icon: KeyRound,        label: "Serviços",      path: "/services" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { admin, logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success("Saiu com sucesso");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "glass flex flex-col border-r border-white/5 transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="gradient-purple-blue rounded-lg p-2 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm gradient-text whitespace-nowrap">
              MSC Control
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "gradient-purple-blue text-white font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-2">
          {!collapsed && (
            <p className="text-xs text-muted-foreground px-2 truncate">
              {admin?.username}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 w-full transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 w-full transition-all"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

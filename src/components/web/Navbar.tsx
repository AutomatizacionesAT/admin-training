import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  DoorOpen,
  Fingerprint,
  GraduationCap,
  Home,
  LogOut,
  MonitorPlay,
  Rocket,
  UserCircle,
  Zap,
  UsersRound
} from "lucide-react";

const ATENTO_NAVY = "#1B365D";

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, isSuperAdmin, isCoordinador, salasUser, isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    toast.info('Has cerrado sesión');
    setShowLogoutModal(false);
  };

  const navLinks: { name: string; path: string; icon: LucideIcon }[] = [
    { name: "Inicio", path: "/", icon: Home },
    { name: "Simulador", path: "/simulator", icon: Zap },
    { name: "Web Training", path: "/web-training", icon: BookOpen },
    { name: "Usabilidad Web", path: "/usabilidad-web-training", icon: MonitorPlay },
    { name: "Biométrico", path: "/informe-biometrico", icon: Fingerprint },
    { name: "Agile Training", path: "/agile-training", icon: Rocket },
    { name: "Academy", path: "/academy", icon: GraduationCap },
    { name: "Cohorts", path: "/cohorts", icon: UsersRound },
    { name: "Salas", path: "/salas", icon: DoorOpen },
  ].filter((link) => {
    if (!isAuthenticated) {
      return link.path === '/' || link.path === '/salas';
    }
    if (link.path === '/usabilidad-web-training') {
      return isAdmin || isSuperAdmin || isCoordinador;
    }
    if (link.path === '/informe-biometrico') {
      return isAdmin || isSuperAdmin;
    }
    return true;
  });

  return (
    <>
    <nav
      className="sticky top-0 z-50 border-b border-white/10 shadow-[0_8px_32px_-12px_rgba(27,54,93,0.55)]"
      style={{ background: `linear-gradient(135deg, ${ATENTO_NAVY} 0%, #162d4d 55%, #12243d 100%)` }}
    >
      <div className="h-1 bg-linear-to-r from-transparent via-[#F37021] to-transparent opacity-90" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-[68px]">
          <div className="shrink-0 flex items-center">
            <Link to="/" className="group flex items-center gap-3 rounded-xl py-1 pr-2 transition-opacity hover:opacity-95">
              <div className="hidden sm:flex flex-col border-l border-white/15 pl-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F37021] leading-none">
                  Admin
                </span>
                <span className="text-sm font-medium text-white/85 leading-tight mt-0.5">
                  Training
                </span>
                <span className="text-[9px] font-semibold text-white/30 tracking-widest uppercase mt-0.5 leading-none">
                  v 1.5.8
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10 backdrop-blur-sm">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);

              return (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant="ghost"
                    className={`relative inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                      active
                        ? "bg-[#F37021] text-white shadow-[0_4px_14px_-4px_rgba(243,112,33,0.75)] hover:bg-[#e56618] hover:text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-[#F37021]/90"}`}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">{link.name}</span>
                    {active ? (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90" />
                    ) : null}
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogoutClick}
                className={`flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-all hover:cursor-pointer ${
                  isAdmin
                    ? "border-[#F37021]/70 bg-[#F37021]/10 text-white hover:bg-[#F37021]/20 hover:text-white"
                    : salasUser
                      ? "border-white/25 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                      : "border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title="Cerrar sesión"
              >
                <UserCircle className="h-4 w-4 shrink-0 text-[#F37021]" />
                <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                  {salasUser && salasUser.documento !== 'admin' ? salasUser.nombre.split(" ")[0] : "Admin Mode"}
                </span>
                <LogOut className="h-3.5 w-3.5 shrink-0 opacity-80" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
      
      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#1B365D] px-6 py-4 flex items-center gap-3">
              <LogOut className="w-5 h-5 text-[#F37021]" />
              <h3 className="text-white font-bold text-lg">Cerrar Sesión</h3>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6 text-center">
              <p className="text-slate-600 text-[15px]">
                ¿Estás seguro de que deseas cerrar tu sesión actual?
              </p>
            </div>
            
            {/* Footer / Actions */}
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#F37021] hover:bg-[#d95f10] shadow-md transition-colors flex items-center gap-2"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

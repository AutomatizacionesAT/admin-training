import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { UserCircle, LogOut, Lock } from "lucide-react";
import GlobalLoginModal from "./GlobalLoginModal";

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, salasUser, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isLoggedIn = isAdmin || !!salasUser;

  const handleLoginSuccess = (input: string): boolean => {
    const ok = login(input);
    if (ok) {
      toast.success('Sesión iniciada', {
        description: isAdmin ? 'Has iniciado sesión como administrador.' : `Bienvenido/a`,
      });
    }
    return ok;
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
      toast.info('Has cerrado sesión');
    }
  };

  const navLinks = [
    { name: "Inicio", path: "/" },
    { name: "Simulador", path: "/simulator" },
    { name: "Web Training", path: "/web-training" },
    { name: "Usabilidad Web", path: "/usabilidad-web-training" },
    { name: "Biométrico", path: "/informe-biometrico" },
    { name: "Agile Training", path: "/agile-training" },
    { name: "Academy", path: "/academy" },
    { name: "Salas", path: "/salas" },
  ];

  return (
    <>
      <nav className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo/Brand */}
            <div className="shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0047BA] rounded-xl flex items-center justify-center shadow-sm shadow-[#0047BA]/20">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#111c2d] font-bold text-lg hidden sm:block leading-tight">
                    Atento
                  </span>
                  <span className="text-gray-500 font-medium text-xs hidden sm:block leading-tight">
                    Admin Training
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant={isActive(link.path) ? "default" : "ghost"}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive(link.path)
                      ? "bg-[#0047BA] hover:bg-[#003ea6] text-white shadow-sm shadow-[#0047BA]/20"
                      : "text-gray-600 hover:text-[#0047BA] hover:bg-[#ecf1ff]"
                      }`}
                  >
                    {link.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right Section: Search & Admin */}
            <div className="flex items-center gap-3">

              <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

              <Button
                variant={isLoggedIn ? "outline" : "ghost"}
                onClick={isLoggedIn ? handleLogout : () => setShowLogin(true)}
                className={`flex items-center gap-2 rounded-full px-4 transition-all ${isAdmin
                    ? "border-[#8A2BE2] text-[#8A2BE2] hover:bg-[#8A2BE2]/10"
                    : salasUser
                      ? "border-indigo-400 text-indigo-600 hover:bg-indigo-50"
                      : "text-gray-500 hover:text-[#0047BA] hover:bg-gray-100"
                  }`}
                title={isLoggedIn ? "Cerrar sesión" : "Iniciar sesión"}
              >
                {isLoggedIn ? (
                  <>
                    <UserCircle className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">
                      {isAdmin ? "Admin Mode" : salasUser?.nombre.split(" ")[0]}
                    </span>
                    <LogOut className="w-4 h-4 ml-1 opacity-70" />
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Login</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {showLogin && (
        <GlobalLoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  );
}

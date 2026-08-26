import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import Home from "@/components/app/page";
import Simulator from "@/components/app/simulator/Simulator";
import Navbar from "@/components/web/Navbar";
import WebTraining from "./components/app/web_training/WebTraining";
import UsabilidadWebTraining from "./components/app/usabilidad_web_training/UsabilidadWebTraining";
import InformeBiometrico from "./components/app/informe_biometrico/InformeBiometrico";
import Salas from "./components/app/Salas/Salas";
import AgileTraining from "./components/app/agile_training/AgileTraining";
import Academy from "./components/app/academy/Academy";
import Cohorts from "./components/app/cohorts/Cohorts";

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireAccess({ children, allow }: { children: ReactNode; allow: boolean }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated || !allow) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { canAccessBiometrico, canAccessUsabilidad } = useAuth();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 ">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<RequireAuth><Simulator /></RequireAuth>} />
          <Route path="/web-training" element={<RequireAuth><WebTraining /></RequireAuth>} />
          <Route path="/usabilidad-web-training" element={<RequireAccess allow={canAccessUsabilidad}><UsabilidadWebTraining /></RequireAccess>} />
          <Route path="/informe-biometrico" element={<RequireAccess allow={canAccessBiometrico}><InformeBiometrico /></RequireAccess>} />
          <Route path="/salas" element={<Salas />} />
          <Route path="/agile-training" element={<RequireAuth><AgileTraining /></RequireAuth>} />
          <Route path="/academy" element={<RequireAuth><Academy /></RequireAuth>} />
          <Route path="/cohorts" element={<RequireAuth><Cohorts /></RequireAuth>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

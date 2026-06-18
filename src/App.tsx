import { Route, Routes } from "react-router-dom";
import Home from "@/components/app/page";
import Simulator from "@/components/app/simulator/Simulator";
import Navbar from "@/components/web/Navbar";
import WebTraining from "./components/app/web_training/WebTraining";
import UsabilidadWebTraining from "./components/app/usabilidad_web_training/UsabilidadWebTraining";
import InformeBiometrico from "./components/app/informe_biometrico/InformeBiometrico";
import Salas from "./components/app/Salas/Salas";
import AgileTraining from "./components/app/agile_training/AgileTraining";
import Academy from "./components/app/academy/Academy";

import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/web-training" element={<WebTraining />} />
          <Route path="/usabilidad-web-training" element={<UsabilidadWebTraining />} />
          <Route path="/informe-biometrico" element={<InformeBiometrico />} />
          <Route path="/salas" element={<Salas />} />
          <Route path="/agile-training" element={<AgileTraining />} />
          <Route path="/academy" element={<Academy />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;

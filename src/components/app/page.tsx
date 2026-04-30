import { Link } from "react-router-dom";
import { ArrowRight, MonitorPlay, BookOpen, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative w-full min-h-[calc(100vh-72px)] bg-white overflow-hidden font-['Inter',sans-serif]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#0047BA]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#8A2BE2]/5 blur-[100px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col justify-center min-h-[calc(100vh-72px)] relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 py-12 lg:py-0">
          
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0047BA]/10 text-[#0047BA] text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0047BA] animate-pulse"></span>
              Plataforma Oficial Atento
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#111c2d] leading-[1.1] tracking-tight mb-6">
              Entrenamiento <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0047BA] to-[#8A2BE2]">
                Inmersivo y Avanzado
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
              Bienvenido al centro de capacitación. Desarrolla tus habilidades operativas, 
              experimenta escenarios reales en el simulador y mejora la usabilidad 
              con nuestras herramientas interactivas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/simulator">
                <Button className="w-full sm:w-auto h-14 px-8 bg-[#0047BA] hover:bg-[#003ea6] text-white rounded-xl text-lg font-medium shadow-lg shadow-[#0047BA]/20 transition-all hover:-translate-y-0.5">
                  Iniciar Simulador
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/web-training">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-2 border-gray-200 text-[#111c2d] hover:border-[#8A2BE2] hover:text-[#8A2BE2] hover:bg-transparent rounded-xl text-lg font-medium transition-all">
                  Explorar Módulos
                </Button>
              </Link>
            </div>
          </div>

          {/* Features / Presentation Cards */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="grid gap-4">
              
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xl shadow-gray-200/50 flex items-start gap-5 hover:border-[#0047BA]/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#0047BA]/10 flex items-center justify-center shrink-0">
                  <MonitorPlay className="w-6 h-6 text-[#0047BA]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Simulador Práctico</h3>
                  <p className="text-gray-500 leading-relaxed">Entorno seguro para practicar gestiones complejas sin afectar sistemas reales.</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xl shadow-gray-200/50 flex items-start gap-5 hover:border-[#8A2BE2]/30 transition-colors ml-0 lg:ml-8">
                <div className="w-12 h-12 rounded-full bg-[#8A2BE2]/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-[#8A2BE2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Web Training</h3>
                  <p className="text-gray-500 leading-relaxed">Biblioteca completa de teoría, procesos y guías de actuación actualizadas.</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xl shadow-gray-200/50 flex items-start gap-5 hover:border-[#0047BA]/30 transition-colors ml-0 lg:ml-16">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Análisis Biométrico</h3>
                  <p className="text-gray-500 leading-relaxed">Estudios de usabilidad y seguimiento ocular para optimizar las interfaces.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

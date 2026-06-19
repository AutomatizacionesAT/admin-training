import { MonitorPlay, BookOpen, Fingerprint, Rocket, DoorOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="relative w-full min-h-[calc(100vh-72px)] overflow-hidden bg-linear-to-br from-white via-slate-50 to-blue-50 font-['Inter',sans-serif]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-[#0047BA]/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#8A2BE2]/8 blur-[100px]" />
        <div className="absolute inset-x-0 top-16 mx-auto h-px max-w-[1320px] bg-linear-to-r from-transparent via-[#0047BA]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-16 mx-auto h-px max-w-[1240px] bg-linear-to-r from-transparent via-[#8A2BE2]/20 to-transparent" />
        <div className="absolute left-1/2 top-20 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-white/40 bg-white/20 blur-3xl" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col justify-center min-h-[calc(100vh-72px)] relative z-10">

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 py-12 lg:py-0">

          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0047BA]/10 text-[#0047BA] text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0047BA] animate-pulse"></span>
              Admin Training
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#111c2d] leading-[1.1] tracking-tight mb-6">
              Admin Training para <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0047BA] to-[#8A2BE2]">
                E-Learning Solutions
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
              Centro operativo para el equipo de E-Learning Solutions. Consulta
              usabilidad, proyecciones, biométrico, agile training, academy y salas
              desde una sola experiencia administrativa.
            </p>
          </div>

          {/* Features / Presentation Cards */}
          <div className="home-cards-stage flex-1 w-full max-w-lg lg:max-w-none">
            <div className="grid gap-4 md:grid-cols-2">

              <div className="home-feature-card home-feature-card-delay-1 bg-white/90 backdrop-blur-sm border border-white/70 rounded-2xl p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] flex items-start gap-5 hover:border-[#0047BA]/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-[#0047BA]/10 flex items-center justify-center shrink-0">
                  <MonitorPlay className="w-6 h-6 text-[#0047BA]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Usabilidad Web</h3>
                  <p className="text-gray-500 leading-relaxed">Realiza el seguimiento de la usabilidad de las web</p>
                </div>
              </div>

              <div className="home-feature-card home-feature-card-delay-2 bg-white/90 backdrop-blur-sm border border-white/70 rounded-2xl p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] flex items-start gap-5 hover:border-[#8A2BE2]/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-[#8A2BE2]/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-[#8A2BE2]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Web Training y Simulator</h3>
                  <p className="text-gray-500 leading-relaxed">Valida en que estado se encuentra tu solicitud de desarrollo.</p>
                </div>
              </div>

              <div className="home-feature-card home-feature-card-delay-3 bg-white/90 backdrop-blur-sm border border-white/70 rounded-2xl p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] flex items-start gap-5 hover:border-[#0047BA]/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Agile Training - Academy</h3>
                  <p className="text-gray-500 leading-relaxed">Sigue el avance de lanzamiento, piloto, meta y cumplimiento por campaña y migración hacia Atento Academy.</p>
                </div>
              </div>

              <div className="home-feature-card home-feature-card-delay-4 bg-white/90 backdrop-blur-sm border border-white/70 rounded-2xl p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] flex items-start gap-5 hover:border-[#0047BA]/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Biométrico</h3>
                  <p className="text-gray-500 leading-relaxed">Estudio de usabilidad y seguimiento de acceso biometrico de coordinadores</p>
                </div>
              </div>

              <div className="home-feature-card home-feature-card-delay-5 bg-white/90 backdrop-blur-sm border border-white/70 rounded-2xl p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] flex items-start gap-5 hover:border-[#0047BA]/30 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                  <DoorOpen className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111c2d] mb-1">Salas</h3>
                  <p className="text-gray-500 leading-relaxed">Consulta, diligencia y da seguimiento al uso de salas, su estado y la disponibilidad operativa.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { LogIn, MonitorPlay, BookOpen, Fingerprint, Rocket, DoorOpen } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import GlobalLoginModal from '../web/GlobalLoginModal';

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginSuccess = (input: string): boolean => {
    const ok = login(input);
    if (ok) {
      toast.success('Sesión iniciada', {
        description: input.trim() === 'desarrollo2026' ? 'Has iniciado sesión como administrador.' : 'Acceso concedido.',
      });
      setShowLogin(false);
    }
    return ok;
  };

  return (
    <main className={`relative w-full h-full overflow-hidden bg-linear-to-br from-white via-slate-50 to-blue-50 font-['Inter',sans-serif]`}>
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-[#005082]/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#F37021]/8 blur-[100px]" />
        <div className="absolute inset-x-0 top-16 mx-auto h-px max-w-[1320px] bg-linear-to-r from-transparent via-[#005082]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-16 mx-auto h-px max-w-[1240px] bg-linear-to-r from-transparent via-[#F37021]/20 to-transparent" />
        <div className="absolute left-1/2 top-20 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-white/40 bg-white/20 blur-3xl" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col justify-center h-full relative z-10">

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 2xl:gap-16 py-6 lg:py-3 2xl:py-0">

          <div className="flex-1 max-w-xl lg:max-w-xs 2xl:max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#005082]/10 text-[#005082] text-xs lg:text-sm font-semibold mb-2 lg:mb-3 2xl:mb-6">
              <span className="w-2 h-2 rounded-full bg-[#F37021] animate-pulse"></span>
              Admin Training
            </div>

            <h1 style={{fontSize: 'clamp(1.6rem, 2.8vw, 3.75rem)'}} className="font-extrabold text-[#111c2d] leading-[1.1] tracking-tight mb-3 lg:mb-4 2xl:mb-6">
              Admin Training para <br />
              <span className="text-[#005082]">
                E-Learning Solutions
              </span>
            </h1>

            <p style={{fontSize: 'clamp(0.78rem, 1.1vw, 1.125rem)'}} className="text-gray-500 mb-4 lg:mb-5 2xl:mb-10 leading-relaxed max-w-xl">
              Centro operativo para el equipo de E-Learning Solutions. Consulta
              usabilidad, proyecciones, biométrico, agile training, academy y salas
              desde una sola experiencia administrativa.
            </p>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white bg-[#F37021] hover:bg-[#d95f10] transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>

            ) : null}
          </div>

          {/* Features / Presentation Cards */}
          <div className="home-cards-stage flex-1 w-full max-w-lg lg:max-w-sm xl:max-w-md 2xl:max-w-none">
            <div className="grid gap-2 lg:gap-2.5 2xl:gap-3 md:grid-cols-2">

              {/* Card 1 - Navy */}
              <div className="home-feature-card home-feature-card-delay-1 group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,80,130,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(0,80,130,0.22)] transition-all duration-300 hover:-translate-y-1.5 cursor-default">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#005082] to-[#0077b6]" />
                <div className="p-4 2xl:p-6">
                  <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-br from-[#005082] to-[#0077b6] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(0,80,130,0.3)]">
                    <MonitorPlay className="w-4 h-4 2xl:w-5 2xl:h-5 text-white" />
                  </div>
                  <h3 className="text-sm 2xl:text-base font-bold text-[#111c2d] mb-1 group-hover:text-[#005082] transition-colors duration-200">Usabilidad Web</h3>
                  <p className="text-xs 2xl:text-sm text-slate-400 leading-relaxed">Realiza el seguimiento de la usabilidad de las web</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-7 h-7 rounded-full bg-[#005082]/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#005082]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Card 2 - Orange */}
              <div className="home-feature-card home-feature-card-delay-2 group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(243,112,33,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(243,112,33,0.22)] transition-all duration-300 hover:-translate-y-1.5 cursor-default">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F37021] to-[#f59342]" />
                <div className="p-4 2xl:p-6">
                  <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-br from-[#F37021] to-[#f59342] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(243,112,33,0.3)]">
                    <BookOpen className="w-4 h-4 2xl:w-5 2xl:h-5 text-white" />
                  </div>
                  <h3 className="text-sm 2xl:text-base font-bold text-[#111c2d] mb-1 group-hover:text-[#F37021] transition-colors duration-200">Web Training y Simulator</h3>
                  <p className="text-xs 2xl:text-sm text-slate-400 leading-relaxed">Valida en que estado se encuentra tu solicitud de desarrollo.</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-7 h-7 rounded-full bg-[#F37021]/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#F37021]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Card 3 - Navy */}
              <div className="home-feature-card home-feature-card-delay-3 group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,80,130,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(0,80,130,0.22)] transition-all duration-300 hover:-translate-y-1.5 cursor-default">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#005082] to-[#0077b6]" />
                <div className="p-4 2xl:p-6">
                  <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-br from-[#005082] to-[#0077b6] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(0,80,130,0.3)]">
                    <Rocket className="w-4 h-4 2xl:w-5 2xl:h-5 text-white" />
                  </div>
                  <h3 className="text-sm 2xl:text-base font-bold text-[#111c2d] mb-1 group-hover:text-[#005082] transition-colors duration-200">Agile Training - Academy</h3>
                  <p className="text-xs 2xl:text-sm text-slate-400 leading-relaxed">Sigue el avance de lanzamiento, piloto, meta y cumplimiento por campaña y migración hacia Atento Academy.</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-7 h-7 rounded-full bg-[#005082]/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#005082]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Card 4 - Orange */}
              <div className="home-feature-card home-feature-card-delay-4 group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(243,112,33,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(243,112,33,0.22)] transition-all duration-300 hover:-translate-y-1.5 cursor-default">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#F37021] to-[#f59342]" />
                <div className="p-4 2xl:p-6">
                  <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-br from-[#F37021] to-[#f59342] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(243,112,33,0.3)]">
                    <Fingerprint className="w-4 h-4 2xl:w-5 2xl:h-5 text-white" />
                  </div>
                  <h3 className="text-sm 2xl:text-base font-bold text-[#111c2d] mb-1 group-hover:text-[#F37021] transition-colors duration-200">Biométrico</h3>
                  <p className="text-xs 2xl:text-sm text-slate-400 leading-relaxed">Estudio de usabilidad y seguimiento de acceso biometrico de coordinadores</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-7 h-7 rounded-full bg-[#F37021]/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#F37021]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>

              {/* Card 5 - Navy wide */}
              <div className="home-feature-card home-feature-card-delay-5 group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,80,130,0.12)] hover:shadow-[0_12px_40px_-8px_rgba(0,80,130,0.22)] transition-all duration-300 hover:-translate-y-1.5 cursor-default md:col-span-2">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#005082] via-[#0077b6] to-[#F37021]" />
                <div className="p-4 2xl:p-6 flex items-start gap-4">
                  <div className="w-9 h-9 2xl:w-11 2xl:h-11 rounded-xl bg-gradient-to-br from-[#005082] to-[#0077b6] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(0,80,130,0.3)]">
                    <DoorOpen className="w-4 h-4 2xl:w-5 2xl:h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm 2xl:text-base font-bold text-[#111c2d] mb-1 group-hover:text-[#005082] transition-colors duration-200">Salas</h3>
                    <p className="text-xs 2xl:text-sm text-slate-400 leading-relaxed">Consulta, diligencia y da seguimiento al uso de salas, su estado y la disponibilidad operativa.</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-[#005082]/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-[#005082]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {showLogin ? (
        <GlobalLoginModal
          onLogin={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
        />
      ) : null}
    </main>
  );
}

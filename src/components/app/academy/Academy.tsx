import { GraduationCap, Sparkles } from 'lucide-react';

export default function Academy() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-[#0b1f3a] via-[#10376a] to-[#24479d] px-6 py-10 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100 ring-1 ring-white/15">
              Academy
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Migraci&oacute;n y seguimiento de Atento Academy</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Esta secci&oacute;n quedar&aacute; enfocada en el control de migraci&oacute;n de cursos, archivos y contenidos desde Moodle hacia Atento Academy.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white/6 p-5 ring-1 ring-white/10 lg:w-[360px]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3 text-blue-50 ring-1 ring-white/15">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Pr&oacute;xima fase</p>
                <p className="mt-2 text-xl font-bold text-white">Base inicial creada</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Lista para evolucionar hacia un dashboard de migraci&oacute;n con visibilidad de cursos, estados y trazabilidad de contenidos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-[1440px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Componente base listo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              El siguiente paso ser&aacute; conectar esta vista con la misma hoja de trabajo para mostrar el avance de la migraci&oacute;n, sus responsables y el estado de cada entregable dentro de Atento Academy.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

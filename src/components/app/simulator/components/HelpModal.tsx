interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Encabezado sticky */}
        <div className="sticky top-0 bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center shadow-lg z-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">📚 Guía de Uso</h2>
            <p className="text-blue-100 text-sm">Aprende a usar todas las funcionalidades del sistema</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-blue-600 rounded-full w-10 h-10 flex items-center justify-center transition-all text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-8 space-y-6">

          {/* Pestañas principales */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📑 Las Dos Pestañas Principales</h3>

            <div className="mb-6 bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-5 border-l-4 border-blue-500">
              <h4 className="text-lg font-bold text-blue-900 mb-3">📅 Pestaña: Calendario</h4>
              <ul className="space-y-2 text-gray-700">
                {[
                  ["Vista del calendario:", "Muestra todos los días del mes actual (excluyendo domingos)."],
                  ["Días con procesos:", "Los días con procesos activos se destacan con colores y puntos indicadores."],
                  ["Navegación:", "Usa las flechas ◀ ▶ en el calendario para cambiar de mes."],
                  ["Selección de día:", "Haz clic en cualquier día para ver los procesos activos en el panel inferior derecho."],
                  ["Campañas Activas:", "En el panel inferior izquierdo verás un resumen de todas las campañas activas en el mes actual."],
                ].map(([label, desc]) => (
                  <li key={label} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <div><strong>{label}</strong> {desc}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-linear-to-r from-purple-50 to-pink-100 rounded-lg p-5 border-l-4 border-purple-500">
              <h4 className="text-lg font-bold text-purple-900 mb-3">📊 Pestaña: Reporte Gerencial</h4>
              <ul className="space-y-2 text-gray-700">
                {[
                  ["Visión Global:", "Un panel interactivo con el estado general de los simuladores."],
                  ["Direcciones y Coordinadores:", "Visualiza la cantidad de simuladores asignados a cada dirección y coordinador, junto con sus porcentajes de participación."],
                ].map(([label, desc]) => (
                  <li key={label} className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold mt-1">•</span>
                    <div><strong>{label}</strong> {desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Estados */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🚦 Estados de los Procesos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { emoji: "✅", label: "Completado", desc: "El proceso ha finalizado exitosamente", cls: "from-green-100 to-green-200 border-green-400", textCls: "text-green-900", descCls: "text-green-800" },
                { emoji: "⏳", label: "En Curso", desc: "El proceso está actualmente en desarrollo", cls: "from-yellow-100 to-orange-200 border-yellow-400", textCls: "text-orange-900", descCls: "text-orange-800" },
                { emoji: "📋", label: "Pendiente", desc: "El proceso aún no ha comenzado", cls: "from-gray-100 to-gray-200 border-gray-400", textCls: "text-gray-900", descCls: "text-gray-800" },
              ].map(({ emoji, label, desc, cls, textCls, descCls }) => (
                <div key={label} className={`bg-linear-to-br ${cls} rounded-lg p-4 border-2`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{emoji}</span>
                    <span className={`font-bold ${textCls}`}>{label}</span>
                  </div>
                  <p className={`text-sm ${descCls}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consejos */}
          <div className="bg-linear-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300">
            <h3 className="text-xl font-bold text-amber-900 mb-4">💡 Consejos Útiles</h3>
            <ul className="space-y-3 text-gray-700">
              {[
                { emoji: "🎨", label: "Colores en el calendario:", desc: "Los días se colorean según la cantidad de procesos activos. Más intenso = más procesos." },
                { emoji: "🔄", label: "Actualización automática:", desc: "Los datos se cargan automáticamente desde Google Sheets al abrir la página." },
                { emoji: "📱", label: "Responsive:", desc: "La interfaz se adapta a diferentes tamaños de pantalla (móvil, tablet, escritorio)." },
                { emoji: "🔍", label: "Búsqueda rápida:", desc: "En la pestaña de campañas, puedes buscar por nombre para encontrar rápidamente lo que necesitas." },
              ].map(({ emoji, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div><strong>{label}</strong> {desc}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Funciones rápidas */}
          <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 shadow-sm">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">⚡ Funciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { emoji: "👆", title: "Clic en día", desc: "Ver procesos activos ese día" },
                { emoji: "📅", title: "Flechas calendario", desc: "Navegar entre meses" },
                { emoji: "🔍", title: "Buscar campaña", desc: "Filtrar por nombre en tiempo real" },
                { emoji: "📊", title: "Clic en campaña", desc: "Ver estadísticas completas" },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="text-2xl">{emoji}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 bg-linear-to-r from-gray-100 to-gray-200 p-6 rounded-b-2xl flex justify-center border-t-2 border-gray-300">
          <button
            onClick={onClose}
            className="bg-linear-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            ¡Entendido! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

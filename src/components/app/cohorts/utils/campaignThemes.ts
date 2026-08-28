// ============================================================
//  COHORTS — Catálogo de Temas, Colores y Logos por Campaña
//  Ubicación de logos: Coloca las imágenes PNG/SVG en:
//  /public/cohorts/logos/[nombre-archivo].png
// ============================================================

export interface CampaignTheme {
  campana: string;
  nombreComercial: string;
  colorPrimario: string;      // Color base de la marca (Hex)
  colorSecundario: string;    // Color de contraste oscuro (Hex)
  colorAcento: string;        // Color para bordes y detalles (Hex)
  colorTexto: string;         // 'text-white' o 'text-slate-900'
  gradientHeader: string;     // Gradiente para la cabecera
  badgeStyle: string;         // Clases de Tailwind para chips y etiquetas
  logoUrl?: string;           // Ruta pública a la imagen del logo
  bandera?: string;           // Emoji de país o región
}

/**
 * Tema por defecto cuando no hay campaña seleccionada o es general
 */
export const DEFAULT_CAMPAIGN_THEME: CampaignTheme = {
  campana: "GENERAL",
  nombreComercial: "ADMIN TRAINING",
  colorPrimario: "#1a355b",
  colorSecundario: "#0c1e36",
  colorAcento: "#f59e0b",
  colorTexto: "text-white",
  gradientHeader: "linear-gradient(135deg, #0c1e36 0%, #142e50 50%, #0c1e36 100%)",
  badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  logoUrl: "/atento-logo.png",
  bandera: "🇨🇴 Global",
};

/**
 * Diccionario de configuración de temas por cada una de las 17 campañas
 */
export const CAMPAIGN_THEMES: Record<string, CampaignTheme> = {
  // ── 1. FALABELLA ───────────────────────────────────────────
  FALABELLA: {
    campana: "FALABELLA",
    nombreComercial: "Falabella",
    colorPrimario: "#43b02a",
    colorSecundario: "#164e1c",
    colorAcento: "#a7f3d0",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #103814 0%, #1e6b26 45%, #389e24 100%)",
    badgeStyle: "bg-emerald-400/25 text-emerald-200 border-emerald-400/40",
    logoUrl: "/cohorts/logos/Falabella.png",
    bandera: "🇨🇱 Chile / Retail",
  },

  // ── 2. BANCO POPULAR ───────────────────────────────────────
  "BANCO POPULAR": {
    campana: "BANCO POPULAR",
    nombreComercial: "Banco Popular",
    colorPrimario: "#007a3d",
    colorSecundario: "#004d25",
    colorAcento: "#ffcc00",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #004d25 0%, #007a3d 50%, #003318 100%)",
    badgeStyle: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30",
    logoUrl: "/cohorts/logos/banco-popular.png",
    bandera: "🇨🇴 Colombia / Banca",
  },

  // ── 3. BBVA (General, SAC y Ventas) ────────────────────────
  BBVA: {
    campana: "BBVA",
    nombreComercial: "BBVA",
    colorPrimario: "#004481",
    colorSecundario: "#042c4a",
    colorAcento: "#00d4e4",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #042c4a 0%, #004481 50%, #021a2d 100%)",
    badgeStyle: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
    logoUrl: "/cohorts/logos/bbva.png",
    bandera: "🇨🇴 Colombia / Banca",
  },
  "BBVA SAC": {
    campana: "BBVA SAC",
    nombreComercial: "BBVA SAC",
    colorPrimario: "#004481",
    colorSecundario: "#042c4a",
    colorAcento: "#00d4e4",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #042c4a 0%, #004481 50%, #021a2d 100%)",
    badgeStyle: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
    logoUrl: "/cohorts/logos/bbva.png",
    bandera: "🇨🇴 Colombia / Servicio",
  },
  "BBVA VENTAS": {
    campana: "BBVA VENTAS",
    nombreComercial: "BBVA Ventas",
    colorPrimario: "#004481",
    colorSecundario: "#042c4a",
    colorAcento: "#18dcff",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #042c4a 0%, #004481 50%, #021a2d 100%)",
    badgeStyle: "bg-sky-400/20 text-sky-300 border-sky-400/30",
    logoUrl: "/cohorts/logos/bbva.png",
    bandera: "🇨🇴 Colombia / Comercial",
  },

  // ── 4. CLARO CHILE ─────────────────────────────────────────
  "CLARO CHILE VENTAS MOVILES": {
    campana: "CLARO CHILE VENTAS MOVILES",
    nombreComercial: "Claro Chile",
    colorPrimario: "#da291c",
    colorSecundario: "#8a0e05",
    colorAcento: "#ff6b6b",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #8a0e05 0%, #da291c 50%, #5e0802 100%)",
    badgeStyle: "bg-rose-400/20 text-rose-300 border-rose-400/30",
    logoUrl: "/cohorts/logos/claro.png",
    bandera: "🇨🇱 Chile / Telco",
  },

  // ── 5. COLMENA Y COLMENA SEGUROS ───────────────────────────
  COLMENA: {
    campana: "COLMENA",
    nombreComercial: "Colmena Seguros",
    colorPrimario: "#ea580c",
    colorSecundario: "#9a3412",
    colorAcento: "#fed7aa",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)",
    badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    logoUrl: "/cohorts/logos/colmena.png",
    bandera: "🇨🇴 Colombia / Seguros",
  },
  "COLMENA SEGUROS GENERALES": {
    campana: "COLMENA SEGUROS GENERALES",
    nombreComercial: "Colmena Seguros Generales",
    colorPrimario: "#ea580c",
    colorSecundario: "#9a3412",
    colorAcento: "#fed7aa",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #9a3412 100%)",
    badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    logoUrl: "/cohorts/logos/colmena.png",
    bandera: "🇨🇴 Colombia / Seguros",
  },

  // ── 6. DALE COLOMBIA ───────────────────────────────────────
  "DALE COLOMBIA FUERZA MOVIL": {
    campana: "DALE COLOMBIA FUERZA MOVIL",
    nombreComercial: "Dale! Colombia",
    colorPrimario: "#4f46e5",
    colorSecundario: "#312e81",
    colorAcento: "#a5b4fc",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #1e1b4b 100%)",
    badgeStyle: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
    logoUrl: "/cohorts/logos/dale.png",
    bandera: "🇨🇴 Colombia / Fintech",
  },
  "DALE FUERZA DE VENTAS MOVILES": {
    campana: "DALE FUERZA DE VENTAS MOVILES",
    nombreComercial: "Dale! Ventas Móviles",
    colorPrimario: "#4f46e5",
    colorSecundario: "#312e81",
    colorAcento: "#a5b4fc",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #1e1b4b 100%)",
    badgeStyle: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
    logoUrl: "/cohorts/logos/dale.png",
    bandera: "🇨🇴 Colombia / Fintech",
  },

  // ── 7. DUSFAL ──────────────────────────────────────────────
  DUSFAL: {
    campana: "DUSFAL",
    nombreComercial: "DUSFAL",
    colorPrimario: "#0891b2",
    colorSecundario: "#164e63",
    colorAcento: "#67e8f9",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #164e63 0%, #0891b2 50%, #0e3b4a 100%)",
    badgeStyle: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
    logoUrl: "/cohorts/logos/dusfal.png",
    bandera: "🇨🇴 Colombia",
  },

  // ── 8. MOVISTAR / TELEFÓNICA ───────────────────────────────
  "MOVISTAR RESIDENCIAL CONTRATO": {
    campana: "MOVISTAR RESIDENCIAL CONTRATO",
    nombreComercial: "Movistar Residencial",
    colorPrimario: "#019df4",
    colorSecundario: "#0b2746",
    colorAcento: "#5bc500",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #0b2746 0%, #019df4 50%, #06192d 100%)",
    badgeStyle: "bg-sky-400/20 text-sky-300 border-sky-400/30",
    logoUrl: "/cohorts/logos/movistar.png",
    bandera: "🇨🇴 Residencial",
  },
  "MOVISTAR-I-SAC FIDELIZACION": {
    campana: "MOVISTAR-I-SAC FIDELIZACION",
    nombreComercial: "Movistar Fidelización",
    colorPrimario: "#019df4",
    colorSecundario: "#0b2746",
    colorAcento: "#5bc500",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #0b2746 0%, #019df4 50%, #06192d 100%)",
    badgeStyle: "bg-sky-400/20 text-sky-300 border-sky-400/30",
    logoUrl: "/cohorts/logos/movistar.png",
    bandera: "🇨🇴 SAC",
  },
  "RESIDENCIAL CONTRATO": {
    campana: "RESIDENCIAL CONTRATO",
    nombreComercial: "Residencial Contrato",
    colorPrimario: "#0284c7",
    colorSecundario: "#0c4a6e",
    colorAcento: "#38bdf8",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #082f49 100%)",
    badgeStyle: "bg-sky-400/20 text-sky-300 border-sky-400/30",
    logoUrl: "/cohorts/logos/movistar.png",
    bandera: "🇨🇴 Telco",
  },
  "TELEFONICA MÉXICO": {
    campana: "TELEFONICA MÉXICO",
    nombreComercial: "Telefónica México",
    colorPrimario: "#019df4",
    colorSecundario: "#082340",
    colorAcento: "#5bc500",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #082340 0%, #019df4 50%, #041221 100%)",
    badgeStyle: "bg-sky-400/20 text-sky-300 border-sky-400/30",
    logoUrl: "/cohorts/logos/telefonica.png",
    bandera: "🇲🇽 México / Telco",
  },

  // ── 9. SURA ────────────────────────────────────────────────
  SURA: {
    campana: "SURA",
    nombreComercial: "SURA",
    colorPrimario: "#0033a0",
    colorSecundario: "#001e60",
    colorAcento: "#ffcb05",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #001e60 0%, #0033a0 50%, #00123a 100%)",
    badgeStyle: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    logoUrl: "/cohorts/logos/sura.png",
    bandera: "🇨🇴 Colombia / Seguros",
  },

  // ── 10. ABC ────────────────────────────────────────────────
  ABC: {
    campana: "ABC",
    nombreComercial: "ABC Seguros",
    colorPrimario: "#7c3aed",
    colorSecundario: "#4c1d95",
    colorAcento: "#c4b5fd",
    colorTexto: "text-white",
    gradientHeader: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #2e1065 100%)",
    badgeStyle: "bg-purple-400/20 text-purple-300 border-purple-400/30",
    logoUrl: "/cohorts/logos/abc.png",
    bandera: "🇨🇴 Operaciones",
  },
};

/**
 * Función que obtiene el tema según el nombre de la campaña seleccionada
 */
export function getCampaignTheme(campanaName: string | null | undefined): CampaignTheme {
  if (!campanaName) return DEFAULT_CAMPAIGN_THEME;

  const upper = campanaName.toUpperCase().trim();

  // 1. Coincidencia directa
  if (CAMPAIGN_THEMES[upper]) {
    return CAMPAIGN_THEMES[upper];
  }

  // 2. Coincidencia parcial inteligente
  if (upper.includes("FALABELLA")) return CAMPAIGN_THEMES["FALABELLA"];
  if (upper.includes("POPULAR")) return CAMPAIGN_THEMES["BANCO POPULAR"];
  if (upper.includes("BBVA")) return CAMPAIGN_THEMES["BBVA"];
  if (upper.includes("CLARO")) return CAMPAIGN_THEMES["CLARO CHILE VENTAS MOVILES"];
  if (upper.includes("COLMENA")) return CAMPAIGN_THEMES["COLMENA"];
  if (upper.includes("DALE")) return CAMPAIGN_THEMES["DALE COLOMBIA FUERZA MOVIL"];
  if (upper.includes("DUSFAL")) return CAMPAIGN_THEMES["DUSFAL"];
  if (upper.includes("MOVISTAR")) return CAMPAIGN_THEMES["MOVISTAR RESIDENCIAL CONTRATO"];
  if (upper.includes("TELEFONICA") || upper.includes("MEXICO")) return CAMPAIGN_THEMES["TELEFONICA MÉXICO"];
  if (upper.includes("SURA")) return CAMPAIGN_THEMES["SURA"];
  if (upper.includes("ABC")) return CAMPAIGN_THEMES["ABC"];

  // 3. Fallback con el nombre dinámico
  return {
    ...DEFAULT_CAMPAIGN_THEME,
    campana: upper,
    nombreComercial: upper,
  };
}

/* =============================================================================
   AQUÍ VA TU JSON  ->  data/campanas-info.ts
   -----------------------------------------------------------------------------
   Este es el archivo que tú llenas a mano. La clave de cada entrada es el
   NOMBRE DE LA CAMPAÑA (igual que viene en tu data: record.campana).

   No importa mayúsculas/minúsculas, tildes ni espacios de más: el buscador
   normaliza la clave antes de comparar ("Claro Hogar" == "CLARO HOGAR").

   Campos de cada entrada (todos opcionales):
     estadoServidor -> "EN SERVIDOR" | "SIN SERVIDOR" | "EN MIGRACION"
     enlace         -> URL del desarrollo
     rutaCarpetas   -> ruta de red / carpeta
     imagen         -> ruta de la imagen (en /public) o URL

   Si una campaña NO está en este archivo, el modal muestra "Sin coincidencia"
   y no se rompe nada.
   ============================================================================= */
import alianzaTec from "../Webs/Alianza_Tec.png";
export interface CampanaInfo {
  estadoServidor?: "EN SERVIDOR" | "SIN SERVIDOR" | "EN MIGRACION" | string
  enlace?: string
  rutaCarpetas?: string
  imagen?: string
}

/* ------------------------- 2 EJEMPLOS DE USO BASE -------------------------- */
export const CAMPANAS_INFO: Record<string, CampanaInfo> = {
  // Ejemplo 1: Campaña con imagen (ruta como string)
  LINDE: { 
    imagen: "/images/campana-preview.png",
  },

  // Ejemplo 2: Campaña con imagen (importada como módulo)
  "ALIANZA TEC": { 
    imagen: alianzaTec,
  },

  // 👇 SIGUE AGREGANDO AQUÍ TUS CAMPAÑAS
  // "NOMBRE DE LA CAMPAÑA": {
  //   estadoServidor: "SIN SERVIDOR",
  //   enlace: "",
  //   rutaCarpetas: "",
  //   imagen: "/images/tu-imagen.jpg",  // 👈 URL relativa a /public/ o import
  // },
}

/* Imagen que se usa cuando la campaña no trae `imagen` */
export const IMAGEN_POR_DEFECTO = "/images/campana-preview.png"

/* Normaliza la clave: sin tildes, sin espacios extra, en MAYÚSCULAS */
function normalizar(valor: string): string {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
}

/* Índice normalizado (se arma una sola vez) */
const INDICE: Record<string, CampanaInfo> = Object.keys(CAMPANAS_INFO).reduce(
  (acumulado, clave) => {
    acumulado[normalizar(clave)] = CAMPANAS_INFO[clave]
    return acumulado
  },
  {} as Record<string, CampanaInfo>,
)

/**
 * Busca la info extra de una campaña.
 * Si no hay coincidencia devuelve un objeto vacío (nunca undefined),
 * así el modal nunca se fractura.
 */
export function getCampanaInfo(nombreCampana: string | null | undefined): CampanaInfo {
  return INDICE[normalizar(nombreCampana || "")] ?? {}
}

import preview from "../Webs/campana-preview2.png";
import alianzaTec from "../Webs/Alianza_Tec.png";
import Runt from "../Webs/Runt.jpeg";
import bbvaVentas from "../Webs/BBVA_VENTAS.jpeg";
import vtr from "../Webs/VTR_MULTISKIL.png";
import terpel from "../Webs/TERPEL.png";
import ADMIN from "../Webs/ADMIN.png";
import DAVIBANK from "../Webs/DAVIBANK.png";
import SURA_SEGUROS from "../Webs/SURA_SEGUROS.png";
import BBVA_SAC from "../Webs/BBVA_SAC.jpeg";
import FALABELLA from "../Webs/FALABELLA.png";
import BANCO_POPULAR from "../Webs/BANCO_POPULAR.png";
import LINDE from "../Webs/LINDE.png";
import ABC from "../Webs/ABC.png";
import COLMENA_SEGUROS_RIESGOS from "../Webs/COLMENA_SEGUROS_RIESGOS.png";
import COLSUBSIDIO_CURSOS_CORTOS from "../Webs/COLSUBSIDIO_CURSOS_CORTOS.jpeg";
import COLMENA_SEGUROS_GENERALES from "../Webs/COLMENA_SEGUROS_GENERALES.png";
import TOYOTA from "../Webs/TOYOTA.png";
import CLARO_SWAT from "../Webs/CLARO_SWAT.png";
import BBVA_SEGUROS from "../Webs/BBVA_SEGUROS.jpeg";
import CLARO_RETENCION from "../Webs/CLARO_RETENCION.jpeg";
import TELEFONICA_GENERENCIA_VENTAS from "../Webs/TELEFONICA_GENERENCIA_VENTAS.jpeg";
import BCS_COBRANZAS from "../Webs/BCS_COBRANZAS.png";
import CLARO_CLIENTES_CRITICOS from "../Webs/CLARO_CLIENTES_CRITICOS.jpeg";
import UNIVERSAL_VENTAS from "../Webs/UNIVERSAL_VENTAS.png";
import CLARO_VTR_REDES from "../Webs/CLARO_VTR_REDES.png";
import TELEFONICA_MEXICO_B2C from "../Webs/TELEFONICA_MEXICO_B2C.jpeg";
import TELEFONICA_MEXICO_B2B from "../Webs/TELEFONICA_MEXICO_B2B.jpeg";
import CLARO_VTR_SOPTEC from "../Webs/CLARO_VTR_SOPTEC.jpeg";
import SCOT_CLARO_VTR from "../Webs/SCOT_CLARO_VTR.jpeg";
import BCS_INBOUND from "../Webs/BCS_INBOUND.jpeg";
import CLARO_CHILE_VENTAS_MOVIL from "../Webs/CLARO_CHILE_VENTAS_MOVIL.jpeg";
import WHIRLPOOL from "../Webs/WHIRLPOOL.jpeg";
import ETB from "../Webs/ETB.jpeg";

export interface CampanaInfo {
  estadoServidor?: "EN SERVIDOR" | "SIN SERVIDOR" | "EN MIGRACION" | string
  enlace?: string
  rutaCarpetas?: string
  imagen?: string
}

export const CAMPANAS_INFO: Record<string, CampanaInfo> = {
  "LINDE OXIGENOS": { 
    imagen: LINDE,
  },
  "ALIANZA TEC": { 
    imagen: alianzaTec,
  },
  "RUNT": { 
    imagen: Runt,
  },
  "BBVA VENTAS": { 
    imagen: bbvaVentas,
  },
  "CLARO VTR MULTISKILL": { 
    imagen: vtr,
  },
  "TERPEL": { 
    imagen: terpel,
  },
  "ADMIN TRAINING": { 
    imagen: ADMIN,
  },
  "DAVIBANK CAT": { 
    imagen: DAVIBANK,
  },
  "SURA SEGUROS": {
    imagen: SURA_SEGUROS,
  },
  "BBVA SAC": {
    imagen: BBVA_SAC,
  },
  "FALABELLA": {
    imagen: FALABELLA,
  },
  "BANCO POPULAR": {
    imagen: BANCO_POPULAR,
  },
  "ABC LA POLAR": {
    imagen: ABC,
  },
  "COLMENA SEGUROS Y RIESGOS LABORALES": {
    imagen: COLMENA_SEGUROS_RIESGOS,
  },
  "COLSUBSIDIO CURSOS CORTOS": {
    imagen: COLSUBSIDIO_CURSOS_CORTOS,
  },
  "COLMENA SEGUROS GENERALES": {
    imagen: COLMENA_SEGUROS_GENERALES,
  },
  "TOYOTA MULTISECTOR": {
    imagen: TOYOTA,
  },
  "CLARO SWAT": {
    imagen: CLARO_SWAT,
  },
  "BBVA SEGUROS": {
    imagen: BBVA_SEGUROS,
  },
  "CLARO Retencion": {
    imagen: CLARO_RETENCION,
  },
  "TELEFONICA COLOMBIA GERENCIA VENTAS": {
    imagen: TELEFONICA_GENERENCIA_VENTAS,
  },
  "BCS COBRANZAS": {
    imagen: BCS_COBRANZAS,
  },
  "CLARO CLIENTES CRITICOS": {
    imagen: CLARO_CLIENTES_CRITICOS,
  },
  "UNIVERSAL VENTAS": {
    imagen: UNIVERSAL_VENTAS,
  },
  "CLARO VTR REDES": {
    imagen: CLARO_VTR_REDES,
  }, 
  "TELEFONICA MEXICO B2B": {
    imagen: TELEFONICA_MEXICO_B2B,
  }, 
  "TELEFONICA MEXICO B2C": {
    imagen: TELEFONICA_MEXICO_B2C,
  }, 
  "CLARO VTR SOPTEC": {
    imagen: CLARO_VTR_SOPTEC,
  },
  "CLARO SCOT VTR": {
    imagen: SCOT_CLARO_VTR,
  },
  "BCS INBOUND": {
    imagen: BCS_INBOUND,
  },
  "CLARO CHILE VENTAS MOVIL": {
    imagen: CLARO_CHILE_VENTAS_MOVIL,
  },
  "WHIRLPOOL": {
    imagen: WHIRLPOOL,
  },
  "ETB": {
    imagen: ETB,
  }
}

/* Imagen que se usa cuando la campaña no trae `imagen` */
export const IMAGEN_POR_DEFECTO = preview

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

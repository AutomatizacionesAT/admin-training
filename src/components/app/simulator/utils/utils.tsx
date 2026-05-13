interface SheetCell {
  v: string | number | null;
  f?: string;
}

interface SheetRow {
  c: (SheetCell | null)[];
}

interface SheetColumn {
  label: string;
  type: string;
}

interface SheetData {
  table: {
    rows: SheetRow[];
    cols: SheetColumn[];
  };
}

// Tipo para los datos del Excel
export interface TrainingRecord {
  direccion: string | null;
  industria: string | null;
  campana: string | null;
  coordinador: string | null;
  aplicativo: string | null;
  nombreProceso: string | null;
  estado: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaReal: string | null;
  desarrollador: string | null;
  notas: string | null;
}

export interface FestivoRecord {
  festivo: string | null;
  festividad: string | null;
}

export interface NovedadesRecord {
  desarrollador: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  novedad: string | null;
}

export const fetchGoogleSheetData = async (): Promise<TrainingRecord[]> => {
  try {
    // ID de tu Google Sheet
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";

    // Usar la API pública de Google Sheets (la hoja debe estar compartida públicamente)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    const response = await fetch(url);
    const text = await response.text();

    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: TrainingRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            direccion: row.c[2] ? String(row.c[2].v) : null, // ahora col C (2), antes col B (1)
            industria: row.c[1] ? String(row.c[1].v) : null, // ahora col B (1), antes no se leía o estaba en col C
            campana: row.c[3] ? String(row.c[3].v) : null,      // antes col A (0), ahora col D (3)
            coordinador: row.c[4] ? String(row.c[4].v) : null,  // antes col B (1), ahora col E (4)
            aplicativo: row.c[5] ? String(row.c[5].v) : null,   // antes col C (2), ahora col F (5)
            nombreProceso: row.c[6] ? String(row.c[6].v) : null, // antes col D (3), ahora col G (6)
            estado: row.c[7] ? String(row.c[7].v) : null,       // antes col E (4), ahora col H (7)
            fechaInicio: row.c[8] ? String(row.c[8].v) : null,  // antes col F (5), ahora col I (8)
            fechaFin: row.c[9] ? String(row.c[9].v) : null,     // antes col G (6), ahora col J (9)
            fechaReal: row.c[10] ? String(row.c[10].v) : null,  // antes col H (7), ahora col K (10)
            desarrollador: row.c[11] ? String(row.c[11].v) : null, // antes col I (8), ahora col L (11)
            notas: row.c[12] ? String(row.c[12].v) : null,      // antes col J (9), ahora col M (12)
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    console.log(
      "Asegúrate de que la hoja esté compartida públicamente (cualquier persona con el enlace puede ver)"
    );
    return [];
  }
};

export const fetchSheetFestivosData = async (): Promise<FestivoRecord[]> => {
  try {
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=DATA`;
    const response = await fetch(url);
    const text = await response.text();
    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: FestivoRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            festivo: row.c[3] ? String(row.c[3].v) : null,
            festividad: row.c[4] ? String(row.c[4].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};

export const fetchSheetNovedades = async (): Promise<NovedadesRecord[]> => {
  try {
    const sheetId = "13aPSr-knf8vEiLWPTlZgcKJWd4H5iBsEb_4wJZgD0lo";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Novedades`;
    const response = await fetch(url);
    const text = await response.text();
    // Google retorna JSONP, necesitamos extraer el JSON
    const jsonString = text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\);/
    );

    if (jsonString && jsonString[1]) {
      const data: SheetData = JSON.parse(jsonString[1]);
      console.log(jsonString[1]);
      // Extraer las filas y columnas
      const rows = data.table.rows;

      // Convertir a formato TrainingRecord
      const formattedData: NovedadesRecord[] = rows
        .slice(0)
        .map((row: SheetRow) => {
          return {
            desarrollador: row.c[0] ? String(row.c[0].v) : null,
            fechaInicio: row.c[1] ? String(row.c[1].v) : null,
            fechaFin: row.c[2] ? String(row.c[2].v) : null,
            novedad: row.c[3] ? String(row.c[3].v) : null,
          };
        });

      console.log("📊 Datos de Google Sheets:");
      console.log("Total de filas:", formattedData.length);
      console.table(formattedData);

      return formattedData;
    }

    return [];
  } catch (error) {
    console.error("Error al cargar datos de Google Sheets:", error);
    return [];
  }
};

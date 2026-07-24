import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { parseAsignacionDate } from './asignacionUtils';
import type { SalaRecord, AsignacionRecord } from './types';

// Constants for colors
const COLORS = {
  headerBg: '112A46',      // Navy
  headerText: 'FFFFFF',
  sedeBg: 'E1E8F0',        // Light gray for SEDE column
  salaRow1Bg: 'FFFFFF',    // White (AM)
  salaRow2Bg: 'FFFFFF',    // White (PM)
  tipoBg: 'E1E8F0',
  capacidadBg: 'FFFF00',   // Yellow
  equiposBg: 'FFFF00',     // Yellow
  horarioBg: 'FFFF00',     // Yellow
  timelineDayBg: '112A46', // Navy for day numbers
  timelineDayText: 'FFFFFF',
  assignmentOrange: 'F37021', // Orange
  assignmentBlue: '005082',   // Blue
  border: 'A6A6A6',
};

function getBorder() {
  return {
    top: { style: 'thin' as const, color: { argb: COLORS.border } },
    left: { style: 'thin' as const, color: { argb: COLORS.border } },
    bottom: { style: 'thin' as const, color: { argb: COLORS.border } },
    right: { style: 'thin' as const, color: { argb: COLORS.border } },
  };
}

export async function exportToExcel(salas: SalaRecord[], asignaciones: AsignacionRecord[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Admin Training';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Control de Salas', {
    views: [{ state: 'frozen', ySplit: 4, xSplit: 7 }] // Freeze panes
  });

  // Calculate timeline date range
  // We'll show from the 1st of current month to end of next month
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(addDays(today, 60)); // ~2 months
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // ─── Setup Columns ──────────────────────────────────────────────────────────
  sheet.columns = [
    { header: '', key: 'colA', width: 2 }, // Empty spacer
    { header: 'SEDE', key: 'sede', width: 12 },
    { header: 'SALA', key: 'sala', width: 45 },
    { header: 'TIPO', key: 'tipo', width: 15 },
    { header: 'CAPACIDAD', key: 'cap', width: 12 },
    { header: 'EQUIPOS', key: 'eq', width: 10 },
    { header: 'HORARIO', key: 'horario', width: 15 },
    // Then all days
    ...days.map(d => ({ header: format(d, 'd'), key: `d_${format(d, 'yyyy-MM-dd')}`, width: 4 }))
  ];

  // ─── Title Row ──────────────────────────────────────────────────────────────
  sheet.mergeCells('B2:G3');
  const titleCell = sheet.getCell('B2');
  titleCell.value = 'CONTROL DE SALAS 2026';
  titleCell.font = { name: 'Arial', size: 22, bold: true, color: { argb: COLORS.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // ─── Timeline Months Headers (Row 2 and 3) ──────────────────────────────────
  let currentMonthStr = '';
  let monthStartCol = 8; // Column H is 8

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const mStr = format(d, 'MMMM', { locale: es }).toUpperCase();
    const colNum = 8 + i;

    // Add letters for days (M, J, V, S, D, L, M) in Row 3
    const dayLetterCell = sheet.getCell(3, colNum);
    dayLetterCell.value = format(d, 'eeeee', { locale: es }).toUpperCase(); // Initial of day
    dayLetterCell.font = { name: 'Arial', size: 8, bold: true };
    dayLetterCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dayLetterCell.border = getBorder();

    if (mStr !== currentMonthStr) {
      if (currentMonthStr !== '') {
        sheet.mergeCells(2, monthStartCol, 2, colNum - 1);
        const mc = sheet.getCell(2, monthStartCol);
        mc.value = currentMonthStr;
        mc.font = { name: 'Arial', size: 10, bold: true };
        mc.alignment = { vertical: 'middle', horizontal: 'center' };
        mc.border = getBorder();
      }
      currentMonthStr = mStr;
      monthStartCol = colNum;
    }
  }
  // Last month merge
  if (days.length > 0) {
    sheet.mergeCells(2, monthStartCol, 2, 7 + days.length);
    const mcLast = sheet.getCell(2, monthStartCol);
    mcLast.value = currentMonthStr;
    mcLast.font = { name: 'Arial', size: 10, bold: true };
    mcLast.alignment = { vertical: 'middle', horizontal: 'center' };
    mcLast.border = getBorder();
  }

  // ─── Headers (Row 4) ────────────────────────────────────────────────────────
  const headers = ['SEDE', 'SALA', 'TIPO', 'CAPACIDAD', 'EQUIPOS', 'HORARIO'];
  headers.forEach((h, i) => {
    const c = sheet.getCell(4, i + 2);
    c.value = h;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6CA0DC' } }; // Light blue for headers
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = getBorder();
  });

  days.forEach((d, i) => {
    const c = sheet.getCell(4, i + 8);
    c.value = format(d, 'd');
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.timelineDayBg } };
    c.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = getBorder();
  });

  // ─── Data Rows ──────────────────────────────────────────────────────────────
  let currentRow = 5;

  // Group salas by sede
  const salasBySede: Record<string, SalaRecord[]> = {};
  salas.forEach(s => {
    if (!salasBySede[s.sede]) salasBySede[s.sede] = [];
    salasBySede[s.sede].push(s);
  });

  Object.entries(salasBySede).forEach(([sede, sedesalas]) => {
    const startRowSede = currentRow;
    // El catálogo original tiene 2 filas por sala (AM y PM). Deduplicamos por nombre de sala
    // ya que el Excel generará ambas filas por cada sala única.
    const salasSede = Array.from(new Map(sedesalas.map(s => [s.sala.trim().toUpperCase(), s])).values());

    salasSede.forEach(sala => {
      // Create two rows per sala: AM and PM

      // SALA
      sheet.mergeCells(currentRow, 3, currentRow + 1, 3);
      const cSala = sheet.getCell(currentRow, 3);
      cSala.value = sala.sala.toUpperCase();
      cSala.font = { name: 'Arial', size: 8, bold: true };
      cSala.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cSala.border = getBorder();

      // TIPO
      sheet.mergeCells(currentRow, 4, currentRow + 1, 4);
      const cTipo = sheet.getCell(currentRow, 4);
      cTipo.value = sala.tipo.toUpperCase();
      cTipo.font = { name: 'Arial', size: 8 };
      cTipo.alignment = { vertical: 'middle', horizontal: 'center' };
      cTipo.border = getBorder();

      // CAPACIDAD
      const capAm = sheet.getCell(currentRow, 5);
      capAm.value = sala.capacidad;
      capAm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.capacidadBg } };
      capAm.border = getBorder();
      capAm.font = { size: 9, bold: true };
      capAm.alignment = { horizontal: 'center' };

      const capPm = sheet.getCell(currentRow + 1, 5);
      capPm.value = sala.capacidad;
      capPm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8EAADB' } };
      capPm.border = getBorder();
      capPm.font = { size: 9, bold: true };
      capPm.alignment = { horizontal: 'center' };

      // EQUIPOS
      const eqAm = sheet.getCell(currentRow, 6);
      eqAm.value = sala.equipos;
      eqAm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.equiposBg } };
      eqAm.border = getBorder();
      eqAm.font = { size: 9, bold: true };
      eqAm.alignment = { horizontal: 'center' };

      const eqPm = sheet.getCell(currentRow + 1, 6);
      eqPm.value = sala.equipos;
      eqPm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8EAADB' } };
      eqPm.border = getBorder();
      eqPm.font = { size: 9, bold: true };
      eqPm.alignment = { horizontal: 'center' };

      // HORARIO
      const hAm = sheet.getCell(currentRow, 7);
      hAm.value = '06:00 A 14:00';
      hAm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.horarioBg } };
      hAm.border = getBorder();
      hAm.font = { size: 8, bold: true };
      hAm.alignment = { horizontal: 'center' };

      const hPm = sheet.getCell(currentRow + 1, 7);
      hPm.value = '14:00 A 22:00';
      hPm.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8EAADB' } };
      hPm.border = getBorder();
      hPm.font = { size: 8, bold: true };
      hPm.alignment = { horizontal: 'center' };

      // Fill background for timeline to ensure grid lines
      days.forEach((_, i) => {
        const dAm = sheet.getCell(currentRow, i + 8);
        dAm.border = getBorder();
        const dPm = sheet.getCell(currentRow + 1, i + 8);
        dPm.border = getBorder();
      });

      // ─── Asignaciones Mapping ────────────────────────────────────────────────
      const asigsSala = asignaciones.filter(a => a.sala === sala.sala && (a.estadoAsignacion === 'APROBADA' || a.estadoAsignacion === 'APROBADO' || a.estadoAsignacion === 'CONFIRMADO'));

      asigsSala.forEach(asig => {
        try {
          const asigStart = parseAsignacionDate(asig.fechaInicial);
          const asigEnd = parseAsignacionDate(asig.fechaFin);

          if (!asigStart || isNaN(asigStart.getTime()) || !asigEnd || isNaN(asigEnd.getTime())) return;

          let colStart = -1;
          let colEnd = -1;

          for (let i = 0; i < days.length; i++) {
            try {
              const dStr = format(days[i], 'yyyy-MM-dd');
              const startStr = format(asigStart, 'yyyy-MM-dd');
              const endStr = format(asigEnd, 'yyyy-MM-dd');

              if (colStart === -1 && dStr >= startStr && dStr <= endStr) {
                colStart = i + 8;
              }
              if (colStart !== -1 && dStr >= startStr && dStr <= endStr) {
                colEnd = i + 8;
              }
            } catch (e) {
              // Si falla el format por alguna razón, ignorar este día
            }
          }

          if (colStart !== -1 && colEnd !== -1) {
            const isPM = (asig.horario || '').includes('14:00');
            const targetRow = isPM ? currentRow + 1 : currentRow;
            const fgColor = isPM ? COLORS.assignmentBlue : COLORS.assignmentOrange;

            // Prevent merge errors if overlapping
            if (!sheet.getCell(targetRow, colStart).isMerged) {
              if (colStart !== colEnd) {
                try {
                  sheet.mergeCells(targetRow, colStart, targetRow, colEnd);
                } catch (e) {
                  // Already merged, ignore
                }
              }
              const blockCell = sheet.getCell(targetRow, colStart);
              blockCell.value = `${asig.campana} | ${asig.coordinador} | ${asig.horario}`;
              blockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
              blockCell.font = { name: 'Arial', size: 7, bold: true, color: { argb: 'FFFFFF' } };
              blockCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
          }
        } catch (e) {
          console.error("Error exporting asignacion:", e, asig);
        }
      });

      currentRow += 2;
    });

    // Merge SEDE
    if (currentRow > startRowSede) {
      sheet.mergeCells(startRowSede, 2, currentRow - 1, 2);
      const cellSede = sheet.getCell(startRowSede, 2);
      cellSede.value = sede.toUpperCase();
      cellSede.font = { name: 'Arial', size: 14, bold: true };
      cellSede.alignment = { vertical: 'middle', horizontal: 'center', textRotation: 90 };
      cellSede.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sedeBg } };
      cellSede.border = getBorder();
    }
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Formato_Seguridad_Salas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

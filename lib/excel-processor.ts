import * as XLSX from 'xlsx';
import { ParsedExcelFile, AuditLogEntry } from './types';

/**
 * Parse uploaded Excel or CSV file into memory using SheetJS
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelFile> {
  const arrayBuffer = await file.arrayBuffer();
  const rawWorkbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    cellFormula: false,
    dense: true
  });

  const sheetNames = rawWorkbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('Excel 檔案內找不到任何工作表 (Sheet)。');
  }

  const selectedSheet = sheetNames[0];
  const worksheet = rawWorkbook.Sheets[selectedSheet];
  
  // Convert worksheet to JSON array of objects
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error('工作表內容為空。');
  }

  // Detect column names from the first row keys
  const columns = Object.keys(rows[0]);

  // Estimate word count
  let totalWordCount = 0;
  for (let i = 0; i < Math.min(100, rows.length); i++) {
    for (const key of columns) {
      const val = String(rows[i][key] || '');
      totalWordCount += val.length;
    }
  }
  const estimatedWordCount = Math.round((totalWordCount / Math.min(100, rows.length)) * rows.length);

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames,
    selectedSheet,
    columns,
    rows,
    totalRows: rows.length,
    estimatedWordCount,
    rawWorkbook
  };
}

/**
 * Switch sheet in parsed workbook
 */
export function getSheetData(rawWorkbook: any, sheetName: string): { columns: string[]; rows: Record<string, any>[] } {
  const worksheet = rawWorkbook.Sheets[sheetName];
  if (!worksheet) {
    return { columns: [], rows: [] };
  }
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

/**
 * Generate and trigger download of Masked Excel dataset (.xlsx)
 */
export function downloadMaskedDataset(
  originalFileName: string,
  rows: Record<string, any>[],
  sheetName: string = 'Sheet1'
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanName = originalFileName.replace(/\.[^/.]+$/, '');
  const downloadFileName = `${cleanName}_Masked.xlsx`;

  triggerFileDownload(blob, downloadFileName);
}

/**
 * Generate and trigger download of Audit Log spreadsheet (.xlsx)
 */
export function downloadAuditLogReport(
  originalFileName: string,
  auditLogs: AuditLogEntry[]
) {
  const formattedLogs = auditLogs.map(log => ({
    '資料行數 (Row)': log.rowIndex,
    '工作表名稱 (Sheet)': log.sheetName,
    '目標欄位 (Column)': log.columnName,
    '個資類型 (PII Type)': log.entityType,
    '原始敏感詞 (Original)': log.originalValue,
    '去標識化結果 (Masked)': log.maskedValue,
    '原始完整內文 Context': log.cellContextOriginal,
    '去標識化完整內文 Context': log.cellContextMasked,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedLogs);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 15 }, // Row
    { wch: 18 }, // Sheet
    { wch: 20 }, // Column
    { wch: 18 }, // Entity Type
    { wch: 20 }, // Original
    { wch: 20 }, // Masked
    { wch: 50 }, // Context Original
    { wch: 50 }, // Context Masked
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '個資脫敏稽核日誌 (Audit Log)');

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanName = originalFileName.replace(/\.[^/.]+$/, '');
  const downloadFileName = `${cleanName}_Audit_Log.xlsx`;

  triggerFileDownload(blob, downloadFileName);
}

/**
 * Trigger browser file download
 */
function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

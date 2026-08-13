export type PIIEntityType =
  | 'chinese_name'
  | 'english_name'
  | 'phone'
  | 'email'
  | 'id_card'
  | 'custom_regex';

export interface PIIEntity {
  type: PIIEntityType;
  typeName: string;
  originalText: string;
  maskedText: string;
  startIndex: number;
  endIndex: number;
}

export interface CustomRegexRule {
  id: string;
  name: string;
  pattern: string;
  enabled: boolean;
}

export interface MaskingConfig {
  targetColumns: string[];
  outputMode: 'append_column' | 'replace_column';
  customOutputColumnName?: string; // e.g. 'B' or '[Column]_Masked'
  blankIfUnmasked?: boolean; // If true, Column B remains empty when no PII is detected
  maskCharacter: string; // '*', 'X', '[MASK]'
  
  // Rule Toggles
  enableChineseName: boolean;
  enableEnglishName: boolean;
  enablePhone: boolean;
  enableEmail: boolean;
  enableIdCard: boolean;
  
  // Custom Rules
  customRules: CustomRegexRule[];
  
  // Specific masking rules
  chineseMaskStyle: 'standard' | 'preserve_first' | 'full_asterisk';
  // standard: 張小明 -> 張**, 歐陽修 -> 歐**
  // preserve_first: 保留第一個字其餘*
  // full_asterisk: 全*
  
  englishMaskStyle: 'initial_last' | 'initial_first' | 'full_asterisk';
  // initial_last: John Smith -> John S.
  // initial_first: John Smith -> J. Smith
  // full_asterisk: John Smith -> **** *****
}

export interface AuditLogEntry {
  id: string;
  rowIndex: number;
  sheetName: string;
  columnName: string;
  entityType: string;
  originalValue: string;
  maskedValue: string;
  cellContextOriginal: string;
  cellContextMasked: string;
}

export type ProcessingState = 
  | 'idle'
  | 'inspecting'
  | 'ready'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'error';

export interface ProcessingStats {
  status: ProcessingState;
  totalRows: number;
  processedRows: number;
  totalWords: number;
  processedWords: number;
  piiDetectedCount: number;
  startTime: number;
  elapsedMs: number;
  rowsPerSec: number;
  wordsPerSec: number;
  estimatedRemainingMs: number;
  errorMessage?: string;
}

export interface ParsedExcelFile {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
  estimatedWordCount: number;
  rawWorkbook: any;
}

export interface MaskingResult {
  maskedRows: Record<string, any>[];
  auditLogs: AuditLogEntry[];
  stats: ProcessingStats;
}

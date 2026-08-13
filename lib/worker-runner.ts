import { MaskingConfig, AuditLogEntry, ProcessingStats } from './types';
import { detectAndMaskPIIInText } from './pii-engine';

export interface ChunkProgressCallback {
  (
    processedRows: number,
    totalRows: number,
    stats: ProcessingStats,
    auditLogsSample: AuditLogEntry[],
    latestMaskedRows: Record<string, any>[]
  ): void;
}

/**
 * High-Performance Client-Side Async Chunk Processor
 * Processes heavy datasets (tens of thousands of rows / millions of words)
 * using non-blocking scheduler.yield() / setTimeout chunks.
 */
export async function processExcelRowsChunked(
  rows: Record<string, any>[],
  config: MaskingConfig,
  sheetName: string,
  onProgress: ChunkProgressCallback,
  shouldCancel: () => boolean,
  isPaused: () => boolean
): Promise<{ maskedRows: Record<string, any>[]; auditLogs: AuditLogEntry[]; finalStats: ProcessingStats }> {
  const totalRows = rows.length;
  const targetCols = config.targetColumns;
  const maskedRows: Record<string, any>[] = [];
  const auditLogs: AuditLogEntry[] = [];

  let piiDetectedCount = 0;
  let processedWords = 0;

  const startTime = performance.now();
  let lastProgressReportTime = performance.now();
  const chunkSize = 200; // rows per chunk before yielding to main thread

  for (let i = 0; i < totalRows; i++) {
    // Check cancellation
    if (shouldCancel()) {
      throw new Error('使用者已取消處理。');
    }

    // Handle pause state
    while (isPaused()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (shouldCancel()) throw new Error('使用者已取消處理。');
    }

    const row = rows[i];
    const newRow = { ...row };

    for (const colName of targetCols) {
      const cellVal = String(row[colName] || '');
      processedWords += cellVal.length;

      if (cellVal.trim().length > 0) {
        const { maskedText, entities } = detectAndMaskPIIInText(cellVal, config);

        if (entities.length > 0) {
          piiDetectedCount += entities.length;

          // Record audit log for each entity detected
          for (const entity of entities) {
            auditLogs.push({
              id: `${i}-${colName}-${entity.startIndex}-${Math.random().toString(36).substring(2, 7)}`,
              rowIndex: i + 1,
              sheetName,
              columnName: colName,
              entityType: entity.typeName,
              originalValue: entity.originalText,
              maskedValue: entity.maskedText,
              cellContextOriginal: cellVal.length > 100 ? cellVal.substring(0, 100) + '...' : cellVal,
              cellContextMasked: maskedText.length > 100 ? maskedText.substring(0, 100) + '...' : maskedText,
            });
          }
        }

        // Output column mode
        const outputCol = config.customOutputColumnName && config.targetColumns.length === 1
          ? config.customOutputColumnName
          : `${colName}_Masked`;

        const hasPII = entities.length > 0;

        if (config.outputMode === 'append_column') {
          if (hasPII) {
            newRow[outputCol] = maskedText;
          } else {
            newRow[outputCol] = config.blankIfUnmasked ? '' : cellVal;
          }
        } else {
          newRow[colName] = maskedText;
        }
      } else {
        const outputCol = config.customOutputColumnName && config.targetColumns.length === 1
          ? config.customOutputColumnName
          : `${colName}_Masked`;

        if (config.outputMode === 'append_column') {
          newRow[outputCol] = '';
        }
      }
    }

    maskedRows.push(newRow);

    // Yield to main thread every chunkSize rows or 50ms
    const now = performance.now();
    if (i % chunkSize === 0 || i === totalRows - 1 || now - lastProgressReportTime > 50) {
      lastProgressReportTime = now;
      const elapsedMs = Math.max(1, now - startTime);
      const rowsPerSec = Math.round((i + 1) / (elapsedMs / 1000));
      const wordsPerSec = Math.round(processedWords / (elapsedMs / 1000));
      const remainingRows = totalRows - (i + 1);
      const estimatedRemainingMs = rowsPerSec > 0 ? Math.round((remainingRows / rowsPerSec) * 1000) : 0;

      const currentStats: ProcessingStats = {
        status: 'processing',
        totalRows,
        processedRows: i + 1,
        totalWords: processedWords * (totalRows / Math.max(1, i + 1)),
        processedWords,
        piiDetectedCount,
        startTime,
        elapsedMs,
        rowsPerSec,
        wordsPerSec,
        estimatedRemainingMs,
      };

      onProgress(i + 1, totalRows, currentStats, auditLogs.slice(-10), maskedRows.slice(-5));

      // Yield control to main thread to keep UI responsive
      if (typeof window !== 'undefined' && 'scheduler' in window && 'yield' in (window as any).scheduler) {
        await (window as any).scheduler.yield();
      } else {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  const finalEndTime = performance.now();
  const totalElapsedMs = Math.max(1, finalEndTime - startTime);
  const finalRowsPerSec = Math.round(totalRows / (totalElapsedMs / 1000));
  const finalWordsPerSec = Math.round(processedWords / (totalElapsedMs / 1000));

  const finalStats: ProcessingStats = {
    status: 'completed',
    totalRows,
    processedRows: totalRows,
    totalWords: processedWords,
    processedWords,
    piiDetectedCount,
    startTime,
    elapsedMs: totalElapsedMs,
    rowsPerSec: finalRowsPerSec,
    wordsPerSec: finalWordsPerSec,
    estimatedRemainingMs: 0,
  };

  return { maskedRows, auditLogs, finalStats };
}

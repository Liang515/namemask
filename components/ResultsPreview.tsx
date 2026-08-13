import React, { useState } from 'react';
import { MaskingResult, AuditLogEntry, ParsedExcelFile } from '../lib/types';
import { Download, CheckCircle2, ShieldAlert, Search, RefreshCw, FileSpreadsheet, Eye, FileCheck2 } from 'lucide-react';
import { downloadMaskedDataset, downloadAuditLogReport } from '../lib/excel-processor';

interface ResultsPreviewProps {
  file: ParsedExcelFile;
  result: MaskingResult;
  onReset: () => void;
}

export function ResultsPreview({ file, result, onReset }: ResultsPreviewProps) {
  const [filterOnlyMasked, setFilterOnlyMasked] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { maskedRows, auditLogs, stats } = result;

  // Filter rows for preview
  const auditRowIndexes = new Set(auditLogs.map(log => log.rowIndex - 1));

  const filteredPreviewRows = maskedRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ idx }) => {
      if (filterOnlyMasked && !auditRowIndexes.has(idx)) return false;
      if (searchTerm) {
        const rowStr = JSON.stringify(maskedRows[idx]).toLowerCase();
        return rowStr.includes(searchTerm.toLowerCase());
      }
      return true;
    });

  const handleDownloadDataset = () => {
    downloadMaskedDataset(file.fileName, maskedRows, file.selectedSheet);
  };

  const handleDownloadAuditLog = () => {
    downloadAuditLogReport(file.fileName, auditLogs);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Success Celebration Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              100% 本地記憶體運算完成
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              個資去標識化與稽核日誌產生成功！
            </h2>

            <p className="text-emerald-100 text-sm max-w-xl">
              共完成 <strong className="text-white">{stats.processedRows.toLocaleString()}</strong> 列資料處理，檢出並遮蔽了 <strong className="text-white">{stats.piiDetectedCount.toLocaleString()}</strong> 處敏感個資。所有資料皆未離開您的電腦。
            </p>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            處理下一個檔案
          </button>
        </div>

        {/* Action Downloads Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-emerald-500/40 relative z-10">
          {/* Download 1: Masked Dataset */}
          <button
            type="button"
            onClick={handleDownloadDataset}
            className="p-5 rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 transition-all shadow-lg text-left group flex items-start justify-between border border-emerald-100 cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="font-bold text-base block text-slate-900">
                1. 下載去標識化 Excel 數據集
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                包含原始資料與新產生的 <code className="font-mono text-emerald-700 font-semibold">[欄位]_Masked</code> 遮蔽數據
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700">
              <Download className="w-4 h-4" />
            </div>
          </button>

          {/* Download 2: Audit Log */}
          <button
            type="button"
            onClick={handleDownloadAuditLog}
            className="p-5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg text-left group flex items-start justify-between border border-slate-700 cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-900/60 text-blue-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-base block text-white">
                2. 下載個資脫敏稽核日誌 (Audit Log)
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                詳細收錄全部 {auditLogs.length} 筆檢出個資之原始內容、去標識結果與列號 context
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-500">
              <Download className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">總處理數據列</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {stats.totalRows.toLocaleString()} 列
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">個資遮蔽總次數</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.piiDetectedCount.toLocaleString()} 處
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">耗費時間</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {(stats.elapsedMs / 1000).toFixed(2)} 秒
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">平均運算效能</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {stats.rowsPerSec.toLocaleString()} 列/秒
          </span>
        </div>
      </div>

      {/* Interactive Preview Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              對比預覽與驗證 (Interactive Results Preview)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOnlyMasked}
                onChange={(e) => setFilterOnlyMasked(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded"
              />
              <span>僅預覽含有個資遮蔽的列 ({auditRowIndexes.size} 列)</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="搜尋預覽關鍵字..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 sticky top-0 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3 w-16">Row #</th>
                {file.columns.map((col) => (
                  <th key={col} className="px-4 py-3 min-w-[200px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPreviewRows.slice(0, 100).map(({ row, idx }) => {
                const isMaskedRow = auditRowIndexes.has(idx);
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isMaskedRow ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    {file.columns.map((col) => {
                      const val = String(row[col] || '');
                      const maskedVal = String(row[`${col}_Masked`] || val);
                      const isFieldChanged = val !== maskedVal;

                      return (
                        <td key={col} className="px-4 py-3 align-top">
                          {isFieldChanged ? (
                            <div className="space-y-1">
                              <span className="text-slate-400 line-through block text-[11px]">
                                {val}
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                                {maskedVal}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-700 dark:text-slate-300">
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-400 text-right">
          顯示前 {Math.min(100, filteredPreviewRows.length)} 筆預覽數據。完整 {maskedRows.length} 列請下載 Excel 檔案檢視。
        </p>
      </div>
    </div>
  );
}

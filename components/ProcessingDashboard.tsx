import React from 'react';
import { ProcessingStats, AuditLogEntry } from '../lib/types';
import { Pause, Play, XCircle, Gauge, Activity, ShieldCheck, Clock, Layers } from 'lucide-react';

interface ProcessingDashboardProps {
  stats: ProcessingStats;
  recentAuditLogs: AuditLogEntry[];
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function ProcessingDashboard({
  stats,
  recentAuditLogs,
  isPaused,
  onPause,
  onResume,
  onCancel,
}: ProcessingDashboardProps) {
  const percentage = stats.totalRows > 0
    ? Math.min(100, Math.round((stats.processedRows / stats.totalRows) * 100))
    : 0;

  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return '即將完成...';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} 分 ${secs} 秒`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
              <span>正在執行高運算本地個資去標識化...</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Web Worker + Chunked Yield 引擎正在背景進行文字分詞與 NER 辨識，不卡頓主執行緒 UI
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Play className="w-4 h-4" />
                繼續執行
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-amber-600 transition-colors shadow-xs"
              >
                <Pause className="w-4 h-4" />
                暫停處理
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-800"
            >
              <XCircle className="w-4 h-4" />
              取消任務
            </button>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>處理進度 ({percentage}%)</span>
            <span>{stats.processedRows.toLocaleString()} / {stats.totalRows.toLocaleString()} 列</span>
          </div>

          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-150 relative overflow-hidden"
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> 已檢出個資
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.piiDetectedCount.toLocaleString()} 處
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 block flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-500" /> 運算速度
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.rowsPerSec.toLocaleString()} 列/秒
            </span>
            <span className="text-[10px] text-slate-400">
              ({stats.wordsPerSec.toLocaleString()} 字/秒)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> 預估剩餘時間
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatRemainingTime(stats.estimatedRemainingMs)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" /> 總字數處理
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
              {Math.round(stats.processedWords / 1000).toLocaleString()} k字
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Streamed Audit Logs Preview */}
      {recentAuditLogs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            即時檢出個資日誌串流 (Real-time Stream)
          </h3>

          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold text-[10px]">
                    {log.entityType}
                  </span>
                  <span className="text-slate-500">Row {log.rowIndex}:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 line-through">
                    {log.originalValue}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    {log.maskedValue}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate max-w-xs hidden sm:inline">
                  {log.columnName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

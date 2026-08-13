'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { FileDropzone } from '../components/FileDropzone';
import { MaskConfigurator } from '../components/MaskConfigurator';
import { ProcessingDashboard } from '../components/ProcessingDashboard';
import { ResultsPreview } from '../components/ResultsPreview';
import {
  ParsedExcelFile,
  MaskingConfig,
  ProcessingStats,
  MaskingResult,
  AuditLogEntry,
} from '../lib/types';
import { processExcelRowsChunked } from '../lib/worker-runner';
import { ShieldCheck, Zap, Lock, Database } from 'lucide-react';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'configure' | 'processing' | 'results'>('upload');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedExcelFile | null>(null);
  const [maskingConfig, setMaskingConfig] = useState<MaskingConfig | null>(null);

  // Processing state
  const [stats, setStats] = useState<ProcessingStats>({
    status: 'idle',
    totalRows: 0,
    processedRows: 0,
    totalWords: 0,
    processedWords: 0,
    piiDetectedCount: 0,
    startTime: 0,
    elapsedMs: 0,
    rowsPerSec: 0,
    wordsPerSec: 0,
    estimatedRemainingMs: 0,
  });

  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogEntry[]>([]);
  const [maskingResult, setMaskingResult] = useState<MaskingResult | null>(null);

  // Control refs
  const cancelRequestedRef = useRef(false);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleFileParsed = (parsed: ParsedExcelFile) => {
    setParsedFile(parsed);
    setStep('configure');
  };

  const handleSheetChange = (updatedFile: ParsedExcelFile) => {
    setParsedFile(updatedFile);
  };

  const handleResetFile = () => {
    setParsedFile(null);
    setMaskingConfig(null);
    setMaskingResult(null);
    setRecentAuditLogs([]);
    setStep('upload');
  };

  const handleStartProcessing = async (config: MaskingConfig) => {
    if (!parsedFile) return;

    setMaskingConfig(config);
    setStep('processing');
    cancelRequestedRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);

    try {
      const { maskedRows, auditLogs, finalStats } = await processExcelRowsChunked(
        parsedFile.rows,
        config,
        parsedFile.selectedSheet,
        (processedRows, totalRows, currentStats, auditLogsSample) => {
          setStats(currentStats);
          setRecentAuditLogs(auditLogsSample);
        },
        () => cancelRequestedRef.current,
        () => isPausedRef.current
      );

      const result: MaskingResult = {
        maskedRows,
        auditLogs,
        stats: finalStats,
      };

      setMaskingResult(result);
      setStep('results');
    } catch (err: any) {
      console.error('Processing error:', err);
      if (err.message === '使用者已取消處理。') {
        handleResetFile();
      } else {
        alert(`處理失敗：${err.message || '未知錯誤'}`);
        setStep('configure');
      }
    }
  };

  const handlePause = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleCancel = () => {
    cancelRequestedRef.current = true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-12 animate-fade-in">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>無上限大檔案 · 每秒數千列高效去標識</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                極速本地 Excel <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">個資遮蔽引擎</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                專為動輒數百萬字、數萬列巨型 Excel 打造。自動識別中文姓名、英文姓名、電話號碼、電子郵件與身分證號，並產生導出遮蔽檔與完整稽核日誌。
              </p>
            </div>

            <FileDropzone
              onFileParsed={handleFileParsed}
              isLoading={isLoadingFile}
              setIsLoading={setIsLoadingFile}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">100% 隱私合規</h3>
                <p className="text-xs text-slate-500">
                  所有二進位檔案解析、斷詞與遮蔽全在您本機瀏覽器記憶體完成，完全零資料上傳。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">segmentit 中文 NER</h3>
                <p className="text-xs text-slate-500">
                  整合廣義中文分詞詞庫與單複姓氏規則引擎，完美識別「張小明」、「歐陽修」等姓名。
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">雙 Excel 報表產出</h3>
                <p className="text-xs text-slate-500">
                  自動生成「去標識數據集 .xlsx」與收錄詳細對照的「個資脫敏稽核日誌 (Audit Log) .xlsx」。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 'configure' && parsedFile && (
          <MaskConfigurator
            file={parsedFile}
            onStartProcessing={handleStartProcessing}
            onResetFile={handleResetFile}
            onSheetChange={handleSheetChange}
          />
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <ProcessingDashboard
            stats={stats}
            recentAuditLogs={recentAuditLogs}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
          />
        )}

        {/* Step 4: Results & Downloads */}
        {step === 'results' && parsedFile && maskingResult && (
          <ResultsPreview
            file={parsedFile}
            result={maskingResult}
            onReset={handleResetFile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            NameMask Pro © 2026 · Client-Side Excel PII Masking Engine · Powered by Next.js & SheetJS & segmentit
          </p>
        </div>
      </footer>
    </div>
  );
}

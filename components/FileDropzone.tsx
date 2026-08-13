import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Layers, FileText } from 'lucide-react';
import { ParsedExcelFile } from '../lib/types';
import { parseExcelFile, getSheetData } from '../lib/excel-processor';

interface FileDropzoneProps {
  onFileParsed: (parsed: ParsedExcelFile) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function FileDropzone({ onFileParsed, isLoading, setIsLoading }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    const validExts = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('請上傳格式為 .xlsx, .xls 或 .csv 的 Excel 檔案。');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const parsed = await parseExcelFile(file);
      onFileParsed(parsed);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '檔案解析失敗，請確認檔案格式是否正確。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Generate synthetic sample file for quick test
  const handleLoadDemoSample = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      const sampleNames = ['張小明', '李大華', '歐陽修', '陳美玲', 'John Smith', 'Alice Johnson', '黃偉強', '諸葛孔明', '王美麗', 'Robert Downey'];
      const sampleCities = ['台北市', '新竹縣', '台中市', '台南市', '高雄市'];
      const sampleRows: Record<string, any>[] = [];

      for (let i = 1; i <= 5000; i++) {
        const name = sampleNames[i % sampleNames.length];
        const city = sampleCities[i % sampleCities.length];
        const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
        const email = `user${i}@example.com`;
        const idCard = `A${100000000 + Math.floor(Math.random() * 899999999)}`;
        const feedback = `客戶 ${name} 居住於 ${city}，聯繫電話為 ${phone}，電子郵件是 ${email}，身分證字號為 ${idCard}。對我們的服務非常滿意，期待下次購買。`;

        sampleRows.push({
          編號: i,
          客戶姓名: name,
          聯繫電話: phone,
          電子郵件: email,
          反饋內容: feedback,
        });
      }

      const parsed: ParsedExcelFile = {
        fileName: 'NameMask_Demo_5000rows.xlsx',
        fileSize: 1024 * 768,
        sheetNames: ['客戶意見集', '簡短統計'],
        selectedSheet: '客戶意見集',
        columns: ['編號', '客戶姓名', '聯繫電話', '電子郵件', '反饋內容'],
        rows: sampleRows,
        totalRows: sampleRows.length,
        estimatedWordCount: sampleRows.length * 45,
        rawWorkbook: null
      };

      onFileParsed(parsed);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              正在讀取與解析 Excel 二進位檔案...
            </p>
            <p className="text-xs text-slate-500 mt-1">完全在本地記憶體中解析，無任何網路傳輸</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              拖放 Excel 檔案至此，或點擊選擇檔案
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
              支援 <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-blue-600 dark:text-blue-400">.xlsx</code>, <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-blue-600 dark:text-blue-400">.xls</code>, <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-blue-600 dark:text-blue-400">.csv</code>。專為 200 萬字以上 / 數萬列重型檔案優化。
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                零伺服器傳輸
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                廣義中文 NER 辨識
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                即時雙 Excel 導出
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Demo Test Button */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleLoadDemoSample(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>沒有 Excel 檔？點擊載入 5,000 列 Demo 測試資料組</span>
        </button>
      </div>
    </div>
  );
}

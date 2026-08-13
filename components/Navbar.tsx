import React from 'react';
import { ShieldCheck, FileSpreadsheet, Lock, Cpu } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                NameMask Pro
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                v1.0 Local
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              大容量 Excel Client-Side 個資去標識化引擎
            </p>
          </div>
        </div>

        {/* Privacy Guarantee Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% 本地瀏覽器記憶體計算 · 零資料上傳</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Cpu className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="hidden sm:inline">Web Worker 引擎 ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}

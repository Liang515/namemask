import React, { useState } from 'react';
import { ParsedExcelFile, MaskingConfig, CustomRegexRule } from '../lib/types';
import { Check, Columns, Settings2, Plus, Trash2, Shield, HelpCircle, FileText, ChevronDown, Layers } from 'lucide-react';
import { getSheetData } from '../lib/excel-processor';

interface MaskConfiguratorProps {
  file: ParsedExcelFile;
  onStartProcessing: (config: MaskingConfig) => void;
  onResetFile: () => void;
  onSheetChange: (updatedFile: ParsedExcelFile) => void;
}

export function MaskConfigurator({
  file,
  onStartProcessing,
  onResetFile,
  onSheetChange
}: MaskConfiguratorProps) {
  // Config States
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    file.columns.length > 0 ? [file.columns[0]] : []
  );
  const [outputMode, setOutputMode] = useState<'append_column' | 'replace_column'>('append_column');
  const [customOutputColumnName, setCustomOutputColumnName] = useState<string>('B');
  const [maskCharacter, setMaskCharacter] = useState<string>('*');

  // Rule Toggles
  const [enableChineseName, setEnableChineseName] = useState(true);
  const [enableEnglishName, setEnableEnglishName] = useState(true);
  const [enablePhone, setEnablePhone] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);
  const [enableIdCard, setEnableIdCard] = useState(true);

  // Custom Rules
  const [customRules, setCustomRules] = useState<CustomRegexRule[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [showCustomRuleInput, setShowCustomRuleInput] = useState(false);

  // Column Search
  const [columnSearch, setColumnSearch] = useState('');

  const filteredColumns = file.columns.filter(col =>
    col.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === file.columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns([...file.columns]);
    }
  };

  const handleAddCustomRule = () => {
    if (!newRulePattern) return;
    setCustomRules([
      ...customRules,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: newRuleName || '自訂規則',
        pattern: newRulePattern,
        enabled: true,
      },
    ]);
    setNewRuleName('');
    setNewRulePattern('');
    setShowCustomRuleInput(false);
  };

  const handleDeleteCustomRule = (id: string) => {
    setCustomRules(customRules.filter(r => r.id !== id));
  };

  const handleSheetSelect = (sheetName: string) => {
    if (!file.rawWorkbook) return;
    const { columns, rows } = getSheetData(file.rawWorkbook, sheetName);
    onSheetChange({
      ...file,
      selectedSheet: sheetName,
      columns,
      rows,
      totalRows: rows.length,
    });
    setSelectedColumns(columns.length > 0 ? [columns[columns.length - 1]] : []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColumns.length === 0) return;

    const config: MaskingConfig = {
      targetColumns: selectedColumns,
      outputMode,
      customOutputColumnName: customOutputColumnName || 'B',
      maskCharacter,
      enableChineseName,
      enableEnglishName,
      enablePhone,
      enableEmail,
      enableIdCard,
      customRules,
      chineseMaskStyle: 'standard',
      englishMaskStyle: 'initial_last',
    };

    onStartProcessing(config);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* File Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {file.fileName}
              </h2>
              <p className="text-xs text-slate-500">
                {(file.fileSize / (1024 * 1024)).toFixed(2)} MB · {file.totalRows.toLocaleString()} 列資料 · 約 {file.estimatedWordCount.toLocaleString()} 字
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onResetFile}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            重新選擇檔案
          </button>
        </div>

        {/* Sheet selector if multiple sheets */}
        {file.sheetNames.length > 1 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> 工作表 (Sheet)：
            </span>
            <div className="flex flex-wrap gap-2">
              {file.sheetNames.map((sheet) => (
                <button
                  key={sheet}
                  type="button"
                  onClick={() => handleSheetSelect(sheet)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    file.selectedSheet === sheet
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {sheet}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Target Column(s) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  選擇目標 Excel 欄位 (Target Columns)
                </h3>
                <p className="text-xs text-slate-500">
                  請勾選需進行個資去標識化 / PII 遮蔽的數據欄位（例如 "內容" 或 "反饋"）
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSelectAllColumns}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {selectedColumns.length === file.columns.length ? '取消全選' : '全選所有欄位'}
            </button>
          </div>

          {/* Search bar */}
          {file.columns.length > 5 && (
            <input
              type="text"
              placeholder="搜尋欄位名稱..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          )}

          {/* Columns Chips */}
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {filteredColumns.map((col) => {
              const isSelected = selectedColumns.includes(col);
              return (
                <button
                  type="button"
                  key={col}
                  onClick={() => toggleColumn(col)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{col}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>
              );
            })}
          </div>

          {selectedColumns.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ 請至少勾選 1 個欲遮蔽處理的目標欄位。
            </p>
          )}
        </div>

        {/* Step 2: Detection Rules & Mask Strategy */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                設定個資辨識與遮蔽規則 (PII Masking Rules)
              </h3>
              <p className="text-xs text-slate-500">
                可單獨開關特定個資類型的 NER 辨識或新增自訂正規表達式
              </p>
            </div>
          </div>

          {/* Rule Toggle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chinese Name */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  中文姓名 (Chinese Names)
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  例：「張小明」→「張**」<br />例：「歐陽修」→「歐**」
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableChineseName}
                onChange={(e) => setEnableChineseName(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* English Name */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  英文姓名 (English Names)
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  例：「John Smith」→「John S.」
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableEnglishName}
                onChange={(e) => setEnableEnglishName(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Phone */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  電話/行動號碼 (Phones)
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  例：「0912-345-678」→「0912***678」
                </span>
              </div>
              <input
                type="checkbox"
                checked={enablePhone}
                onChange={(e) => setEnablePhone(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  電子郵件 (Emails)
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  例：「user@test.com」→「u***@test.com」
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableEmail}
                onChange={(e) => setEnableEmail(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer mt-1"
              />
            </div>

            {/* ID Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                  身分證/護照 (National IDs)
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  例：「A123456789」→「A1******89」
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableIdCard}
                onChange={(e) => setEnableIdCard(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Custom Rules */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                自訂正規表達式 (Custom Regex Rules)
              </span>
              <button
                type="button"
                onClick={() => setShowCustomRuleInput(!showCustomRuleInput)}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                新增自訂規則
              </button>
            </div>

            {showCustomRuleInput && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="規則名稱 (例：統一編號)"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    placeholder="RegEx Pattern (例：\b\d{8}\b)"
                    value={newRulePattern}
                    onChange={(e) => setNewRulePattern(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomRuleInput(false)}
                    className="px-3 py-1 rounded-lg text-xs bg-slate-200 dark:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomRule}
                    className="px-3 py-1 rounded-lg text-xs bg-blue-600 text-white font-medium"
                  >
                    儲存規則
                  </button>
                </div>
              </div>
            )}

            {customRules.length > 0 && (
              <div className="space-y-2">
                {customRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
                  >
                    <span className="font-semibold">{rule.name}</span>
                    <span className="font-mono text-slate-500">{rule.pattern}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomRule(rule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mask Symbol & Output Mode options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                遮蔽符號 (Mask Character)
              </label>
              <div className="flex gap-3">
                {['*', 'X', '[MASK]'].map((char) => (
                  <button
                    type="button"
                    key={char}
                    onClick={() => setMaskCharacter(char)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors ${
                      maskCharacter === char
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                輸出檔案格式模式 (Output Mode)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="outputMode"
                    checked={outputMode === 'append_column'}
                    onChange={() => setOutputMode('append_column')}
                    className="accent-blue-600"
                  />
                  <span>新增去標識化目標欄位 (例：輸出至 B 欄或 <code className="font-mono text-blue-600">[Column]_Masked</code>)</span>
                </label>

                {outputMode === 'append_column' && (
                  <div className="pl-6 pt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500">輸出欄位名稱：</span>
                    <input
                      type="text"
                      value={customOutputColumnName}
                      onChange={(e) => setCustomOutputColumnName(e.target.value)}
                      placeholder="例如: B 或 遮蔽結果"
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400 w-36"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs pt-1">
                  <input
                    type="radio"
                    name="outputMode"
                    checked={outputMode === 'replace_column'}
                    onChange={() => setOutputMode('replace_column')}
                    className="accent-blue-600"
                  />
                  <span>直接取代原欄位內容</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Start Execution Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={selectedColumns.length === 0}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Shield className="w-5 h-5" />
            <span>開始全自動個資去標識化 (Start Masking)</span>
          </button>
        </div>
      </form>
    </div>
  );
}

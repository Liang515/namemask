# NameMask Pro - 大容量 Excel 本地個資去標識化系統 (100% Client-Side PII Masking)

NameMask Pro 是一款高效能、完全執行於**使用者瀏覽器記憶體中 (100% Client-Side)** 的 Excel 個人資料 (PII) 脫敏與去標識化 Web 應用程式。專為處理 200 萬字以上、數萬列大容量 Excel / CSV 檔案設計，保證**零資料上傳、完全零伺服器傳輸**。

---

## 🌟 核心功能與特色 (Key Features)

1. **100% 本地運算與零資料上傳 (Privacy & Zero-Upload)**:
   - 所有 Excel 解析、分詞、個資 NER 檢測與二進位導出，皆在使用者瀏覽器記憶體中執行，無任何 API 伺服器端請求。

2. **segmentit 中文姓名 NER & 規則引擎 (Chinese NER & PII Engine)**:
   - 整合 `segmentit` 廣義中文分詞、單/複姓氏字典（含簡體姓氏對應）與情境規則（如「張小明」→「張**」、「歐陽修」→「歐**」）。
   - 內建大量業務詞彙黑名單，並以「常見給名用字」統計特徵作為正向訊號，大幅降低一般詞彙（如「相關通知」「交易金額」）被誤判為人名的機率，同時不犧牲真實姓名的辨識率。
   - 支援英文姓名（「John Smith」→「John S.」）、電話號碼、電子郵件、身分證字號/護照號碼及自訂 RegEx 規則。

3. **高效能非阻塞 Chunked Async 運算 (High Performance Engine)**:
   - 採用 `requestAnimationFrame` 分幀與時間預算（time-budgeted）演算法，在數萬列計算過程中維持流暢 UI 與即時可視進度，即時回報 Rows/sec, Words/sec 與預估剩餘時間。

4. **雙 Excel 報表匯出 (Dual Excel Output)**:
   - 📄 **去標識化數據集 (`[filename]_Masked.xlsx`)**: 包含原始資料與新產生的 `[Column]_Masked` 遮蔽欄位。
   - 📋 **脫敏稽核日誌 (`[filename]_Audit_Log.xlsx`)**: 完整收錄每一筆檢出個資之列號、工作表、原始詞彙、遮蔽詞彙與上下文對照。

---

## 🚀 專案技術棧 (Tech Stack)

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS
- **Excel Library**: `xlsx` (SheetJS)
- **Chinese Segmentation**: `segmentit`
- **UI Icons**: `lucide-react`

---

## 🛠️ 本地開發與建置 (Local Development)

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 測試生產建置
npm run build
```

---

## ☁️ Vercel 一鍵部署步驟 (Deployment Instructions for Vercel)

由於本應用為 **100% Client-Side** 靜態/邊緣友好架構，無須昂貴的 Serverless/Edge 運算資源：

1. **推送到 GitHub**:
   - 專案已成功推至 [https://github.com/Liang515/namemask.git](https://github.com/Liang515/namemask.git)。

2. **在 Vercel 匯入並部署**:
   - 登入 [Vercel Dashboard](https://vercel.com/dashboard)。
   - 點擊 **"Add New..."** → **"Project"**。
   - 選擇您的 GitHub 帳號並 Import `Liang515/namemask` 儲存庫。
   - Framework Preset 選擇 **Next.js**。
   - 點擊 **Deploy** 即可在數十秒內完成全球 CDN 部署。

---

## ⚠️ 已知限制與誤判回報 (Known Limitations & Reporting False Positives/Negatives)

中文姓名辨識沒有標準答案可以做到 100% 準確，本專案採用「姓氏規則 + 分詞引擎 + 詞彙表 + 統計特徵」的組合式策略，而非機器學習模型（考量處理速度與零上傳的隱私承諾）。這代表：

- 若發現某個一般詞彙被誤判為姓名（例如「關於」被切成「關*」），歡迎回報，通常只需在 `lib/pii-engine.ts` 的 `COMMON_VOCABULARY` 加入該詞即可修正。
- 若發現真實姓名沒有被偵測到，也歡迎回報實際句子的結構（可用假名替換真實姓名，但保留標點、上下文用字），有助於快速定位問題。
- 目前的偵測邏輯刻意選擇「寧可多抓一點，也不要漏掉真實姓名」的權衡，因此運行一段時間後仍可能持續發現新的誤判詞彙，這是已知且預期的行為，而非程式錯誤。

---

## 📄 授權條款 (License)

MIT License.

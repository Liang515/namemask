# NameMask Pro - 大容量 Excel 本地個資去標識化系統 (100% Client-Side PII Masking)

NameMask Pro 是一款高效能、完全執行於**使用者瀏覽器記憶體中 (100% Client-Side)** 的 Excel 個人資料 (PII) 脫敏與去標識化 Web 應用程式。專為處理 200 萬字以上、數萬列大容量 Excel / CSV 檔案設計，保證**零資料上傳、完全零伺服器傳輸**。

---

## 🌟 核心功能與特色 (Key Features)

1. **100% 本地運算與零資料上傳 (Privacy & Zero-Upload)**:
   - 所有 Excel 解析、分詞、個資 NER 檢測與二進位導出，皆在使用者瀏覽器記憶體中執行，無任何 API 伺服器端請求。

2. **segmentit 中文姓名 NER & 規則引擎 (Chinese NER & PII Engine)**:
   - 整合 `segmentit` 廣義中文分詞與單/複姓氏字典（如「張小明」→「張**」、「歐陽修」→「歐**」）。
   - 支援英文姓名（「John Smith」→「John S.」）、電話號碼、電子郵件、身分證字號/護照號碼及自訂 RegEx 規則。

3. **高效能非阻塞 Chunked Async 運算 (High Performance Engine)**:
   - 採用 `scheduler.yield()` 與分塊 Async 演算法，在數萬列計算過程中維持 60 FPS 流暢 UI，即時回報 Rows/sec, Words/sec 與預估剩餘時間。

4. **雙 Excel 報表匯出 (Dual Excel Output)**:
   - 📄 **去標識化數據集 (`[filename]_Masked.xlsx`)**: 包含原始資料與新產生的 `[Column]_Masked` 遮蔽欄位。
   - 📋 **脫敏稽核日誌 (`[filename]_Audit_Log.xlsx`)**: 完整收錄每一筆檢出個資之列號、工作表、原始詞彙、遮蔽詞彙與上下文對照。

---

## 🚀 專案技術棧 (Tech Stack)

- **Framework**: Next.js 14+ (App Router, React 19, TypeScript)
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

## 📄 授權條款 (License)

MIT License.

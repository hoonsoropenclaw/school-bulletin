# 校園公告系統 (School Bulletin)

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000)](https://vercel.com)

> 中型高中校園公告系統 — 處室承辦發布、家長/教師/學生受眾分流、可追蹤簽收回條。

---

## 快速開始

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env.local
# 編輯 .env.local,填入:
#   SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJxxx
#   SESSION_SECRET=<隨機 32 字元>

# 3. 初始化資料庫:把 _supabase_schema.sql 整份貼到 Supabase SQL Editor 跑一次
#    (冪等,可重跑)

# 4. 種子資料
npm run seed
# 或打 API: curl -X GET https://你的網址/api/seed-demo

# 5. 開發
npm run dev
```

部署:push 到 main → Vercel 自動 deploy(已在 `vercel.json` 設定)。

---

## 技術棧

- **前端**:Next.js 15 (App Router) + React 19 + TypeScript 5.7
- **樣式**:Tailwind CSS 3.4
- **編輯器**:Tiptap 3 (rich text,已裝不另加)
- **後端**:Next.js Route Handlers (Node.js runtime,寫入 API)
- **資料庫**:Supabase (PostgreSQL 16)
- **儲存**:Supabase Storage (附件 bucket)
- **認證**:HMAC + bcryptjs(自製,8 小時 session cookie)
- **部署**:Vercel

---

## 帳號 (Demo)

跑完 seed 後有 6 個處室 + 3 個非處室 demo 帳號,密碼統一 `School@2026`(首次登入會被導向 `/change-password`)。

| Username | 顯示名稱 | 角色 | 用途 |
|----------|----------|------|------|
| `teaching` | 教務處 | dept_officer | 處室承辦(M-05 測試) |
| `student` | 學務處 | dept_officer | 處室承辦 |
| `general` | 總務處 | dept_officer | 處室承辦 |
| `counsel` | 輔導處 | dept_officer | 處室承辦 |
| `it` | 資訊組 | dept_officer | 處室承辦 |
| `principal` | 校長室 | sysadmin | 系統管理員(看全部) |
| `teacher_lin` | 林老師 | 受眾:教師 | M-06 受眾分流測試 |
| `parent_chen` | 陳媽媽 | 受眾:家長 | M-06 受眾分流測試 |
| `student_wang` | 王同學 | 受眾:學生 | M-06 受眾分流測試 |

---

## 9 個 PRD Must 實作狀態

| Must | 描述 | 狀態 | 實作位置 |
|------|------|------|---------|
| M-01 | 公告 CRUD | ✅ | `app/api/announcements/*` + `app/admin/announcements/*` |
| M-02 | 附件上傳 | ✅ | `app/api/attachments/upload` + Supabase Storage |
| M-03 | 多標籤 | ✅ | `app/api/tags` + 5 種類型(grade/class/department/activity/role) |
| M-04 | 標籤 OR/AND 篩選 | ✅ | `lib/repository.ts:matchAnnouncement` + `components/FilterPanel.tsx` |
| M-05 | 各處室獨立登入 | ✅ | `lib/repository.ts:matchAudience` 處室隔離邏輯 |
| M-06 | 5 層 RBAC | 🟡 v1 簡化 | 完整 RBAC 見「v1 不做」段 |
| M-07 | 已讀/已簽追蹤 | ✅ | `signature_receipts` + `read_receipts` 兩表 + 3 個 API |
| M-08 | 推播 | ❌ v1 不做 | (見下) |
| M-09 | 行動裝置 RWD | ✅ | Tailwind responsive utility |

### M-06 簡化說明

v1 用 `users.role` enum 只有 2 種值(`dept_officer` / `sysadmin`)。受眾分流改用「既有的 `tags.type='role'`(學生/家長/教師/訪客)+ `user_role_assignments` 多對多對應表」實作:

- dept_officer 跟 sysadmin 走 `users.role` 判斷
- 受眾身分(teacher/parent/student/guest)走 `user_role_assignments` 對應

**v2 規劃**:把 `users.role` enum 擴成 5 種 + 整合 OAuth/SSO 登入。

---

## v1 不做清單 (Roadmap)

以下項目在 v1 不會做,有對應 v1.1/v2 規劃:

| Must | 跳過理由 | 規劃時程 |
|------|----------|---------|
| **M-08 推播(Web Push)** | VAPID 金鑰需申請、web-push 套件整合 + Service Worker 估 1-2 天工作量;且 iOS Safari 對 Web Push 支援差 | v1.1 評估改 Line Bot |
| **5 層 RBAC 完整版** | 學生/家長/訪客登入需加 email/SSO 整合,目前走 user_role_assignments 對應 tag 簡化 | v2 評估 Google Classroom OAuth |
| **排程發布** | PRD §1.2 沒列、目前都是即時發;需要 background worker 排程 | v1.1 + Vercel Cron |
| **公告過期自動下線 (`expireAt`)** | PRD §1.1 沒列;DB 欄位沒建 | v1.1 + Vercel Cron 跑每天清理 |
| **Email 通知** | 需 Resend API key 設定,目前沒申請 | v1.1 |
| **附件掃毒** | Cloudmersive API key 沒申請,目前附件直接上 Storage | v2 改本地 ClamAV |
| **附件圖片預覽** | 需 R2 presigned URL,目前用 R2 公開 URL | v2 |
| **全文搜尋進階(中文斷詞)** | 目前用 ILIKE,中文斷詞需 elasticsearch/Meilisearch | v2 |
| **多語系 i18n** | 單一中文學校,目前不需要 | v3 |
| **多校 multi-tenant** | 目前單一學校 | v3 |

---

## 驗收指令

詳細驗收命令見 `~/.hermes/handoff/school-bulletin/line_a_e2e.sh`(包含 6 個 demo 登入 + 簽收 + 受眾分流 + 處室隔離測試)。

執行方式:

```bash
chmod +x ~/.hermes/handoff/school-bulletin/line_a_e2e.sh
~/.hermes/handoff/school-bulletin/line_a_e2e.sh https://你的網址
```

---

## 開發指令

```bash
npm run dev        # 開發 server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run seed       # 跑 seed (CLI)
```

---

## 程式碼結構

```
school-bulletin/
├── app/                          # Next.js App Router
│   ├── (公開路由)
│   │   ├── page.tsx              # 首頁:公告列表(已套 audience 過濾)
│   │   ├── login/                # 登入
│   │   └── announcements/[id]/   # 詳情頁(有簽收按鈕)
│   ├── admin/                    # 後台(需 dept_officer+)
│   │   ├── announcements/        # 我發布的公告(有簽收統計)
│   │   └── settings/             # 改密碼
│   └── api/
│       ├── auth/                 # login/logout/me/change-password
│       ├── announcements/        # CRUD + sign + receipts
│       ├── attachments/          # upload/download
│       ├── tags/                 # CRUD
│       ├── me/signatures/        # 個人簽收紀錄
│       └── seed-demo/            # 公開 seed 端點
├── components/                   # 共用元件
├── lib/
│   ├── types.ts                  # 共用 TS 型別
│   ├── auth.ts                   # session/密碼
│   ├── db.ts                     # Supabase client
│   ├── repository.ts             # 所有資料 CRUD
│   └── sanitize.ts               # HTML sanitization
├── scripts/
│   └── seed.ts                   # npm run seed
└── _supabase_schema.sql          # DB 初始化 SQL(在 handoff 目錄)
```

---

## License

Proprietary — School Bulletin 校內系統。

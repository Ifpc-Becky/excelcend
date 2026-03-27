# ExcelCend — MVP セットアップガイド

## 技術スタック
- **Next.js 15** (App Router / TypeScript)
- **Supabase** (Auth / Database / Storage)
- **Tailwind CSS v3**
- **Lucide React** (アイコン)

---

## セットアップ手順

### 1. 依存関係をインストール
```bash
npm install
```

### 2. Supabaseプロジェクトを作成
1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. Project Settings → API から以下を取得:
   - `Project URL`
   - `anon public` キー

### 3. 環境変数を設定
`.env.local` を編集:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. DBスキーマを適用
Supabaseダッシュボード → SQL Editor で `supabase/schema.sql` の内容を実行

### 5. Supabase Auth設定
- Authentication → Providers → Email: 有効化
- （任意）Email confirmation: 開発中はオフ推奨

### 6. 開発サーバー起動
```bash
npm run dev
```
→ http://localhost:3000 を開く

---

## フォルダ構成
```
excelcend/
├── src/
│   ├── app/
│   │   ├── (app)/                  # 認証済みレイアウト
│   │   │   ├── layout.tsx          # サイドバー+ヘッダー
│   │   │   ├── dashboard/page.tsx  # ダッシュボード
│   │   │   ├── logs/page.tsx       # 送信ログ
│   │   │   ├── customers/page.tsx  # 顧客管理
│   │   │   └── settings/page.tsx   # 設定
│   │   ├── auth/
│   │   │   ├── layout.tsx          # 認証画面レイアウト
│   │   │   ├── login/page.tsx      # ログイン
│   │   │   └── signup/page.tsx     # 新規登録
│   │   ├── globals.css
│   │   ├── layout.tsx              # ルートレイアウト
│   │   └── page.tsx                # / → /dashboard リダイレクト
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx         # 左サイドバー
│   │       └── Header.tsx          # 上部ヘッダー
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # ブラウザ用クライアント
│   │       └── server.ts           # サーバー用クライアント
│   └── middleware.ts               # 認証ルーティング
├── supabase/
│   └── schema.sql                  # DBスキーマ
├── .env.local                      # 環境変数（要設定）
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 実装済み機能（Step 1）
- [x] メールアドレス＋パスワード認証（Supabase Auth）
- [x] ログイン / 新規登録画面
- [x] 認証ミドルウェア（未ログインは /auth/login へリダイレクト）
- [x] 左サイドバーナビゲーション
- [x] 上部ヘッダー（プラン表示・ユーザーメニュー・ログアウト）
- [x] ダッシュボード（統計・クイックアクション・送信履歴）
- [x] 送信ログ・顧客管理・設定ページ（ダミー表示）

## 次のステップ（Step 2 以降）
- [ ] Excel → PDF変換（SheetJS + jsPDF）
- [ ] ファイルアップロード（Supabase Storage）
- [ ] メール送信（Resend または SendGrid）
- [ ] 顧客CRUD（Supabase DB連携）
- [ ] 送信ログのDB保存・取得
